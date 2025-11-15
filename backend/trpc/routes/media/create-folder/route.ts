import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Database } from "@/lib/database.types";

export const createFolderRoute = publicProcedure
  .input(z.object({
    folderPath: z.string(),
    createdBy: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      console.log('[FOLDER] Creating folder:', input.folderPath);
      
      const placeholderPath = `${input.folderPath}/.emptyFolderPlaceholder`;
      const placeholderContent = new Uint8Array(0);
      
      console.log('[FOLDER] Uploading placeholder to storage:', placeholderPath);
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('media-library')
        .upload(placeholderPath, placeholderContent, {
          contentType: 'application/octet-stream',
          upsert: true,
        });
      
      if (uploadError && !uploadError.message.includes('already exists')) {
        console.error('[FOLDER STORAGE ERROR]:', JSON.stringify(uploadError));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Folder aanmaken mislukt (storage): ${uploadError.message}`,
        });
      }
      
      console.log('[FOLDER] Inserting into database...');
      
      const insertData: Database['public']['Tables']['media_library']['Insert'] = {
        name: '.emptyFolderPlaceholder',
        path: placeholderPath,
        folder_path: input.folderPath,
        file_type: 'other',
        file_size: 0,
        mime_type: 'text/plain',
        storage_path: placeholderPath,
        uploaded_by: input.createdBy || null,
      };
      
      const { data: mediaData, error: dbError } = await supabaseAdmin
        .from('media_library')
        .insert(insertData)
        .select()
        .single();
      
      if (dbError && !dbError.message.includes('duplicate')) {
        console.error('[FOLDER DB ERROR]:', JSON.stringify(dbError));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Database fout: ${dbError.message}`,
        });
      }
      
      console.log('[FOLDER SUCCESS]:', input.folderPath);
      return { success: true, folderPath: input.folderPath, mediaData };
    } catch (error: any) {
      console.error('[FOLDER EXCEPTION]:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Unknown error creating folder',
      });
    }
  });
