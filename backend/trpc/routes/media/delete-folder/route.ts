import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const deleteFolderRoute = publicProcedure
  .input(z.object({
    folderPath: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      console.log('[FOLDER DELETE] Deleting folder:', input.folderPath);
      
      const { data: filesInFolder, error: filesError } = await supabaseAdmin
        .from('media_library')
        .select('id')
        .eq('folder_path', input.folderPath);
      
      if (filesError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Fout bij controleren folder: ${filesError.message}`,
        });
      }
      
      if (filesInFolder && filesInFolder.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Kan folder niet verwijderen: bevat nog bestanden',
        });
      }
      
      const { data: subfolders, error: subfoldersError } = await supabaseAdmin
        .from('media_folders')
        .select('id')
        .eq('parent_path', input.folderPath);
      
      if (subfoldersError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Fout bij controleren submappen: ${subfoldersError.message}`,
        });
      }
      
      if (subfolders && subfolders.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Kan folder niet verwijderen: bevat nog submappen',
        });
      }
      
      const { error: dbError } = await supabaseAdmin
        .from('media_folders')
        .delete()
        .eq('folder_path', input.folderPath);
      
      if (dbError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Folder verwijderen mislukt: ${dbError.message}`,
        });
      }
      
      const placeholderPath = `${input.folderPath}/.keep`;
      const { error: storageError } = await supabaseAdmin.storage
        .from('media-library')
        .remove([placeholderPath]);
      
      if (storageError) {
        console.warn('[FOLDER DELETE STORAGE WARNING]:', JSON.stringify(storageError));
      }
      
      console.log('[FOLDER DELETE SUCCESS]:', input.folderPath);
      return { success: true };
    } catch (error: any) {
      console.error('[FOLDER DELETE EXCEPTION]:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Unknown error deleting folder',
      });
    }
  });
