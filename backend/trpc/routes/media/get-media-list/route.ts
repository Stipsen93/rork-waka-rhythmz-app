import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

export const getMediaListRoute = publicProcedure
  .input(z.object({
    folderPath: z.string().optional().default(''),
  }))
  .query(async ({ input }) => {
    console.log('[Media] Getting media list for folder:', input.folderPath);
    
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .eq('folder_path', input.folderPath)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[Media] Error getting media list:', error);
      throw new Error('Failed to get media list');
    }
    
    console.log(`[Media] Found ${data?.length || 0} items`);
    
    return data || [];
  });
