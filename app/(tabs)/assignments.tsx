import React, { useState, useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity, RefreshControl } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/providers/AppState";
import { useTrainings } from "@/hooks/useTrainings";
import { Clock, Video, Music, Calendar, AlertCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function AssignmentsScreen() {
  const { assignments, getRecentMedia, practiceSchedule, announcements, appointments, currentUser, syncAllData, users } = useAppState();
  const { trainings, isLoading: trainingsLoading } = useTrainings();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const recentMedia = React.useMemo(() => getRecentMedia(), [getRecentMedia]);
  
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = useCallback(async () => {
    console.log('🔄 [Manual Refresh] Starting manual sync...');
    setRefreshing(true);
    
    try {
      await syncAllData();
      console.log('✅ [Manual Refresh] Manual sync completed');
    } catch (error) {
      console.error('❌ [Manual Refresh] Manual sync failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [syncAllData]);
  
  const myAssignments = React.useMemo(() => {
    return assignments
      .filter(a => 
        a.assignedUserIds.length === 0 || a.assignedUserIds.includes(currentUser?.id ?? '')
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [assignments, currentUser]);
  
  const nextAssignment = myAssignments[0];
  
  const upcomingAnnouncements = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return announcements.filter(a => new Date(a.date) >= today);
  }, [announcements]);
  
  const upcomingAppointments = React.useMemo(() => {
    const now = new Date();
    return appointments.filter(a => {
      const appointmentDate = new Date(`${a.date} ${a.time}`);
      return appointmentDate >= now && a.status !== 'cancelled';
    }).sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [appointments]);
  
  const latestAnnouncement = upcomingAnnouncements[0];
  const nextAppointment = upcomingAppointments[0];

  const resolvedTrainings = React.useMemo(() => {
    if (trainings.length > 0) {
      return trainings;
    }
    return practiceSchedule.trainings ?? [];
  }, [trainings, practiceSchedule.trainings]);

  const getNextPracticeDate = React.useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    const maxDays = 30;
    let daysChecked = 0;
    
    console.log('[Dashboard] Getting next practice date');
    console.log('[Dashboard] Today:', today.toISOString());
    console.log('[Dashboard] Cancelled dates:', practiceSchedule.cancelledDates);
    console.log('[Dashboard] Trainings:', resolvedTrainings);
    
    while (daysChecked < maxDays) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      console.log('[Dashboard] Checking date:', dateStr, 'dayOfWeek:', dayOfWeek);
      
      const trainingsOnDay = resolvedTrainings.filter(t => t.dayOfWeek === dayOfWeek);
      
      if (trainingsOnDay.length > 0) {
        console.log('[Dashboard] Found trainings on:', dateStr, trainingsOnDay);
        return {
          date: currentDate,
          dateStr: dateStr,
          trainings: trainingsOnDay
        };
      }
      
      daysChecked++;
    }
    
    console.log('[Dashboard] No next practice found');
    return null;
  }, [resolvedTrainings, practiceSchedule.cancelledDates]);

  const nextPractice = React.useMemo(() => getNextPracticeDate(), [getNextPracticeDate]);

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="assignments-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.25, 1]}
      />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appName}>Waka Rythmz</Text>
          {currentUser && (
            <Text style={styles.userName}>{currentUser.username}</Text>
          )}
        </View>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Overzicht van recente activiteit</Text>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        <TouchableOpacity 
          style={styles.widget}
          onPress={() => router.push("/nieuws")}
          testID="nieuws-widget"
        >
          <View style={styles.widgetHeader}>
            <View style={styles.widgetIconContainer}>
              <Music color={Colors.light.primary} size={20} strokeWidth={2.5} />
            </View>
            <Text style={styles.widgetTitle}>Nieuws</Text>
          </View>
          <View style={styles.widgetContent}>
            {latestAnnouncement && (
              <View style={styles.newsItemCard}>
                <View style={styles.newsItemBadge}>
                  <Text style={styles.newsItemBadgeText}>Mededeling</Text>
                </View>
                <Text style={styles.newsItemName}>{latestAnnouncement.name}</Text>
                <Text style={styles.newsItemDescription} numberOfLines={2}>{latestAnnouncement.description}</Text>
                <View style={styles.newsItemDateContainer}>
                  <Calendar color={Colors.light.muted} size={14} strokeWidth={2} />
                  <Text style={styles.newsItemDateText}>
                    {new Date(latestAnnouncement.date).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            )}
            {nextAppointment && (
              <View style={[styles.newsItemCard, latestAnnouncement && styles.newsItemCardSpaced]}>
                <View style={[styles.newsItemBadge, styles.newsItemBadgeAppointment]}>
                  <Text style={styles.newsItemBadgeText}>Afspraak</Text>
                </View>
                <Text style={styles.newsItemName}>{nextAppointment.name}</Text>
                <Text style={styles.newsItemCategory}>{nextAppointment.category}</Text>
                <View style={styles.newsItemLocationContainer}>
                  <Text style={styles.newsItemLocation}>{nextAppointment.location}</Text>
                </View>
                <View style={styles.newsItemDateContainer}>
                  <Calendar color={Colors.light.muted} size={14} strokeWidth={2} />
                  <Text style={styles.newsItemDateText}>
                    {new Date(nextAppointment.date).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })} • {nextAppointment.time}
                  </Text>
                </View>
              </View>
            )}
            {!latestAnnouncement && !nextAppointment && (
              <Text style={styles.emptyText}>Geen nieuws</Text>
            )}
          </View>
        </TouchableOpacity>

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
            onPress={() => router.push("/huiswerk")}
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
            {trainingsLoading ? (
              <ActivityIndicator color={Colors.light.primary} />
            ) : nextPractice ? (
              <>
                {(() => {
                  console.log('[Dashboard Badge] Checking if cancelled');
                  console.log('[Dashboard Badge] nextPractice.dateStr:', nextPractice.dateStr);
                  console.log('[Dashboard Badge] cancelledDates:', JSON.stringify(practiceSchedule.cancelledDates));
                  
                  const isCancelled = practiceSchedule.cancelledDates.some(
                    cd => {
                      const match = cd.date === nextPractice.dateStr;
                      console.log('[Dashboard Badge] Comparing:', cd.date, '===', nextPractice.dateStr, '?', match);
                      return match;
                    }
                  );
                  
                  console.log('[Dashboard Badge] isCancelled result:', isCancelled);
                  
                  const cancelledInfo = practiceSchedule.cancelledDates.find(
                    cd => cd.date === nextPractice.dateStr
                  );
                  
                  const cancelledByUser = cancelledInfo?.cancelledBy ? 
                    users.find(u => u.id === cancelledInfo.cancelledBy) : null;
                  
                  return (
                    <>
                      <View style={styles.nextPracticeDateContainer}>
                        <Calendar color={isCancelled ? Colors.light.error : Colors.light.primary} size={20} strokeWidth={2.5} />
                        <Text style={styles.nextPracticeDate}>
                          {nextPractice.date.toLocaleDateString('nl-NL', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      {isCancelled && cancelledByUser && (
                        <View style={styles.cancelReasonBanner}>
                          <Text style={styles.cancelReasonText}>
                            Geannuleerd door {cancelledByUser.username}
                          </Text>
                        </View>
                      )}
                      {nextPractice.trainings.map((training, idx) => (
                        <View key={training.id} style={styles.nextTrainingCard}>
                          <View style={styles.trainingNameRow}>
                            <Text style={styles.nextTrainingName}>{training.name}</Text>
                            {isCancelled ? (
                              <View style={styles.statusBadgeCancelled}>
                                <Text style={styles.statusBadgeText}>gaat niet door</Text>
                              </View>
                            ) : (
                              <View style={styles.statusBadgeActive}>
                                <Text style={styles.statusBadgeText}>gaat door</Text>
                              </View>
                            )}
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
                      ))}
                      {nextPractice.trainings.length > 1 && (
                        <View style={styles.multipleTrainingsBadgeInline}>
                          <Text style={styles.multipleTrainingsTextInline}>
                            {nextPractice.trainings.length} trainingen op deze dag
                          </Text>
                        </View>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              <Text style={styles.emptyText}>Geen aankomende trainingen</Text>
            )}
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  appName: { 
    color: Colors.light.primary, 
    fontSize: 13, 
    fontWeight: "900" as const,
    letterSpacing: 2,
  },
  userName: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "700" as const,
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
  cancelReasonBanner: {
    backgroundColor: Colors.light.error + "20",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.error,
    marginBottom: 12,
  },
  cancelReasonText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600" as const,
    fontStyle: "italic" as const,
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
  announcementName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 10,
  },
  announcementDescription: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  announcementDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceLight,
  },
  announcementDateText: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: "600" as const,
  },
  newsItemCard: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 14,
  },
  newsItemCardSpaced: {
    marginTop: 10,
  },
  newsItemBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  newsItemBadgePerformance: {
    backgroundColor: Colors.light.success,
  },
  newsItemBadgeAppointment: {
    backgroundColor: "#8B5CF6",
  },
  newsItemCategory: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  newsItemLocationContainer: {
    marginBottom: 10,
  },
  newsItemLocation: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  newsItemBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  newsItemName: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  newsItemDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  newsItemDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newsItemDateText: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: "600" as const,
  },
});
