import React from "react";
import { FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/providers/AppState";
import { Calendar, Users, MapPin, ArrowLeft, Music } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function AllNewsScreen() {
  const { performances } = useAppState();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const sortedPerformances = [...performances].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="all-news-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.3, 1]}
      />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.light.primary} size={24} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.appName}>WAKA RHYTHMZ</Text>
          <Text style={styles.title}>Nieuws - Optredens</Text>
          <Text style={styles.subtitle}>{performances.length} optredens</Text>
        </View>
      </View>

      <FlatList
        data={sortedPerformances}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => {
          const performanceDate = new Date(item.date);
          const isUpcoming = performanceDate >= new Date();
          
          return (
            <Pressable style={styles.card} testID={`performance-${item.id}`}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, isUpcoming ? styles.statusBadgeUpcoming : styles.statusBadgePast]}>
                  <Music color={Colors.light.text} size={16} strokeWidth={2.5} />
                  <Text style={styles.statusBadgeText}>
                    {isUpcoming ? "Aankomend" : "Afgelopen"}
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Calendar color={Colors.light.primary} size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Datum</Text>
                    <Text style={styles.infoValue}>
                      {performanceDate.toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Calendar color={Colors.light.primary} size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Tijd</Text>
                    <Text style={styles.infoValue}>{item.time}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <MapPin color={Colors.light.primary} size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Locatie</Text>
                    <Text style={styles.infoValue}>{item.location}</Text>
                  </View>
                </View>

                <View style={styles.signupContainer}>
                  <Users color={Colors.light.primary} size={20} strokeWidth={2.5} />
                  <Text style={styles.signupText}>
                    {item.signedUpCount} {item.signedUpCount === 1 ? 'persoon' : 'personen'} aangemeld
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Geen optredens beschikbaar</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background 
  },
  headerBg: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 240,
    opacity: 0.4,
  },
  header: { 
    paddingTop: 32, 
    paddingHorizontal: 20, 
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  backButton: {
    paddingTop: 8,
  },
  headerTextContainer: {
    flex: 1,
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
  list: { 
    padding: 20, 
    paddingTop: 0,
    gap: 16 
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusBadgeUpcoming: {
    backgroundColor: Colors.light.primary,
  },
  statusBadgePast: {
    backgroundColor: Colors.light.muted,
  },
  statusBadgeText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  cardContent: {
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.darkGray,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: "600" as const,
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  infoValue: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.darkGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  signupText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: Colors.light.muted,
    fontSize: 16,
    fontStyle: "italic" as const,
  },
});
