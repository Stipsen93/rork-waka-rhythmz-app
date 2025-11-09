import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

export const createFolderRoute = publicProcedure
  .input(z.object({
    folderPath: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('[FOLDER] Creating folder:', input.folderPath);
    
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
      console.error('[FOLDER ERROR]:', uploadError);
      throw new Error(`Folder aanmaken mislukt: ${uploadError.message}`);
    }
    
    console.log('[FOLDER SUCCESS]:', input.folderPath);
    return { success: true, folderPath: input.folderPath };
  });
