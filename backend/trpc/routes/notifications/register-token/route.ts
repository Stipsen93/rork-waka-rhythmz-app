import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export const registerTokenProcedure = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      token: z.string(),
      deviceType: z.enum(['ios', 'android']),
    })
  )
  .mutation(async ({ input }) => {
    console.log('📱 [BACKEND] Registering push token for user:', input.userId);

    const { data: existing, error: selectError } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', input.userId)
      .eq('token', input.token)
      .single();

    if (existing) {
      console.log('📱 [BACKEND] Token already exists, updating...');
      const { error: updateError } = await supabase
        .from('push_tokens')
        .update({ device_type: input.deviceType, updated_at: new Date().toISOString() })
        .eq('user_id', input.userId)
        .eq('token', input.token);

      if (updateError) {
        console.error('❌ [BACKEND] Error updating token:', updateError);
        throw new Error(`Failed to update token: ${updateError.message}`);
      }

      console.log('✅ [BACKEND] Token updated successfully');
      return { success: true, message: 'Token updated' };
    }

    const { error: insertError } = await supabase
      .from('push_tokens')
      .insert({
        user_id: input.userId,
        token: input.token,
        device_type: input.deviceType,
      });

    if (insertError) {
      console.error('❌ [BACKEND] Error inserting token:', insertError);
      throw new Error(`Failed to register token: ${insertError.message}`);
    }

    console.log('✅ [BACKEND] Token registered successfully');
    return { success: true, message: 'Token registered' };
  });
