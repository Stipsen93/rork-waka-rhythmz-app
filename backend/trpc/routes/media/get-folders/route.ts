import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const getFoldersRoute = publicProcedure.query(async () => {
  console.log('[Media] Getting all folders');
  
  const { data, error } = await supabase
    .from('media_library')
    .select('folder_path');
  
  if (error) {
    console.error('[Media] Error getting folders:', error);
    throw new Error('Failed to get folders');
  }
  
  const folderSet = new Set<string>();
  
  data?.forEach((item) => {
    if (item.folder_path) {
      const parts = item.folder_path.split('/').filter(Boolean);
      let currentPath = '';
      
      parts.forEach((part) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        folderSet.add(currentPath);
      });
    }
  });
  
  const folders = Array.from(folderSet).sort();
  console.log(`[Media] Found ${folders.length} unique folders`);
  
  return folders;
});
