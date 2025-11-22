import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/providers/AppState";
import type { Training } from "@/providers/AppState";
import { Calendar, Clock, CheckCircle, XCircle, ArrowLeft, AlertCircle, MapPin } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTrainings } from "@/hooks/useTrainings";

type PracticeInstance = {
  date: Date;
  training: Training;
  cancelled: boolean;
};

const dayNames = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AllPracticesScreen() {
  const { practiceSchedule } = useAppState();
  const { trainings, isLoading } = useTrainings();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const cancelledDates = useMemo(() => new Set(practiceSchedule.cancelledDates.map((cd) => cd.date)), [practiceSchedule.cancelledDates]);

  const sortedTrainings = useMemo(() => {
    return [...trainings].sort((a, b) => {
      if ((a.customDate ?? "") && (b.customDate ?? "")) {
        return (a.customDate ?? "").localeCompare(b.customDate ?? "");
      }
      if (a.dayOfWeek === b.dayOfWeek) {
        return a.time.localeCompare(b.time);
      }
      return a.dayOfWeek - b.dayOfWeek;
    });
  }, [trainings]);

  const weeklyTrainings = useMemo(() => sortedTrainings.filter((training) => !training.customDate), [sortedTrainings]);
  const customDateInstances = useMemo(() => sortedTrainings.filter((training) => training.customDate).map((training) => {
    const date = training.customDate ? new Date(`${training.customDate}T00:00:00`) : new Date();
    return {
      date,
      training,
      cancelled: training.customDate ? cancelledDates.has(training.customDate) : false,
    };
  }), [cancelledDates, sortedTrainings]);

  const upcomingPractices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureInstances: PracticeInstance[] = [];

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();

      weeklyTrainings.forEach((training) => {
        if (training.dayOfWeek === dayOfWeek) {
          const dateKey = formatDateKey(date);
          futureInstances.push({
            date: new Date(date),
            training,
            cancelled: cancelledDates.has(dateKey),
          });
        }
      });
    }

    const upcomingCustom = customDateInstances.filter((instance) => instance.date.getTime() >= today.getTime());

    return [...futureInstances, ...upcomingCustom].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [cancelledDates, customDateInstances, weeklyTrainings]);

  const pastPractices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastInstances: PracticeInstance[] = [];

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();

      weeklyTrainings.forEach((training) => {
        if (training.dayOfWeek === dayOfWeek) {
          const dateKey = formatDateKey(date);
          pastInstances.push({
            date: new Date(date),
            training,
            cancelled: cancelledDates.has(dateKey),
          });
        }
      });
    }

    const pastCustom = customDateInstances.filter((instance) => instance.date.getTime() < today.getTime());

    return [...pastInstances, ...pastCustom].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [cancelledDates, customDateInstances, weeklyTrainings]);

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="all-practices-screen">
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]}
        style={styles.headerBg}
        locations={[0, 0.3, 1]}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.push("/(tabs)/assignments")} style={styles.backButton}>
          <ArrowLeft color={Colors.light.primary} size={24} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.appName}>OneBand</Text>
          <Text style={styles.title}>Oefeningen</Text>
          <Text style={styles.subtitle}>
            {pastPractices.length} afgelopen • {upcomingPractices.length} gepland
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        testID="all-practices-scroll"
      >
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Clock color={Colors.light.primary} size={22} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Trainingsoverzicht</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color={Colors.light.primary} style={styles.loadingIndicator} />
          ) : sortedTrainings.length > 0 ? (
            <View style={styles.scheduleDaysList}>
              {sortedTrainings.map((training) => (
                <View key={training.id} style={styles.scheduleDay}>
                  <View style={styles.scheduleDayIcon}>
                    <Calendar color={Colors.light.primary} size={18} strokeWidth={2.5} />
                  </View>
                  <View style={styles.scheduleDayInfo}>
                    <Text style={styles.scheduleDayName}>{training.name}</Text>
                    <Text style={styles.scheduleDayText}>
                      {training.customDate
                        ? `${new Date(`${training.customDate}T00:00:00`).toLocaleDateString("nl-NL", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })} • ${training.time}`
                        : `${dayNames[training.dayOfWeek]} • ${training.time}`}
                    </Text>
                    <View style={styles.scheduleMetaRow}>
                      <MapPin color={Colors.light.muted} size={14} />
                      <Text style={styles.scheduleMetaText}>{training.location}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, styles.statusBadgeActive]}>
                    <CheckCircle color={Colors.light.text} size={14} strokeWidth={2.5} />
                    <Text style={styles.statusBadgeText}>Actief</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Geen trainingen ingesteld</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar color={Colors.light.primary} size={22} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Aankomende Oefeningen</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color={Colors.light.primary} style={styles.loadingIndicator} />
          ) : upcomingPractices.length > 0 ? (
            <View style={styles.practicesList}>
              {upcomingPractices.map((practice) => (
                <View key={`${practice.training.id}-${formatDateKey(practice.date)}`} style={styles.practiceCard}>
                  <View style={styles.practiceCardLeft}>
                    <View style={[styles.practiceIconContainer, practice.cancelled && styles.practiceIconCancelled]}>
                      {practice.cancelled ? (
                        <XCircle color={Colors.light.text} size={20} strokeWidth={2.5} />
                      ) : (
                        <CheckCircle color={Colors.light.text} size={20} strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={styles.practiceInfo}>
                      <Text style={styles.practiceName}>{practice.training.name}</Text>
                      <Text style={styles.practiceDate}>
                        {practice.date.toLocaleDateString("nl-NL", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </Text>
                      <Text style={styles.practiceTime}>
                        {practice.training.time} • {practice.training.location}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      practice.cancelled ? styles.statusBadgeCancelled : styles.statusBadgeConfirmed,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {practice.cancelled ? "Gaat niet door" : "Gaat door"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Geen aankomende oefeningen</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle color={Colors.light.primary} size={22} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Afgelopen Oefeningen</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color={Colors.light.primary} style={styles.loadingIndicator} />
          ) : pastPractices.length > 0 ? (
            <View style={styles.practicesList}>
              {pastPractices.map((practice) => (
                <View key={`${practice.training.id}-past-${formatDateKey(practice.date)}`} style={styles.practiceCard}>
                  <View style={styles.practiceCardLeft}>
                    <View style={[styles.practiceIconContainer, styles.practiceIconPast]}>
                      {practice.cancelled ? (
                        <XCircle color={Colors.light.muted} size={20} strokeWidth={2.5} />
                      ) : (
                        <CheckCircle color={Colors.light.muted} size={20} strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={styles.practiceInfo}>
                      <Text style={styles.practiceName}>{practice.training.name}</Text>
                      <Text style={styles.practiceDate}>
                        {practice.date.toLocaleDateString("nl-NL", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      practice.cancelled ? styles.statusBadgeCancelled : styles.statusBadgePast,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {practice.cancelled ? "Afgelast" : "Afgerond"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Geen afgelopen oefeningen</Text>
          )}
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    gap: 24,
  },
  scheduleSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: "700" as const,
  },
  scheduleDaysList: {
    gap: 12,
    marginTop: 12,
  },
  scheduleDay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.darkGray,
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  scheduleDayIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleDayInfo: {
    flex: 1,
    gap: 4,
  },
  scheduleDayName: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  scheduleDayText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  scheduleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduleMetaText: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: "600" as const,
  },
  practicesList: {
    gap: 12,
  },
  loadingIndicator: {
    marginVertical: 12,
  },
  practiceCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  practiceCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  practiceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
  },
  practiceIconCancelled: {
    backgroundColor: "#DC2626",
  },
  practiceIconPast: {
    backgroundColor: Colors.light.darkGray,
  },
  practiceInfo: {
    flex: 1,
    gap: 4,
  },
  practiceName: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "800" as const,
  },
  practiceDate: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  practiceTime: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBadgeActive: {
    backgroundColor: "#16A34A",
  },
  statusBadgeConfirmed: {
    backgroundColor: "#16A34A",
  },
  statusBadgeCancelled: {
    backgroundColor: "#DC2626",
  },
  statusBadgePast: {
    backgroundColor: Colors.light.muted,
  },
  statusBadgeText: {
    color: Colors.light.text,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  emptyText: {
    color: Colors.light.muted,
    fontSize: 14,
    fontStyle: "italic" as const,
  },
});
