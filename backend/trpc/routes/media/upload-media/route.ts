import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { TRPCError } from "@trpc/server";

type MediaInsert = Database['public']['Tables']['media_library']['Insert'];
type MediaRow = Database['public']['Tables']['media_library']['Row'];

export const uploadMediaRoute = publicProcedure
  .input(z.object({
    name: z.string(),
    folderPath: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    base64Data: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      console.log('[UPLOAD START] ====================');
      console.log('[UPLOAD START] Name:', input.name);
      console.log('[UPLOAD START] Folder:', input.folderPath);
      console.log('[UPLOAD START] Type:', input.fileType);
      console.log('[UPLOAD START] Size:', input.fileSize);
      console.log('[UPLOAD START] Base64 length:', input.base64Data.length);
      
      console.log('[UPLOAD] Testing Supabase connection...');
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
      if (bucketsError) {
        console.error('[UPLOAD ERROR] Cannot list buckets:', JSON.stringify(bucketsError, null, 2));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Supabase verbinding mislukt: ${bucketsError.message}`,
        });
      }
      console.log('[UPLOAD] Supabase connection OK, found buckets:', buckets?.map(b => b.name).join(', '));
      
      const timestamp = Date.now();
      const sanitizedName = input.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = input.folderPath 
        ? `${input.folderPath}/${timestamp}_${sanitizedName}`
        : `${timestamp}_${sanitizedName}`;
      
      console.log('[UPLOAD] Storage path:', storagePath);
      
      const base64Data = input.base64Data.includes(',') 
        ? input.base64Data.split(',')[1] 
        : input.base64Data;
      
      let binaryData: Buffer;
      try {
        binaryData = Buffer.from(base64Data, 'base64');
        console.log('[UPLOAD] Binary data size:', binaryData.length);
      } catch (decodeError) {
        console.error('[UPLOAD ERROR] Failed to decode base64:', decodeError);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Ongeldige base64 data',
        });
      }
      
      console.log('[UPLOAD] Uploading to Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('media-library')
        .upload(storagePath, binaryData, {
          contentType: input.mimeType,
          upsert: false,
        });
      
      if (uploadError) {
        console.error('[UPLOAD ERROR] Storage error:', JSON.stringify(uploadError, null, 2));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Storage upload mislukt: ${uploadError.message}`,
        });
      }
      
      if (!uploadData) {
        console.error('[UPLOAD ERROR] No upload data returned');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Geen data ontvangen van storage',
        });
      }
      
      console.log('[UPLOAD SUCCESS] File uploaded:', uploadData.path);
      
      console.log('[DATABASE] Inserting metadata...');
      
      const insertData: MediaInsert = {
        name: input.name,
        path: storagePath,
        folder_path: input.folderPath || '',
        file_type: input.fileType,
        file_size: input.fileSize,
        mime_type: input.mimeType,
        storage_path: storagePath,
        uploaded_by: null,
      };
      
      const { data: mediaData, error: dbError } = await supabaseAdmin
        .from('media_library')
        .insert(insertData as any)
        .select()
        .single();
      
      if (dbError) {
        console.error('[DATABASE ERROR]:', JSON.stringify(dbError, null, 2));
        console.log('[CLEANUP] Removing uploaded file...');
        await supabaseAdmin.storage.from('media-library').remove([storagePath]);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Database fout: ${dbError.message}`,
        });
      }
      
      if (!mediaData) {
        console.error('[DATABASE ERROR] No data returned after insert');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Geen data ontvangen van database',
        });
      }
      
      const result = mediaData as unknown as MediaRow;
      console.log('[SUCCESS] Media uploaded with ID:', result.id);
      return result;
    } catch (error: any) {
      console.error('[UPLOAD EXCEPTION]:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Unknown upload error',
      });
    }
  });
