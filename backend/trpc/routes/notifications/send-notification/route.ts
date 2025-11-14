import { protectedProcedure } from '@/backend/trpc/create-context';
import { z } from 'zod';

async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
  console.log('📱 [PUSH-SEND] Sending notification to:', expoPushToken);
  
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('✅ [PUSH-SEND] Notification sent:', result);
    return result;
  } catch (error) {
    console.error('❌ [PUSH-SEND] Error sending notification:', error);
    throw error;
  }
}

export const sendNotificationProcedure = protectedProcedure
  .input(
    z.object({
      userIds: z.array(z.string()),
      title: z.string(),
      body: z.string(),
      data: z.any().optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    console.log('📱 [BACKEND] Sending notifications to users:', input.userIds);

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('*')
      .in('user_id', input.userIds);

    if (error) {
      console.error('❌ [BACKEND] Error getting tokens:', error);
      throw new Error(`Failed to get tokens: ${error.message}`);
    }

    if (!tokens || tokens.length === 0) {
      console.log('⚠️ [BACKEND] No tokens found for users');
      return { success: true, sent: 0, message: 'No tokens found' };
    }

    console.log('📱 [BACKEND] Found tokens:', tokens.length);

    const results = await Promise.allSettled(
      tokens.map(token => 
        sendPushNotification(token.token, input.title, input.body, input.data)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    for (const token of tokens) {
      await supabase.from('notification_logs').insert({
        user_id: token.user_id,
        notification_type: input.data?.type || 'general',
        title: input.title,
        body: input.body,
        data: input.data,
        status: 'sent',
      });
    }

    console.log(`✅ [BACKEND] Notifications sent: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      sent: successful,
      failed: failed,
      message: `Sent ${successful} notifications`,
    };
  });
