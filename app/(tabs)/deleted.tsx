import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Trash2 } from "lucide-react-native";

export default function DeletedScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="deleted-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.25, 1]}
      />
      
      <View style={styles.header}>
        <Text style={styles.appName}>WAKA RHYTHMZ</Text>
        <Text style={styles.title}>Verwijderd</Text>
        <Text style={styles.subtitle}>Geen verwijderde items</Text>
      </View>

      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Trash2 color={Colors.light.muted} size={64} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>Geen verwijderde items</Text>
        <Text style={styles.emptyDescription}>
          Items die je verwijdert verschijnen hier
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background,
  },
  headerBg: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 200,
    opacity: 0.4,
  },
  header: { 
    paddingTop: 32, 
    paddingHorizontal: 20, 
    paddingBottom: 24 
  },
  appName: { 
    color: Colors.light.primary, 
    fontSize: 13, 
    fontWeight: "900" as const,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: { 
    color: Colors.light.text, 
    fontSize: 36, 
    fontWeight: "800" as const,
    letterSpacing: -1,
  },
  subtitle: { 
    color: Colors.light.muted, 
    marginTop: 8, 
    fontSize: 15,
    fontWeight: "500" as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  emptyTitle: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    color: Colors.light.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
