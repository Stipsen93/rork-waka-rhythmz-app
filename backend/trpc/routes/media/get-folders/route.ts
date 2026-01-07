import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/backend/supabaseAdmin";

export const getFoldersRoute = publicProcedure.query(async () => {
  console.log('[Media] Getting all folders');
  
  const { data: foldersFromDb, error: foldersError } = await supabaseAdmin
    .from('media_folders')
    .select('*')
    .order('folder_path', { ascending: true });
  
  if (foldersError) {
    console.error('[Media] Error getting folders from DB:', foldersError);
    throw new Error(`Database fout: ${foldersError.message}`);
  }
  
  const folderSet = new Set<string>();
  
  (foldersFromDb as any[] | null | undefined)?.forEach((folder: any) => {
    folderSet.add(folder.folder_path);
  });
  
  const { data: mediaFiles, error: mediaError } = await supabaseAdmin
    .from('media_library')
    .select('folder_path');
  
  if (!mediaError && mediaFiles) {
    (mediaFiles as any[]).forEach((item: any) => {
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
