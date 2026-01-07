import { publicProcedure } from "@/backend/trpc/create-context";
import { supabaseAdmin } from "@/backend/supabaseAdmin";

export const getStorageUsageRoute = publicProcedure.query(async () => {
  console.log('[Media] Getting storage usage from media-library bucket');
  
  try {

    const calculateFolderSize = async (folderPath: string = ''): Promise<number> => {
      const { data: items, error } = await supabaseAdmin.storage
        .from('media-library')
        .list(folderPath, {
          limit: 100000,
          offset: 0,
        });

      if (error || !items) {
        console.error('[Media] Error listing folder:', folderPath, error);
        return 0;
      }

      let totalSize = 0;

      for (const item of items) {
        if (item.metadata) {
          totalSize += item.metadata.size || 0;
        } else {
          const subFolderPath = folderPath ? `${folderPath}/${item.name}` : item.name;
          const subFolderSize = await calculateFolderSize(subFolderPath);
          totalSize += subFolderSize;
        }
      }

      return totalSize;
    };

    const usageBytes = await calculateFolderSize();
    const maxBytes = 100 * 1024 * 1024 * 1024;
    const usageGB = usageBytes / (1024 * 1024 * 1024);
    const percentage = (usageBytes / maxBytes) * 100;
    
    console.log(`[Media] Storage usage: ${usageGB.toFixed(3)} GB / 100 GB (${percentage.toFixed(2)}%)`);
    
    return {
      usageBytes,
      usageGB: parseFloat(usageGB.toFixed(3)),
      maxGB: 100,
      percentage: parseFloat(percentage.toFixed(2)),
    };
  } catch (error: any) {
    console.error('[Media] Error getting storage usage:', error);
    return {
      usageBytes: 0,
      usageGB: 0,
      maxGB: 100,
      percentage: 0,
    };
  }
});
