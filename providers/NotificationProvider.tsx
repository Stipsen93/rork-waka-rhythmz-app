import { useEffect, useRef, useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, AppState as RNAppState } from "react-native";
import { useAppState } from "@/providers/AppState";
import { trpcClient } from "@/lib/trpc";

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface NotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  isLoading: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  registerForPushNotifications: () => Promise<void>;
  unregisterPushToken: () => Promise<void>;
  checkPermissionStatus: () => Promise<void>;
}

export const [NotificationProvider, useNotifications] = createContextHook<NotificationState>(() => {
  const { currentUser } = useAppState();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const appStateListener = useRef<any>(undefined);

  async function registerForPushNotificationsAsync(): Promise<string | null> {
    console.log('📱 [PUSH] Starting push notification registration...');
    
    if (Platform.OS === 'web') {
      console.log('📱 [PUSH] Web platform detected, skipping registration');
      setPermissionStatus('granted');
      setIsRegistered(true);
      return null;
    }

    if (!Device.isDevice) {
      console.log('📱 [PUSH] Not a physical device, skipping registration');
      setPermissionStatus('granted');
      setIsRegistered(true);
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
      
      setPermissionStatus(finalStatus as 'granted' | 'denied' | 'undetermined');
      
      if (finalStatus !== 'granted') {
        console.log('❌ [PUSH] Permission not granted');
        setIsRegistered(false);
        return null;
      }

      console.log('📱 [PUSH] Getting Expo push token...');
      const projectId = 'fae11c52-b2a8-4ebd-ad40-c4623bde8068';
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      console.log('✅ [PUSH] Expo push token received:', token);

      if (Platform.OS === 'android') {
        console.log('📱 [PUSH] Setting Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      return token;
    } catch (error) {
      console.error('❌ [PUSH] Error registering for push notifications:', error);
      setPermissionStatus('denied');
      setIsRegistered(false);
      return null;
    }
  }

  const registerForPushNotifications = useCallback(async () => {
    if (!currentUser) {
      console.log('❌ [PUSH] No current user, skipping registration');
      return;
    }

    setIsLoading(true);
    console.log('📱 [PUSH] Registering for user:', currentUser.id);
    
    try {
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
          setIsRegistered(true);
        }
      } else if (Platform.OS === 'web' || !Device.isDevice) {
        setIsRegistered(true);
      }
    } catch (error) {
      console.error('❌ [PUSH] Registration failed:', error);
    } finally {
      setIsLoading(false);
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

  const checkPermissionStatus = useCallback(async () => {
    if (Platform.OS === 'web' || !Device.isDevice) {
      console.log('📱 [PUSH] Web/Simulator detected, marking as registered');
      setPermissionStatus('granted');
      setIsRegistered(true);
      return;
    }

    try {
      console.log('📱 [PUSH] Checking current permission status...');
      const { status } = await Notifications.getPermissionsAsync();
      console.log('📱 [PUSH] Current permission status:', status);
      
      setPermissionStatus(status as 'granted' | 'denied' | 'undetermined');
      
      if (status === 'granted') {
        console.log('✅ [PUSH] Permission is granted');
        if (!isRegistered && !isLoading && currentUser) {
          console.log('📱 [PUSH] Not registered yet, auto-registering...');
          await registerForPushNotifications();
        }
      } else if (status === 'denied') {
        console.log('❌ [PUSH] Permission explicitly denied');
        setIsRegistered(false);
      } else {
        console.log('⚠️ [PUSH] Permission status is:', status);
      }
    } catch (error) {
      console.error('❌ [PUSH] Error checking permission status:', error);
    }
  }, [currentUser, isRegistered, isLoading, registerForPushNotifications]);

  useEffect(() => {
    if (currentUser && Platform.OS !== 'web') {
      console.log('📱 [PUSH] User logged in, checking permission and registering...');
      checkPermissionStatus();

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('📱 [PUSH] Notification received:', notification);
        setNotification(notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('📱 [PUSH] Notification tapped:', response);
      });

      appStateListener.current = RNAppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          console.log('📱 [PUSH] App became active, checking permission status...');
          checkPermissionStatus();
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
  }, [currentUser, checkPermissionStatus]);

  return {
    expoPushToken,
    notification,
    isRegistered,
    isLoading,
    permissionStatus,
    registerForPushNotifications,
    unregisterPushToken,
    checkPermissionStatus,
  };
});
