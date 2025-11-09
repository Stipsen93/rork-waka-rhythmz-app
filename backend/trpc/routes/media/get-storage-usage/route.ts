import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/lib/supabase";

export const getStorageUsageRoute = publicProcedure.query(async () => {
  console.log('[Media] Getting storage usage');
  
  const { data, error } = await supabase.rpc('get_storage_usage');
  
  if (error) {
    console.error('[Media] Error getting storage usage:', error);
    throw new Error('Failed to get storage usage');
  }
  
  const usageBytes = data || 0;
  const maxBytes = 100 * 1024 * 1024 * 1024;
  const usageGB = usageBytes / (1024 * 1024 * 1024);
  const percentage = (usageBytes / maxBytes) * 100;
  
  console.log(`[Media] Storage usage: ${usageGB.toFixed(2)} GB / 100 GB (${percentage.toFixed(1)}%)`);
  
  return {
    usageBytes,
    usageGB: parseFloat(usageGB.toFixed(2)),
    maxGB: 100,
    percentage: parseFloat(percentage.toFixed(1)),
  };
});
