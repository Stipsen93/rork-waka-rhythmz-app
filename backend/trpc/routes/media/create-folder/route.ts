import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const createFolderRoute = publicProcedure
  .input(z.object({
    folderPath: z.string(),
    createdBy: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      console.log('[FOLDER] Creating folder:', input.folderPath);
      
      const pathParts = input.folderPath.split('/').filter(Boolean);
      const folderName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : null;
      
      const { data: existingFolder } = await supabaseAdmin
        .from('media_folders')
        .select('id')
        .eq('folder_path', input.folderPath)
        .single();
      
      if (existingFolder) {
        console.log('[FOLDER] Folder already exists:', input.folderPath);
        return { success: true, folderPath: input.folderPath, existed: true };
      }
      
      const { data: folder, error: dbError } = await supabaseAdmin
        .from('media_folders')
        .insert({
          name: folderName,
          folder_path: input.folderPath,
          parent_path: parentPath,
          created_by: input.createdBy || null,
        })
        .select()
        .single();
      
      if (dbError) {
        console.error('[FOLDER DB ERROR]:', JSON.stringify(dbError));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Folder aanmaken mislukt: ${dbError.message}`,
        });
      }
      
      const placeholderPath = `${input.folderPath}/.keep`;
      const placeholderContent = new Uint8Array(0);
      
      console.log('[FOLDER] Uploading placeholder:', placeholderPath);
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('media-library')
        .upload(placeholderPath, placeholderContent, {
          contentType: 'application/octet-stream',
          upsert: true,
        });
      
      if (uploadError) {
        console.warn('[FOLDER STORAGE WARNING]:', JSON.stringify(uploadError));
      }
      
      console.log('[FOLDER SUCCESS]:', input.folderPath);
      return { success: true, folderPath: input.folderPath, folder };
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
