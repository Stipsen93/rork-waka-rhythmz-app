import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/providers/AppState";
import { Clock, Video, Music, Calendar, Users, AlertCircle, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function AssignmentsScreen() {
  const { assignments, getRecentMedia, performances, practiceSchedule } = useAppState();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recentMedia = getRecentMedia();
  const nextAssignment = assignments[0];
  const nextPerformance = performances[0];
  const [cancelledModalOpen, setCancelledModalOpen] = useState(false);

  const getNextPracticeDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    const maxDays = 30;
    let daysChecked = 0;
    
    while (daysChecked < maxDays) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const trainingsOnDay = practiceSchedule.trainings?.filter(t => t.dayOfWeek === dayOfWeek) || [];
      const isCancelled = practiceSchedule.cancelledDates.some(cd => cd.date === dateStr);
      
      if (trainingsOnDay.length > 0 && !isCancelled) {
        return {
          date: currentDate,
          dateStr: dateStr,
          trainings: trainingsOnDay
        };
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }
    
    return null;
  };

  const nextPractice = getNextPracticeDate();

  const getUpcomingCancelledPractices = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return practiceSchedule.cancelledDates
      .filter(cd => new Date(cd.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const upcomingCancelled = getUpcomingCancelledPractices();
  const nextCancelled = upcomingCancelled[0];
  const additionalCancelled = upcomingCancelled.length - 1;

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

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
            {nextPractice ? (
              <>
                <View style={styles.nextPracticeDateContainer}>
                  <Calendar color={Colors.light.primary} size={20} strokeWidth={2.5} />
                  <Text style={styles.nextPracticeDate}>
                    {nextPractice.date.toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                {nextPractice.trainings.map((training, idx) => {
                  const isCancelled = practiceSchedule.cancelledDates.some(
                    cd => cd.date === nextPractice.dateStr
                  );
                  
                  return (
                  <View key={training.id} style={styles.nextTrainingCard}>
                    <View style={styles.trainingNameRow}>
                      <Text style={styles.nextTrainingName}>{training.name}</Text>
                      <View style={[
                        styles.statusBadge,
                        isCancelled ? styles.statusBadgeCancelled : styles.statusBadgeActive
                      ]}>
                        <Text style={styles.statusBadgeText}>
                          {isCancelled ? "Gaat niet door" : "Gaat door"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.nextTrainingDetails}>
                      <View style={styles.nextTrainingDetailItem}>
                        <Clock color={Colors.light.muted} size={16} strokeWidth={2} />
                        <Text style={styles.nextTrainingDetailText}>{training.time}</Text>
                      </View>
                      <View style={styles.nextTrainingDetailItem}>
                        <Text style={styles.nextTrainingDetailText}>{training.location}</Text>
                      </View>
                    </View>
                  </View>
                  );
                })}
                {nextPractice.trainings.length > 1 && (
                  <View style={styles.multipleTrainingsBadgeInline}>
                    <Text style={styles.multipleTrainingsTextInline}>
                      {nextPractice.trainings.length} trainingen op deze dag
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>Geen aankomende trainingen</Text>
            )}
          </View>
        </TouchableOpacity>

        {nextCancelled && (
          <TouchableOpacity 
            style={styles.widget}
            onPress={() => setCancelledModalOpen(true)}
            testID="cancelled-practices-widget"
          >
            <View style={styles.widgetHeader}>
              <View style={[styles.widgetIconContainer, { backgroundColor: Colors.light.error + "20" }]}>
                <AlertCircle color={Colors.light.error} size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.widgetTitle}>Geannuleerde Trainingen</Text>
              {additionalCancelled > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>+{additionalCancelled}</Text>
                </View>
              )}
            </View>
            <View style={styles.widgetContent}>
              <Text style={styles.cancelledDateText}>{formatDate(nextCancelled.date)}</Text>
              {nextCancelled.reason && (
                <Text style={styles.cancelledReasonText}>{nextCancelled.reason}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={cancelledModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCancelledModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Geannuleerde Trainingen</Text>
              <TouchableOpacity onPress={() => setCancelledModalOpen(false)}>
                <X color={Colors.light.text} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {upcomingCancelled.map((cancelled, index) => (
                <View key={cancelled.date} style={styles.modalItem}>
                  <View style={styles.modalItemHeader}>
                    <Text style={styles.modalItemDate}>{formatDate(cancelled.date)}</Text>
                  </View>
                  {cancelled.reason && (
                    <Text style={styles.modalItemReason}>{cancelled.reason}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  practiceDayBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.muted,
    marginTop: 6,
  },
  practiceDayContent: {
    flex: 1,
    gap: 6,
  },
  practiceDayText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  trainingDetail: {
    backgroundColor: Colors.light.darkGray,
    padding: 10,
    borderRadius: 8,
    gap: 2,
  },
  trainingName: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  trainingTime: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: "500" as const,
  },
  multipleTrainingsBadge: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  multipleTrainingsText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  nextPracticeDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.darkGray,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  nextPracticeDate: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700" as const,
    flex: 1,
  },
  nextTrainingCard: {
    backgroundColor: Colors.light.darkGray,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  trainingNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  nextTrainingName: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "700" as const,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: Colors.light.success,
  },
  statusBadgeCancelled: {
    backgroundColor: Colors.light.error,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  nextTrainingDetails: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  nextTrainingDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextTrainingDetailText: {
    color: Colors.light.muted,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  multipleTrainingsBadgeInline: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  multipleTrainingsTextInline: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  countBadge: {
    backgroundColor: Colors.light.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  cancelledDateText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 6,
  },
  cancelledReasonText: {
    color: Colors.light.muted,
    fontSize: 14,
    fontStyle: "italic" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.error,
  },
  modalItemHeader: {
    marginBottom: 8,
  },
  modalItemDate: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  modalItemReason: {
    fontSize: 14,
    color: Colors.light.muted,
    fontStyle: "italic" as const,
  },
});
