import { supabase } from '@/lib/supabase';

export interface NotificationPayload {
  userIds: string[];
  title: string;
  body: string;
  data?: {
    type: 'news' | 'assignment' | 'training' | 'performance' | 'birthday';
    id?: string;
    [key: string]: any;
  };
}

type PushTokenRow = {
  user_id: string;
  token: string;
  device_type?: 'ios' | 'android' | string | null;
};

type ExpoPushMessage = {
  to: string;
  sound?: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, any>;
};

async function sendExpoPushBatch(messages: ExpoPushMessage[]) {
  console.log('📱 [NOTIFICATION-SERVICE] Sending Expo push batch, size =', messages.length);

  if (messages.length === 0) {
    return { ok: true as const, tickets: [] as any[] };
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const json = (await response.json()) as any;
  console.log('📱 [NOTIFICATION-SERVICE] Expo push response:', json);

  if (!response.ok) {
    const err = new Error(`Expo push failed (${response.status})`);
    (err as any).details = json;
    throw err;
  }

  return { ok: true as const, tickets: json?.data ?? [] };
}

export async function sendNotificationToUsers(payload: NotificationPayload) {
  console.log('📱 [NOTIFICATION-SERVICE] Sending notification to users:', payload.userIds);

  if (!payload.userIds || payload.userIds.length === 0) {
    console.log('⚠️ [NOTIFICATION-SERVICE] No userIds provided, skipping.');
    return { success: true, sent: 0, failed: 0, message: 'No userIds provided' };
  }

  try {
    console.log('📱 [NOTIFICATION-SERVICE] Fetching push tokens from Supabase...');

    const { data, error } = await supabase
      .from('push_tokens')
      .select('user_id, token, device_type')
      .in('user_id', payload.userIds);

    if (error) {
      console.error('❌ [NOTIFICATION-SERVICE] Failed to fetch push tokens:', error);
      throw error;
    }

    const tokens = (data ?? []) as PushTokenRow[];
    console.log('📱 [NOTIFICATION-SERVICE] Tokens found:', tokens.length);

    if (tokens.length === 0) {
      return { success: true, sent: 0, failed: 0, message: 'No tokens found' };
    }

    const messages: ExpoPushMessage[] = tokens
      .filter((t) => typeof t.token === 'string' && t.token.length > 0)
      .map((t) => ({
        to: t.token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data,
      }));

    const BATCH_SIZE = 90;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);

      try {
        const result = await sendExpoPushBatch(batch);
        const tickets = result.tickets;
        sent += tickets.length;

        const batchFailed = (tickets as any[]).filter((t) => t?.status !== 'ok').length;
        failed += batchFailed;

        if (batchFailed > 0) {
          console.warn('⚠️ [NOTIFICATION-SERVICE] Some tickets failed in batch:', batchFailed);
        }
      } catch (batchError) {
        console.error('❌ [NOTIFICATION-SERVICE] Batch send failed:', batchError);
        failed += batch.length;
      }
    }

    console.log('✅ [NOTIFICATION-SERVICE] Notification sent via Expo push:', { sent, failed });

    try {
      console.log('📱 [NOTIFICATION-SERVICE] Writing notification_logs to Supabase...');

      const logs = tokens.map((t) => ({
        user_id: t.user_id,
        notification_type: payload.data?.type ?? 'general',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? null,
        status: 'sent',
      }));

      const { error: logError } = await supabase.from('notification_logs').insert(logs);
      if (logError) {
        console.error('❌ [NOTIFICATION-SERVICE] Failed to insert notification logs:', logError);
      } else {
        console.log('✅ [NOTIFICATION-SERVICE] Notification logs inserted:', logs.length);
      }
    } catch (logErr) {
      console.error('❌ [NOTIFICATION-SERVICE] Writing notification logs failed (exception):', logErr);
    }

    return {
      success: true,
      sent,
      failed,
      message: `Sent ${sent} notifications`,
    };
  } catch (error) {
    console.error('❌ [NOTIFICATION-SERVICE] Error sending notification:', error);
    throw error;
  }
}

export async function notifyNewAnnouncement(
  announcementTitle: string,
  announcementDescription: string,
  announcementId: string,
  enabledUserIds: string[]
) {
  if (enabledUserIds.length === 0) {
    console.log('⚠️ [NOTIFICATION-SERVICE] No users to notify for announcement');
    return;
  }

  return sendNotificationToUsers({
    userIds: enabledUserIds,
    title: `📰 Nieuw bericht: ${announcementTitle}`,
    body: announcementDescription,
    data: {
      type: 'news',
      id: announcementId,
    },
  });
}

export async function notifyNewAssignment(
  assignmentTitle: string,
  assignmentDescription: string,
  assignmentId: string,
  enabledUserIds: string[]
) {
  if (enabledUserIds.length === 0) {
    console.log('⚠️ [NOTIFICATION-SERVICE] No users to notify for assignment');
    return;
  }

  return sendNotificationToUsers({
    userIds: enabledUserIds,
    title: `📝 Nieuw huiswerk: ${assignmentTitle}`,
    body: assignmentDescription,
    data: {
      type: 'assignment',
      id: assignmentId,
    },
  });
}

export async function notifyTrainingChange(
  trainingName: string,
  changeDescription: string,
  trainingId: string,
  enabledUserIds: string[]
) {
  if (enabledUserIds.length === 0) {
    console.log('⚠️ [NOTIFICATION-SERVICE] No users to notify for training change');
    return;
  }

  return sendNotificationToUsers({
    userIds: enabledUserIds,
    title: `🥁 Training wijziging: ${trainingName}`,
    body: changeDescription,
    data: {
      type: 'training',
      id: trainingId,
    },
  });
}

export async function notifyNewPerformance(
  performanceDate: string,
  performanceLocation: string,
  performanceId: string,
  enabledUserIds: string[]
) {
  if (enabledUserIds.length === 0) {
    console.log('⚠️ [NOTIFICATION-SERVICE] No users to notify for performance');
    return;
  }

  return sendNotificationToUsers({
    userIds: enabledUserIds,
    title: '🎭 Nieuw optreden ingepland',
    body: `${performanceDate} in ${performanceLocation}`,
    data: {
      type: 'performance',
      id: performanceId,
    },
  });
}

export async function notifyBirthday(
  memberName: string,
  birthdayDate: string,
  allUserIds: string[]
) {
  if (allUserIds.length === 0) {
    console.log('⚠️ [NOTIFICATION-SERVICE] No users to notify for birthday');
    return;
  }

  return sendNotificationToUsers({
    userIds: allUserIds,
    title: '🎂 Verjaardag!',
    body: `${memberName} is jarig op ${birthdayDate}!`,
    data: {
      type: 'birthday',
    },
  });
}
