import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

export const createFolderRoute = publicProcedure
  .input(z.object({
    folderPath: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      console.log('[FOLDER] Creating folder:', input.folderPath);
      
      const placeholderPath = `${input.folderPath}/.keep`;
      const placeholderContent = new Uint8Array(0);
      
      console.log('[FOLDER] Uploading placeholder:', placeholderPath);
      
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from('media-library')
        .upload(placeholderPath, placeholderContent, {
          contentType: 'application/octet-stream',
          upsert: true,
        });
      
      if (uploadError) {
        console.error('[FOLDER ERROR]:', JSON.stringify(uploadError));
        throw new Error(`Folder aanmaken mislukt: ${uploadError.message}`);
      }
      
      console.log('[FOLDER SUCCESS]:', input.folderPath, 'Data:', data);
      return { success: true, folderPath: input.folderPath };
    } catch (error: any) {
      console.error('[FOLDER EXCEPTION]:', error);
      throw new Error(error?.message || 'Unknown error creating folder');
    }
  });
