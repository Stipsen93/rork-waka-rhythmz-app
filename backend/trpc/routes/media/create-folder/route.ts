import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

export const createFolderRoute = publicProcedure
  .input(z.object({
    folderPath: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Media] Creating folder:', input.folderPath);
    
    try {
      const placeholderPath = `${input.folderPath}/.folder`;
      
      const placeholderContent = new Uint8Array([]);
      
      console.log('[Media] Creating placeholder file:', placeholderPath);
      
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(placeholderPath, placeholderContent, {
          contentType: 'application/octet-stream',
          upsert: true,
        });
      
      if (uploadError) {
        console.error('[Media] Error creating folder:', uploadError);
        throw new Error(`Folder aanmaken mislukt: ${uploadError.message}`);
      }
      
      console.log('[Media] Folder created successfully:', input.folderPath);
      
      return { success: true, folderPath: input.folderPath };
    } catch (error) {
      console.error('[Media] Create folder error:', error);
      if (error instanceof Error) {
        throw new Error(`Folder aanmaken mislukt: ${error.message}`);
      }
      throw new Error('Folder aanmaken mislukt: Onbekende fout');
    }
  });
