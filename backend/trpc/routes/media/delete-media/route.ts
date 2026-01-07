import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/backend/supabaseAdmin";
import { z } from "zod";

export const deleteMediaRoute = publicProcedure
  .input(z.object({
    id: z.string(),
    storagePath: z.string(),
  }))
  .mutation(async ({ input }) => {
    console.log('[Media] Deleting media:', input.id);
    
    const { error: storageError } = await supabaseAdmin.storage
      .from('media-library')
      .remove([input.storagePath]);
    
    if (storageError) {
      console.error('[Media] Error deleting from storage:', storageError);
      throw new Error('Failed to delete file from storage');
    }
    
    const { error: dbError } = await supabaseAdmin
      .from('media_library')
      .delete()
      .eq('id', input.id);
    
    if (dbError) {
      console.error('[Media] Error deleting from database:', dbError);
      throw new Error('Failed to delete file metadata');
    }
    
    console.log('[Media] Successfully deleted media:', input.id);
    
    return { success: true };
  });
