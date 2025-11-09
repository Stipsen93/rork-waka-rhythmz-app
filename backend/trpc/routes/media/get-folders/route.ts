import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const getFoldersRoute = publicProcedure.query(async () => {
  console.log('[Media] Getting all folders');
  
  const folderSet = new Set<string>();
  
  const { data, error } = await supabase
    .from('media_library')
    .select('folder_path');
  
  if (error) {
    console.error('[Media] Error getting folders from DB:', error);
    throw new Error(`Database fout: ${error.message}`);
  }
  
  data?.forEach((item: { folder_path: string | null }) => {
    if (item.folder_path) {
      const parts = item.folder_path.split('/').filter(Boolean);
      let currentPath = '';
      
      parts.forEach((part: string) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        folderSet.add(currentPath);
      });
    }
  });
  
  const folders = Array.from(folderSet).sort();
  console.log(`[Media] Found ${folders.length} unique folders`);
  
  return folders;
});
