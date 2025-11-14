import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export const getUserTokensProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
    })
  )
  .query(async ({ input }) => {
    console.log('📱 [BACKEND] Getting push tokens for user:', input.userId);

    const { data, error } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', input.userId);

    if (error) {
      console.error('❌ [BACKEND] Error getting tokens:', error);
      throw new Error(`Failed to get tokens: ${error.message}`);
    }

    console.log('✅ [BACKEND] Tokens retrieved:', data?.length || 0);
    return data || [];
  });
