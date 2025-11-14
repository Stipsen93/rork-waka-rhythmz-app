import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export const unregisterTokenProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      token: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('📱 [BACKEND] Unregistering push token for user:', input.userId);

    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', input.userId)
      .eq('token', input.token);

    if (error) {
      console.error('❌ [BACKEND] Error unregistering token:', error);
      throw new Error(`Failed to unregister token: ${error.message}`);
    }

    console.log('✅ [BACKEND] Token unregistered successfully');
    return { success: true, message: 'Token unregistered' };
  });
