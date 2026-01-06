import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { TRPCError } from "@trpc/server";

type MediaInsert = Database['public']['Tables']['media_library']['Insert'];
type MediaRow = Database['public']['Tables']['media_library']['Row'];

const MAX_FILE_SIZE = 400 * 1024 * 1024;

export const uploadMediaRoute = publicProcedure
  .input(
    z.object({
      name: z.string().min(1),
      folderPath: z.string().optional().default(''),
      fileType: z.string().optional().default('other'),
      fileSize: z.number().nonnegative(),
      mimeType: z.string().optional().default('application/octet-stream'),
      base64Data: z.string().min(1),
      uploadedBy: z.string().optional(),
      visibleToAll: z.boolean().optional().default(true),
      visibleToUserIds: z.array(z.string()).optional().default([]),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      console.log('[MEDIA UPLOAD] start', {
        name: input.name,
        folderPath: input.folderPath,
        fileType: input.fileType,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        base64Length: input.base64Data.length,
      });

      if (input.fileSize > MAX_FILE_SIZE) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bestand is te groot. Maximum toegestane grootte is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        });
      }

      const timestamp = Date.now();
      const safeName = input.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folder = input.folderPath.trim().replace(/^\/+|\/+$/g, '');
      const storagePath = folder ? `${folder}/${timestamp}_${safeName}` : `${timestamp}_${safeName}`;

      const base64 = input.base64Data.includes(',') ? input.base64Data.split(',')[1] : input.base64Data;

      let binary: Buffer;
      try {
        binary = Buffer.from(base64, 'base64');
      } catch (err) {
        console.error('[MEDIA UPLOAD] invalid base64', err);
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ongeldige base64 data' });
      }

      if (binary.length <= 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Leeg bestand' });
      }

      console.log('[MEDIA UPLOAD] uploading to storage', { storagePath, bytes: binary.length });

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('media-library')
        .upload(storagePath, binary, {
          contentType: input.mimeType,
          upsert: false,
        });

      if (uploadError || !uploadData) {
        console.error('[MEDIA UPLOAD] storage error', uploadError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Storage upload mislukt: ${uploadError?.message ?? 'unknown'}`,
        });
      }

      const insertData: MediaInsert = {
        name: input.name,
        path: storagePath,
        folder_path: folder,
        file_type: input.fileType,
        file_size: input.fileSize,
        mime_type: input.mimeType,
        storage_path: storagePath,
        uploaded_by: input.uploadedBy ?? null,
        visible_to_all: input.visibleToAll,
        visible_to_user_ids: input.visibleToAll ? [] : input.visibleToUserIds,
      };

      console.log('[MEDIA UPLOAD] inserting db row', insertData);

      const { data: row, error: dbError } = await supabaseAdmin
        .from('media_library')
        .insert(insertData as any)
        .select('*')
        .single();

      if (dbError || !row) {
        console.error('[MEDIA UPLOAD] db error, cleaning up storage', dbError);
        await supabaseAdmin.storage.from('media-library').remove([storagePath]);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Database fout: ${dbError?.message ?? 'unknown'}`,
        });
      }

      const result = row as unknown as MediaRow;

      console.log('[MEDIA UPLOAD] success', { id: result.id, storagePath });

      return {
        id: result.id,
        name: result.name,
        path: result.path,
        folder_path: result.folder_path,
        file_type: result.file_type,
        file_size: result.file_size,
        mime_type: result.mime_type,
        storage_path: result.storage_path,
        uploaded_by: result.uploaded_by,
        created_at: result.created_at,
      };
    } catch (error: any) {
      console.error('[MEDIA UPLOAD] exception', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Upload mislukt',
      });
    }
  });
