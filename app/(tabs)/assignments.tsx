import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/providers/AppState";
import { Clock, Video, Music, Calendar, Users, AlertCircle, CheckCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function AssignmentsScreen() {
  const { assignments, getRecentMedia, performances, practiceSchedule } = useAppState();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recentMedia = getRecentMedia();
  const nextAssignment = assignments[0];
  const nextPerformance = performances[0];

  const getNextPracticeStatus = () => {
    const today = new Date();
    const todayDay = today.getDay();
    
    const todayDateStr = today.toISOString().split('T')[0];
    const isCancelled = practiceSchedule.cancelledDates.includes(todayDateStr);
    
    if (isCancelled) {
      return { status: "cancelled" as const, text: "Oefening gaat niet door", color: "#DC2626" };
    }
    
    const hasPracticeToday = practiceSchedule.regularDays.some(d => d.dayOfWeek === todayDay);
    
    if (hasPracticeToday && practiceSchedule.isActive) {
      return { status: "active" as const, text: "Gaat door", color: "#16A34A" };
    }
    
    return { status: "active" as const, text: "Gaat door", color: "#16A34A" };
  };

  const practiceStatus = getNextPracticeStatus();

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="assignments-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.25, 1]}
      />
      
      <View style={styles.header}>
        <Text style={styles.appName}>WAKA RHYTHMZ</Text>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Overzicht van recente activiteit</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.widgetsRow}>
          <TouchableOpacity 
            style={[styles.widget, styles.widgetHalf]} 
            onPress={() => router.push("/all-media")}
            testID="recente-media-widget"
          >
            <View style={styles.widgetHeader}>
              <View style={styles.widgetIconContainer}>
                <Video color={Colors.light.primary} size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.widgetTitle}>Recente Media</Text>
            </View>
            <View style={styles.widgetContent}>
              {recentMedia.slice(0, 3).map((media, idx) => (
                <View key={media.id} style={styles.mediaItem}>
                  <View style={styles.mediaBullet} />
                  <Text style={styles.mediaText} numberOfLines={1}>{media.title}</Text>
                </View>
              ))}
              {recentMedia.length === 0 && (
                <Text style={styles.emptyText}>Geen recente media</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.widget, styles.widgetHalf]}
            onPress={() => router.push("/all-assignments")}
            testID="huiswerk-widget"
          >
            <View style={styles.widgetHeader}>
              <View style={styles.widgetIconContainer}>
                <Clock color={Colors.light.primary} size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.widgetTitle}>Huiswerk</Text>
            </View>
            <View style={styles.widgetContent}>
              {nextAssignment ? (
                <>
                  <Text style={styles.assignmentTitle} numberOfLines={2}>{nextAssignment.title}</Text>
                  {nextAssignment.dueDate && (
                    <View style={styles.deadlineContainer}>
                      <Calendar color={Colors.light.muted} size={16} strokeWidth={2} />
                      <Text style={styles.deadlineText}>
                        {new Date(nextAssignment.dueDate).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.emptyText}>Geen huiswerk</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.widget}
          onPress={() => router.push("/all-news")}
          testID="nieuws-widget"
        >
          <View style={styles.widgetHeader}>
            <View style={styles.widgetIconContainer}>
              <Music color={Colors.light.primary} size={20} strokeWidth={2.5} />
            </View>
            <Text style={styles.widgetTitle}>Nieuws - Volgend Optreden</Text>
          </View>
          <View style={styles.widgetContent}>
            {nextPerformance ? (
              <>
                <View style={styles.performanceRow}>
                  <View style={styles.performanceInfo}>
                    <Text style={styles.performanceLabel}>Datum</Text>
                    <Text style={styles.performanceValue}>
                      {new Date(nextPerformance.date).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </Text>
                  </View>
                  <View style={styles.performanceInfo}>
                    <Text style={styles.performanceLabel}>Tijd</Text>
                    <Text style={styles.performanceValue}>{nextPerformance.time}</Text>
                  </View>
                </View>
                <View style={styles.performanceRow}>
                  <View style={styles.performanceInfo}>
                    <Text style={styles.performanceLabel}>Locatie</Text>
                    <Text style={styles.performanceValue}>{nextPerformance.location}</Text>
                  </View>
                  <View style={styles.performanceInfoSmall}>
                    <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                    <Text style={styles.signupCount}>{nextPerformance.signedUpCount} aangemeld</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.emptyText}>Geen aankomende optredens</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.widget}
          onPress={() => router.push("/all-practices")}
          testID="oefening-widget"
        >
          <View style={styles.widgetHeader}>
            <View style={styles.widgetIconContainer}>
              <AlertCircle color={Colors.light.primary} size={20} strokeWidth={2.5} />
            </View>
            <Text style={styles.widgetTitle}>Eerst Volgende Oefening</Text>
          </View>
          <View style={styles.widgetContent}>
            <View style={styles.practiceStatusContainer}>
              <Text style={styles.practiceStatusLabel}>Status: </Text>
              <View style={[styles.practiceBadge, { backgroundColor: practiceStatus.color }]}>
                {practiceStatus.status === "active" ? (
                  <CheckCircle color={Colors.light.text} size={16} strokeWidth={2.5} />
                ) : (
                  <AlertCircle color={Colors.light.text} size={16} strokeWidth={2.5} />
                )}
                <Text style={styles.practiceBadgeText}>{practiceStatus.text}</Text>
              </View>
            </View>
            <View style={styles.practiceScheduleList}>
              {practiceSchedule.regularDays.map((day, idx) => {
                const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
                return (
                  <View key={idx} style={styles.practiceDay}>
                    <View style={styles.practiceDayBullet} />
                    <Text style={styles.practiceDayText}>
                      {dayNames[day.dayOfWeek]} om {day.time}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 20 
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
    gap: 16,
  },
  widgetsRow: {
    flexDirection: "row",
    gap: 16,
  },
  widget: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  widgetHalf: {
    flex: 1,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  widgetIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.darkGray,
    justifyContent: "center",
    alignItems: "center",
  },
  widgetTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "700" as const,
    flex: 1,
  },
  widgetContent: {
    gap: 10,
  },
  mediaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mediaBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  mediaText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "500" as const,
    flex: 1,
  },
  emptyText: {
    color: Colors.light.muted,
    fontSize: 14,
    fontStyle: "italic" as const,
  },
  assignmentTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.darkGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  deadlineText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  performanceRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  performanceInfo: {
    flex: 1,
  },
  performanceLabel: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: "600" as const,
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  performanceValue: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  performanceInfoSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.darkGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  signupCount: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  practiceStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  practiceStatusLabel: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  practiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  practiceBadgeText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  practiceScheduleList: {
    gap: 8,
  },
  practiceDay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  practiceDayBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.muted,
  },
  practiceDayText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "500" as const,
  },
});
