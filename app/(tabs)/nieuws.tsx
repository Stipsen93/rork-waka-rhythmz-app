import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useState } from "react";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";

export default function NieuwsScreen() {
  const insets = useSafeAreaInsets();
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: "WAKA RHYTHMZ",
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "800" as const,
            letterSpacing: 1,
          },
          headerLeft: () => <MenuButton onPress={() => setShowMenuModal(true)} />,
          headerStyle: { backgroundColor: Colors.light.background },
          headerShadowVisible: false,
        }} 
      />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Nieuws</Text>
          <Text style={styles.subtitle}>Nieuws items komen hier</Text>
        </ScrollView>
      </View>
      <MenuModal 
        visible={showMenuModal} 
        onClose={() => setShowMenuModal(false)} 
        onAdminPress={() => setShowAdminModal(true)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
  },
});
