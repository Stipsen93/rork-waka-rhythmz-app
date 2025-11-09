import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Folder aanmaken mislukt: ${uploadError.message}`,
        });
      }
      
      console.log('[FOLDER SUCCESS]:', input.folderPath, 'Data:', data);
      return { success: true, folderPath: input.folderPath };
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
