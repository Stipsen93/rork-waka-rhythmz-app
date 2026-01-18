// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppStateProvider } from "@/providers/AppState";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { UploadProgressProvider, UploadProgressOverlay } from "@/providers/UploadProgressProvider";
import { StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import AnimatedSplashScreen from "@/components/AnimatedSplashScreen";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="member-profile" options={{ headerShown: true, title: "Profiel" }} />
      <Stack.Screen name="modal" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    SplashScreen.hideAsync();
  }, []);

  if (showSplash) {
    return <AnimatedSplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <AppStateProvider>
          <NotificationProvider>
            <UploadProgressProvider>
              <RootLayoutNav />
              <UploadProgressOverlay />
            </UploadProgressProvider>
          </NotificationProvider>
        </AppStateProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
