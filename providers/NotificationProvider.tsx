import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { AppState as RNAppState, Platform } from "react-native";
import { useAppState } from "@/providers/AppState";
import { supabase } from "@/lib/supabase";

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

export type PushPermissionStatus = "granted" | "denied" | "undetermined";

type AndroidChannelDiagnostics = {
  channelId: string;
  exists: boolean;
  importance?: Notifications.AndroidImportance;
  blocked: boolean;
};

export type PushDiagnostics = {
  platform: typeof Platform.OS;
  isPhysicalDevice: boolean;
  osStatus: PushPermissionStatus;
  canAskAgain?: boolean;
  androidChannel?: AndroidChannelDiagnostics;
  overallEnabled: boolean;
  checkedAt: number | null;
  lastError: string | null;
};

export interface NotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  isLoading: boolean;
  permissionStatus: PushPermissionStatus;
  diagnostics: PushDiagnostics;
  refreshPushState: () => Promise<void>;
  registerForPushNotifications: () => Promise<void>;
  unregisterPushToken: () => Promise<void>;
  requestPermissions: () => Promise<void>;
}

export const [NotificationProvider, useNotifications] = createContextHook<NotificationState>(() => {
  const { currentUser } = useAppState();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>("undetermined");
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [canAskAgain, setCanAskAgain] = useState<boolean | undefined>(undefined);
  const [androidChannel, setAndroidChannel] = useState<AndroidChannelDiagnostics | undefined>(undefined);

  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const appStateListener = useRef<ReturnType<typeof RNAppState.addEventListener> | undefined>(undefined);

  const isPhysicalDevice = Device.isDevice;
  const ANDROID_DEFAULT_CHANNEL_ID = "default" as const;

  const ensureAndroidChannel = useCallback(async () => {
    if (Platform.OS !== "android") {
      return;
    }

    try {
      await Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL_ID, {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
      });
      console.log("📱 [PUSH] Android channel ensured:", ANDROID_DEFAULT_CHANNEL_ID);
    } catch (e) {
      console.error("❌ [PUSH] Failed to ensure Android channel:", e);
    }
  }, []);

  const readAndroidChannelDiagnostics = useCallback(async (): Promise<AndroidChannelDiagnostics | undefined> => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    try {
      const channel = await Notifications.getNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL_ID);
      const exists = !!channel;
      const importance = channel?.importance;
      const blocked = importance === Notifications.AndroidImportance.NONE;

      const diag: AndroidChannelDiagnostics = {
        channelId: ANDROID_DEFAULT_CHANNEL_ID,
        exists,
        importance,
        blocked,
      };

      console.log("📱 [PUSH] Android channel diagnostics:", diag);
      return diag;
    } catch (e) {
      console.error("❌ [PUSH] Failed to read Android channel diagnostics:", e);
      return {
        channelId: ANDROID_DEFAULT_CHANNEL_ID,
        exists: false,
        blocked: false,
      };
    }
  }, []);

  const computeOverallEnabled = useCallback(
    (osStatus: PushPermissionStatus, channelDiag: AndroidChannelDiagnostics | undefined) => {
      if (Platform.OS === "web") {
        return true;
      }

      if (!isPhysicalDevice) {
        return true;
      }

      if (osStatus !== "granted") {
        return false;
      }

      if (Platform.OS === "android") {
        return !(channelDiag?.blocked ?? false);
      }

      return true;
    },
    [isPhysicalDevice]
  );

  const saveTokenToSupabase = useCallback(
    async (token: string) => {
      if (!currentUser) {
        return;
      }

      console.log("📱 [PUSH] Saving token to Supabase...", { userId: currentUser.id });

      const { error } = await supabase
        .from("push_tokens")
        .upsert(
          {
            user_id: currentUser.id,
            token,
            device_type: Platform.OS as "ios" | "android",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,token" }
        );

      if (error) {
        console.error("❌ [PUSH] Error saving token to Supabase:", error);
        return;
      }

      console.log("✅ [PUSH] Token saved to Supabase");
      setIsRegistered(true);
    },
    [currentUser]
  );

  const registerForPushNotificationsAsync = useCallback(async (): Promise<string | null> => {
    console.log("📱 [PUSH] Starting push notification registration...");

    if (Platform.OS === "web") {
      console.log("📱 [PUSH] Web platform detected, skipping registration");
      return null;
    }

    if (!isPhysicalDevice && Platform.OS === 'ios') {
      console.log("📱 [PUSH] iOS Simulator detected, skipping registration (not supported)");
      return null;
    }

    if (!isPhysicalDevice) {
      console.log("📱 [PUSH] Emulator detected, attempting registration anyway...");
    }

    try {
      await ensureAndroidChannel();
      const perms = await Notifications.getPermissionsAsync();
      const status = (perms.status ?? "undetermined") as PushPermissionStatus;
      console.log("📱 [PUSH] Permission status before token:", status);

      if (status !== "granted") {
        console.log("❌ [PUSH] Permission not granted -> no token");
        setPermissionStatus(status);
        setCanAskAgain(perms.canAskAgain);
        setIsRegistered(false);
        return null;
      }

      const channelDiag = await readAndroidChannelDiagnostics();
      setAndroidChannel(channelDiag);

      if (Platform.OS === "android" && (channelDiag?.blocked ?? false)) {
        console.log("❌ [PUSH] Android channel blocked -> no token");
        setIsRegistered(false);
        return null;
      }

      console.log("📱 [PUSH] Getting Expo push token...");
      const projectId = "fae11c52-b2a8-4ebd-ad40-c4623bde8068";
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      console.log("✅ [PUSH] Expo push token received:", token);
      return token;
    } catch (error) {
      console.error("❌ [PUSH] Error registering for push notifications:", error);
      setPermissionStatus("denied");
      setIsRegistered(false);
      setLastError(error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setCheckedAt(Date.now());
    }
  }, [ensureAndroidChannel, isPhysicalDevice, readAndroidChannelDiagnostics]);

  const performRegistration = useCallback(async () => {
    if (!currentUser) {
      console.log("❌ [PUSH] performRegistration: no user");
      setIsRegistered(false);
      return;
    }

    const token = await registerForPushNotificationsAsync();

    if (!token) {
      console.log("📱 [PUSH] performRegistration: no token returned");
      return;
    }

    setExpoPushToken(token);

    try {
      await saveTokenToSupabase(token);
    } catch (e) {
      console.error("❌ [PUSH] performRegistration: token save failed:", e);
      setIsRegistered(true);
    }
  }, [currentUser, registerForPushNotificationsAsync, saveTokenToSupabase]);

  const refreshPushState = useCallback(async () => {
    setLastError(null);

    console.log("📱 [PUSH] Refreshing push state...", {
      platform: Platform.OS,
      isPhysicalDevice,
      userId: currentUser?.id,
    });

    if (Platform.OS === "web") {
      setPermissionStatus("granted");
      setIsRegistered(true);
      setCheckedAt(Date.now());
      setAndroidChannel(undefined);
      setCanAskAgain(undefined);
      return;
    }

    try {
      await ensureAndroidChannel();
      const perms = await Notifications.getPermissionsAsync();
      console.log("📱 [PUSH] getPermissionsAsync result:", perms);

      const osStatus = (perms.status ?? "undetermined") as PushPermissionStatus;
      setPermissionStatus(osStatus);
      setCanAskAgain(perms.canAskAgain);

      const channelDiag = await readAndroidChannelDiagnostics();
      setAndroidChannel(channelDiag);

      const overallEnabled = computeOverallEnabled(osStatus, channelDiag);
      console.log("📱 [PUSH] overallEnabled computed:", overallEnabled);
      
      if (overallEnabled) {
        if (!isRegistered && !isLoading && currentUser) {
          console.log("📱 [PUSH] Enabled but not registered -> registering...");
          await performRegistration();
        } else if (!currentUser) {
          console.log("📱 [PUSH] Enabled but no user -> skipping registration");
        }
      } else {
        setIsRegistered(false);
      }

      setCheckedAt(Date.now());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("❌ [PUSH] Failed to refresh push state:", e);
      setLastError(msg);
      setCheckedAt(Date.now());
    }
  }, [computeOverallEnabled, currentUser, ensureAndroidChannel, isLoading, isPhysicalDevice, isRegistered, performRegistration, readAndroidChannelDiagnostics]);

  const requestPermissions = useCallback(async () => {
    setLastError(null);

    if (Platform.OS === "web" || !isPhysicalDevice) {
      setPermissionStatus("granted");
      setIsRegistered(true);
      setCheckedAt(Date.now());
      return;
    }

    try {
      console.log("📱 [PUSH] Requesting permissions...");
      const res = await Notifications.requestPermissionsAsync();
      console.log("📱 [PUSH] requestPermissionsAsync result:", res);
      await refreshPushState();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("❌ [PUSH] requestPermissions failed:", e);
      setLastError(msg);
      await refreshPushState();
    }
  }, [isPhysicalDevice, refreshPushState]);


  const registerForPushNotifications = useCallback(async () => {
    if (!currentUser) {
      console.log("❌ [PUSH] No current user, skipping registration");
      setIsRegistered(false);
      return;
    }

    setIsLoading(true);
    console.log("📱 [PUSH] Registering for user:", currentUser.id);

    try {
      await performRegistration();
      await refreshPushState();
    } catch (error) {
      console.error("❌ [PUSH] Registration failed:", error);
      setLastError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, performRegistration, refreshPushState]);

  const unregisterPushToken = useCallback(async () => {
    if (!currentUser || !expoPushToken) {
      console.log("❌ [PUSH] No user or token to unregister");
      return;
    }

    try {
      console.log("📱 [PUSH] Unregistering token (Supabase)...");

      const { error } = await supabase
        .from("push_tokens")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("token", expoPushToken);

      if (error) {
        console.error("❌ [PUSH] Error unregistering token from Supabase:", error);
      } else {
        console.log("✅ [PUSH] Token unregistered from Supabase");
        setExpoPushToken(null);
        setIsRegistered(false);
      }
    } catch (error) {
      console.error("❌ [PUSH] Error unregistering token (exception):", error);
    } finally {
      await refreshPushState();
    }
  }, [currentUser, expoPushToken, refreshPushState]);

  const diagnostics = useMemo<PushDiagnostics>(() => {
    const overallEnabled = computeOverallEnabled(permissionStatus, androidChannel);

    return {
      platform: Platform.OS,
      isPhysicalDevice,
      osStatus: permissionStatus,
      canAskAgain,
      androidChannel,
      overallEnabled,
      checkedAt,
      lastError,
    };
  }, [androidChannel, canAskAgain, checkedAt, computeOverallEnabled, isPhysicalDevice, lastError, permissionStatus]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
        console.warn("� NOTIFICATION RECEIVED!", n);
        console.warn("Title:", n.request.content.title);
        console.warn("Body:", n.request.content.body);
        console.warn("Data:", n.request.content.data);
        setNotification(n);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((r) => {
        console.warn("� NOTIFICATION TAPPED!", r);
      });

      appStateListener.current = RNAppState.addEventListener("change", (nextAppState) => {
        if (nextAppState === "active") {
          console.log("📱 [PUSH] App became active -> refreshPushState()");
          refreshPushState();
        }
      });

      return () => {
        console.log("📱 [PUSH] Cleaning up notification listeners");
        notificationListener.current?.remove();
        responseListener.current?.remove();
        appStateListener.current?.remove();
      };
    }
  }, [refreshPushState]);

  useEffect(() => {
    if (currentUser) {
      console.log("📱 [PUSH] User changed -> refreshPushState()", { userId: currentUser.id });
      refreshPushState();
    } else {
      console.log("📱 [PUSH] User logged out -> reset push state");
      setExpoPushToken(null);
      setIsRegistered(false);
    }
  }, [currentUser, refreshPushState]);

  return {
    expoPushToken,
    notification,
    isRegistered,
    isLoading,
    permissionStatus,
    diagnostics,
    refreshPushState,
    registerForPushNotifications,
    unregisterPushToken,
    requestPermissions,
  };
});
