import { useEffect, useRef, useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, AppState as RNAppState } from "react-native";
import { useAppState } from "@/providers/AppState";
import { trpcClient } from "@/lib/trpc";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  registerForPushNotifications: () => Promise<void>;
  unregisterPushToken: () => Promise<void>;
}

export const [NotificationProvider, useNotifications] = createContextHook<NotificationState>(() => {
  const { currentUser } = useAppState();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appStateListener = useRef<any>();

  async function registerForPushNotificationsAsync(): Promise<string | null> {
    console.log('📱 [PUSH] Starting push notification registration...');
    
    if (Platform.OS === 'web') {
      console.log('📱 [PUSH] Web platform detected, skipping registration');
      return null;
    }

    if (!Device.isDevice) {
      console.log('📱 [PUSH] Not a physical device, skipping registration');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📱 [PUSH] Existing permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('📱 [PUSH] Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📱 [PUSH] New permission status:', finalStatus);
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ [PUSH] Permission not granted');
        return null;
      }

      console.log('📱 [PUSH] Getting Expo push token...');
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      
      if (!projectId) {
        console.error('❌ [PUSH] EXPO_PUBLIC_PROJECT_ID not set');
        return null;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      console.log('✅ [PUSH] Expo push token received:', token);

      if (Platform.OS === 'android') {
        console.log('📱 [PUSH] Setting Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('❌ [PUSH] Error registering for push notifications:', error);
      return null;
    }
  }

  const registerForPushNotifications = useCallback(async () => {
    if (!currentUser) {
      console.log('❌ [PUSH] No current user, skipping registration');
      return;
    }

    console.log('📱 [PUSH] Registering for user:', currentUser.id);
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      setExpoPushToken(token);
      
      try {
        console.log('📱 [PUSH] Saving token to backend...');
        await trpcClient.notifications.registerToken.mutate({
          userId: currentUser.id,
          token: token,
          deviceType: Platform.OS as 'ios' | 'android',
        });
        console.log('✅ [PUSH] Token saved to backend');
        setIsRegistered(true);
      } catch (error) {
        console.error('❌ [PUSH] Error saving token to backend:', error);
      }
    }
  }, [currentUser]);

  const unregisterPushToken = useCallback(async () => {
    if (!currentUser || !expoPushToken) {
      console.log('❌ [PUSH] No user or token to unregister');
      return;
    }

    try {
      console.log('📱 [PUSH] Unregistering token...');
      await trpcClient.notifications.unregisterToken.mutate({
        userId: currentUser.id,
        token: expoPushToken,
      });
      console.log('✅ [PUSH] Token unregistered');
      setExpoPushToken(null);
      setIsRegistered(false);
    } catch (error) {
      console.error('❌ [PUSH] Error unregistering token:', error);
    }
  }, [currentUser, expoPushToken]);

  useEffect(() => {
    if (currentUser && Platform.OS !== 'web') {
      console.log('📱 [PUSH] User logged in, registering for notifications...');
      registerForPushNotifications();

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('📱 [PUSH] Notification received:', notification);
        setNotification(notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('📱 [PUSH] Notification tapped:', response);
      });

      appStateListener.current = RNAppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          console.log('📱 [PUSH] App became active, refreshing registration...');
          registerForPushNotifications();
        }
      });

      return () => {
        console.log('📱 [PUSH] Cleaning up notification listeners');
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
        if (appStateListener.current) {
          appStateListener.current.remove();
        }
      };
    }
  }, [currentUser, registerForPushNotifications]);

  return {
    expoPushToken,
    notification,
    isRegistered,
    registerForPushNotifications,
    unregisterPushToken,
  };
});
