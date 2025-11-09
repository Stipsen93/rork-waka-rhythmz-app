import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const getFoldersRoute = publicProcedure.query(async () => {
  console.log('[Media] Getting all folders');
  
  const folderSet = new Set<string>();
  
  const { data: storageList, error: storageError } = await supabase
    .storage
    .from('media-library')
    .list('', {
      limit: 1000,
      offset: 0,
    });
  
  if (storageError) {
    console.error('[Media] Error listing storage:', storageError);
  } else {
    storageList?.forEach((item) => {
      if (item.id) {
        folderSet.add(item.name);
      }
    });
  }
  
  async function listAllFolders(prefix: string = '') {
    const { data: files, error } = await supabase
      .storage
      .from('media-library')
      .list(prefix, {
        limit: 1000,
        offset: 0,
      });
    
    if (error) {
      console.error(`[Media] Error listing folder ${prefix}:`, error);
      return;
    }
    
    for (const file of files || []) {
      const fullPath = prefix ? `${prefix}/${file.name}` : file.name;
      
      if (file.id && !file.name.includes('.')) {
        folderSet.add(fullPath);
        await listAllFolders(fullPath);
      }
    }
  }
  
  await listAllFolders();
  
  const { data, error } = await supabase
    .from('media_library')
    .select('folder_path');
  
  if (error) {
    console.error('[Media] Error getting folders from DB:', error);
  } else {
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
  }
  
  const folders = Array.from(folderSet).sort();
  console.log(`[Media] Found ${folders.length} unique folders`);
  
  return folders;
});
