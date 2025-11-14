import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/lib/supabase";

import type { Database } from "@/lib/database.types";

type MediaInsert = Database['public']['Tables']['media_library']['Insert'];

export const syncStorageRoute = publicProcedure
  .mutation(async () => {
    try {
      console.log('[SYNC] Starting storage sync...');
      
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('media-library')
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (listError) {
        console.error('[SYNC ERROR] Failed to list files:', listError);
        throw new Error(`Failed to list storage files: ${listError.message}`);
      }
      
      console.log(`[SYNC] Found ${files.length} files in storage`);
      
      async function processFolder(folderPath: string = ''): Promise<void> {
        const { data: items, error } = await supabaseAdmin.storage
          .from('media-library')
          .list(folderPath, {
            limit: 1000,
          });
        
        if (error) {
          console.error(`[SYNC ERROR] Failed to list folder ${folderPath}:`, error);
          return;
        }
        
        for (const item of items) {
          const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
          
          if (item.id === null) {
            await processFolder(itemPath);
            continue;
          }
          
          if (item.name === '.emptyFolderPlaceholder') {
            continue;
          }
          
          const { data: existing, error: checkError } = await supabaseAdmin
            .from('media_library')
            .select('id')
            .eq('storage_path', itemPath)
            .maybeSingle();
          
          if (checkError) {
            console.error(`[SYNC ERROR] Failed to check existing record for ${itemPath}:`, checkError);
            continue;
          }
          
          if (existing) {
            console.log(`[SYNC] Skipping ${itemPath} - already in database`);
            continue;
          }
          
          console.log(`[SYNC] Creating database record for ${itemPath}...`);
          
          let fileType = 'other';
          const mimeType = item.metadata?.mimetype || 'application/octet-stream';
          if (mimeType.startsWith('video/')) fileType = 'video';
          else if (mimeType.startsWith('image/')) fileType = 'image';
          else if (mimeType.startsWith('audio/')) fileType = 'audio';
          
          const folderPathParts = itemPath.split('/');
          folderPathParts.pop();
          const folderPathValue = folderPathParts.join('/');
          
          const insertData: MediaInsert = {
            name: item.name,
            path: itemPath,
            folder_path: folderPathValue,
            file_type: fileType,
            file_size: item.metadata?.size || 0,
            mime_type: mimeType,
            storage_path: itemPath,
            uploaded_by: null,
          };
          
          const { error: insertError } = await supabaseAdmin
            .from('media_library')
            .insert(insertData as any);
          
          if (insertError) {
            console.error(`[SYNC ERROR] Failed to insert record for ${itemPath}:`, insertError);
            continue;
          }
          
          console.log(`[SYNC] ✅ Created record for ${itemPath}`);
        }
      }
      
      await processFolder();
      
      console.log('[SYNC] ✅ Storage sync completed');
      
      return { success: true };
    } catch (error: any) {
      console.error('[SYNC EXCEPTION]:', error);
      throw new Error(error?.message || 'Unknown sync error');
    }
  });
