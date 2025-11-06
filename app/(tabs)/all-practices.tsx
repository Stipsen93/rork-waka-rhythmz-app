import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/providers/AppState";
import { Calendar, Clock, CheckCircle, XCircle, ArrowLeft, AlertCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function AllPracticesScreen() {
  const { practiceSchedule } = useAppState();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

  const getPastPractices = () => {
    const pastDates: Array<{ date: Date; cancelled: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 30; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();
      
      const hasPractice = practiceSchedule.regularDays.some(d => d.dayOfWeek === dayOfWeek);
      if (hasPractice) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const isCancelled = practiceSchedule.cancelledDates.some(cd => cd.date === dateStr);
        pastDates.push({ date, cancelled: isCancelled });
      }
    }
    
    return pastDates.reverse();
  };

  const getUpcomingPractices = () => {
    const upcomingDates: Array<{ date: Date; cancelled: boolean; time: string }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      const practiceDay = practiceSchedule.regularDays.find(d => d.dayOfWeek === dayOfWeek);
      if (practiceDay) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const isCancelled = practiceSchedule.cancelledDates.some(cd => cd.date === dateStr);
        upcomingDates.push({ date, cancelled: isCancelled, time: practiceDay.time });
      }
    }
    
    return upcomingDates;
  };

  const pastPractices = getPastPractices();
  const upcomingPractices = getUpcomingPractices();

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
          <Text style={styles.appName}>WAKA RHYTHMZ</Text>
          <Text style={styles.title}>Oefeningen</Text>
          <Text style={styles.subtitle}>
            {pastPractices.length} afgelopen • {upcomingPractices.length} gepland
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <Clock color={Colors.light.primary} size={22} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Reguliere Dagen</Text>
          </View>
          <View style={styles.scheduleDaysList}>
            {practiceSchedule.regularDays.map((day, idx) => (
              <View key={idx} style={styles.scheduleDay}>
                <View style={styles.scheduleDayIcon}>
                  <Calendar color={Colors.light.primary} size={18} strokeWidth={2.5} />
                </View>
                <Text style={styles.scheduleDayText}>
                  {dayNames[day.dayOfWeek]} om {day.time}
                </Text>
                <View style={[styles.statusBadge, styles.statusBadgeActive]}>
                  <CheckCircle color={Colors.light.text} size={14} strokeWidth={2.5} />
                  <Text style={styles.statusBadgeText}>Actief</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar color={Colors.light.primary} size={22} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Aankomende Oefeningen</Text>
          </View>
          {upcomingPractices.length > 0 ? (
            <View style={styles.practicesList}>
              {upcomingPractices.map((practice, idx) => (
                <View key={idx} style={styles.practiceCard}>
                  <View style={styles.practiceCardLeft}>
                    <View style={[styles.practiceIconContainer, practice.cancelled && styles.practiceIconCancelled]}>
                      {practice.cancelled ? (
                        <XCircle color={Colors.light.text} size={20} strokeWidth={2.5} />
                      ) : (
                        <CheckCircle color={Colors.light.text} size={20} strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={styles.practiceInfo}>
                      <Text style={styles.practiceDate}>
                        {practice.date.toLocaleDateString('nl-NL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </Text>
                      <Text style={styles.practiceTime}>om {practice.time}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    practice.cancelled ? styles.statusBadgeCancelled : styles.statusBadgeConfirmed
                  ]}>
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
          {pastPractices.length > 0 ? (
            <View style={styles.practicesList}>
              {pastPractices.map((practice, idx) => (
                <View key={idx} style={styles.practiceCard}>
                  <View style={styles.practiceCardLeft}>
                    <View style={[styles.practiceIconContainer, styles.practiceIconPast]}>
                      {practice.cancelled ? (
                        <XCircle color={Colors.light.muted} size={20} strokeWidth={2.5} />
                      ) : (
                        <CheckCircle color={Colors.light.muted} size={20} strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={styles.practiceInfo}>
                      <Text style={styles.practiceDate}>
                        {practice.date.toLocaleDateString('nl-NL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    practice.cancelled ? styles.statusBadgeCancelled : styles.statusBadgePast
                  ]}>
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
  scheduleDayText: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  practicesList: {
    gap: 12,
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
  },
  practiceDate: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700" as const,
    marginBottom: 4,
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
