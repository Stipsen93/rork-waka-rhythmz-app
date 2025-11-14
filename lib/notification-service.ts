import { trpcClient } from '@/lib/trpc';

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

export async function sendNotificationToUsers(payload: NotificationPayload) {
  console.log('📱 [NOTIFICATION-SERVICE] Sending notification to users:', payload.userIds);
  
  try {
    const result = await trpcClient.notifications.sendNotification.mutate({
      userIds: payload.userIds,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });

    console.log('✅ [NOTIFICATION-SERVICE] Notification sent:', result);
    return result;
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
