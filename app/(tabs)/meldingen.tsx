import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAppState } from "@/providers/AppState";
import { Bell, Newspaper, FileText, Calendar, AlertCircle, Plus, X, Users } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { translations } from "@/constants/translations";

type TimeOption = { label: string; hours: number };

export default function MeldingenScreen() {
  const insets = useSafeAreaInsets();
  const { notificationSettings, updateNotificationSettings, users, updateUserNotificationPreferences, language } = useAppState();
  const t = translations[language];
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  
  const [newsPostEnabled, setNewsPostEnabled] = useState<boolean>(true);
  const [newsEventEnabled, setNewsEventEnabled] = useState<boolean>(true);
  const [newsEventHours, setNewsEventHours] = useState<number>(24);
  
  const [assignmentsAddedEnabled, setAssignmentsAddedEnabled] = useState<boolean>(true);
  const [assignmentsDeadlineEnabled, setAssignmentsDeadlineEnabled] = useState<boolean>(true);
  const [assignmentsDeadlineHours, setAssignmentsDeadlineHours] = useState<number>(24);
  
  const [trainingChangedEnabled, setTrainingChangedEnabled] = useState<boolean>(true);
  const [trainingReminderEnabled, setTrainingReminderEnabled] = useState<boolean>(true);
  const [trainingReminderHours, setTrainingReminderHours] = useState<number>(2);
  
  const [performancesAddedEnabled, setPerformancesAddedEnabled] = useState<boolean>(true);
  const [performancesReminderEnabled, setPerformancesReminderEnabled] = useState<boolean>(true);
  const [performancesReminderHours, setPerformancesReminderHours] = useState<number>(48);

  const [birthdayEnabled, setBirthdayEnabled] = useState<boolean>(true);
  const [birthdayReminderEnabled, setBirthdayReminderEnabled] = useState<boolean>(true);
  const [birthdayReminderHours, setBirthdayReminderHours] = useState<number>(24);

  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const members = useMemo(() => users.filter(u => u.role === 'member'), [users]);

  const getMembersForCategory = (category: 'news' | 'assignments' | 'trainings' | 'performances') => {
    return members.filter(m => {
      switch(category) {
        case 'news': return m.notificationPreferences.newsEnabled;
        case 'assignments': return m.notificationPreferences.assignmentsEnabled;
        case 'trainings': return m.notificationPreferences.trainingsEnabled;
        case 'performances': return m.notificationPreferences.performancesEnabled;
        default: return false;
      }
    });
  };

  const toggleMemberNotification = async (userId: string, category: 'news' | 'assignments' | 'trainings' | 'performances') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newPrefs = { ...user.notificationPreferences };
    switch(category) {
      case 'news': newPrefs.newsEnabled = !newPrefs.newsEnabled; break;
      case 'assignments': newPrefs.assignmentsEnabled = !newPrefs.assignmentsEnabled; break;
      case 'trainings': newPrefs.trainingsEnabled = !newPrefs.trainingsEnabled; break;
      case 'performances': newPrefs.performancesEnabled = !newPrefs.performancesEnabled; break;
    }

    await updateUserNotificationPreferences(userId, newPrefs);
  };

  const TIME_OPTIONS: TimeOption[] = useMemo(() => [
    { label: t.notifications.timeOptions.hour1, hours: 1 },
    { label: t.notifications.timeOptions.hour2, hours: 2 },
    { label: t.notifications.timeOptions.hour3, hours: 3 },
    { label: t.notifications.timeOptions.hour6, hours: 6 },
    { label: t.notifications.timeOptions.hour12, hours: 12 },
    { label: t.notifications.timeOptions.hour24, hours: 24 },
    { label: t.notifications.timeOptions.hour48, hours: 48 },
    { label: t.notifications.timeOptions.day3, hours: 72 },
    { label: t.notifications.timeOptions.day7, hours: 168 },
  ], [language]);

  const getTimeLabel = (hours: number): string => {
    const option = TIME_OPTIONS.find(opt => opt.hours === hours);
    return option ? option.label : `${hours} ${t.notifications.timeOptions.hour1.split(' ')[1]}`;
  };

  const saveSettings = () => {
    Alert.alert(t.notifications.saved, t.notifications.settingsUpdated);
  };

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
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient 
          colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
          style={styles.headerBg} 
          locations={[0, 0.25, 1]}
        />
        
        <View style={styles.header}>
          <Text style={styles.appName}>WAKA RHYTHMZ</Text>
          <Text style={styles.title}>{t.notifications.title}</Text>
          <Text style={styles.subtitle}>{t.notifications.subtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Newspaper color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>{t.notifications.news}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <TouchableOpacity 
                style={styles.membersSection}
                onPress={() => setExpandedCategory(expandedCategory === 'news' ? null : 'news')}
              >
                <View style={styles.membersSectionHeader}>
                  <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                  <Text style={styles.membersSectionTitle}>
                    {getMembersForCategory('news').length} / {members.length} {t.notifications.membersReceiving}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {expandedCategory === 'news' && (
                <View style={styles.membersList}>
                  {members.map(member => {
                    const isEnabled = member.notificationPreferences.newsEnabled;
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={[styles.memberChip, isEnabled && styles.memberChipActive]}
                        onPress={() => toggleMemberNotification(member.id, 'news')}
                      >
                        <Text style={[styles.memberChipText, isEnabled && styles.memberChipTextActive]}>
                          {member.username}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.notificationOnNewPost}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, newsPostEnabled && styles.toggleActive]}
                    onPress={() => setNewsPostEnabled(!newsPostEnabled)}
                  >
                    <View style={[styles.toggleThumb, newsPostEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.eventReminder}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, newsEventEnabled && styles.toggleActive]}
                    onPress={() => setNewsEventEnabled(!newsEventEnabled)}
                  >
                    <View style={[styles.toggleThumb, newsEventEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                {newsEventEnabled && (
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => setShowDropdown('news-event')}
                  >
                    <Text style={styles.timeSelectorText}>{getTimeLabel(newsEventHours)} {t.notifications.inAdvance}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <FileText color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>{t.notifications.homework}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <TouchableOpacity 
                style={styles.membersSection}
                onPress={() => setExpandedCategory(expandedCategory === 'assignments' ? null : 'assignments')}
              >
                <View style={styles.membersSectionHeader}>
                  <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                  <Text style={styles.membersSectionTitle}>
                    {getMembersForCategory('assignments').length} / {members.length} {t.notifications.membersReceiving}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {expandedCategory === 'assignments' && (
                <View style={styles.membersList}>
                  {members.map(member => {
                    const isEnabled = member.notificationPreferences.assignmentsEnabled;
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={[styles.memberChip, isEnabled && styles.memberChipActive]}
                        onPress={() => toggleMemberNotification(member.id, 'assignments')}
                      >
                        <Text style={[styles.memberChipText, isEnabled && styles.memberChipTextActive]}>
                          {member.username}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.notificationOnNewHomework}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, assignmentsAddedEnabled && styles.toggleActive]}
                    onPress={() => setAssignmentsAddedEnabled(!assignmentsAddedEnabled)}
                  >
                    <View style={[styles.toggleThumb, assignmentsAddedEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.deadlineReminder}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, assignmentsDeadlineEnabled && styles.toggleActive]}
                    onPress={() => setAssignmentsDeadlineEnabled(!assignmentsDeadlineEnabled)}
                  >
                    <View style={[styles.toggleThumb, assignmentsDeadlineEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                {assignmentsDeadlineEnabled && (
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => setShowDropdown('assignments-deadline')}
                  >
                    <Text style={styles.timeSelectorText}>{getTimeLabel(assignmentsDeadlineHours)} {t.notifications.inAdvance}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <AlertCircle color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>{t.notifications.trainings}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <TouchableOpacity 
                style={styles.membersSection}
                onPress={() => setExpandedCategory(expandedCategory === 'trainings' ? null : 'trainings')}
              >
                <View style={styles.membersSectionHeader}>
                  <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                  <Text style={styles.membersSectionTitle}>
                    {getMembersForCategory('trainings').length} / {members.length} {t.notifications.membersReceiving}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {expandedCategory === 'trainings' && (
                <View style={styles.membersList}>
                  {members.map(member => {
                    const isEnabled = member.notificationPreferences.trainingsEnabled;
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={[styles.memberChip, isEnabled && styles.memberChipActive]}
                        onPress={() => toggleMemberNotification(member.id, 'trainings')}
                      >
                        <Text style={[styles.memberChipText, isEnabled && styles.memberChipTextActive]}>
                          {member.username}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.notificationOnChange}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, trainingChangedEnabled && styles.toggleActive]}
                    onPress={() => setTrainingChangedEnabled(!trainingChangedEnabled)}
                  >
                    <View style={[styles.toggleThumb, trainingChangedEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.trainingReminder}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, trainingReminderEnabled && styles.toggleActive]}
                    onPress={() => setTrainingReminderEnabled(!trainingReminderEnabled)}
                  >
                    <View style={[styles.toggleThumb, trainingReminderEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                {trainingReminderEnabled && (
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => setShowDropdown('training-reminder')}
                  >
                    <Text style={styles.timeSelectorText}>{getTimeLabel(trainingReminderHours)} {t.notifications.inAdvance}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Calendar color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>{t.notifications.performances}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <TouchableOpacity 
                style={styles.membersSection}
                onPress={() => setExpandedCategory(expandedCategory === 'performances' ? null : 'performances')}
              >
                <View style={styles.membersSectionHeader}>
                  <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                  <Text style={styles.membersSectionTitle}>
                    {getMembersForCategory('performances').length} / {members.length} {t.notifications.membersReceiving}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {expandedCategory === 'performances' && (
                <View style={styles.membersList}>
                  {members.map(member => {
                    const isEnabled = member.notificationPreferences.performancesEnabled;
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={[styles.memberChip, isEnabled && styles.memberChipActive]}
                        onPress={() => toggleMemberNotification(member.id, 'performances')}
                      >
                        <Text style={[styles.memberChipText, isEnabled && styles.memberChipTextActive]}>
                          {member.username}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.notificationOnNewPerformance}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, performancesAddedEnabled && styles.toggleActive]}
                    onPress={() => setPerformancesAddedEnabled(!performancesAddedEnabled)}
                  >
                    <View style={[styles.toggleThumb, performancesAddedEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.performanceReminder}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, performancesReminderEnabled && styles.toggleActive]}
                    onPress={() => setPerformancesReminderEnabled(!performancesReminderEnabled)}
                  >
                    <View style={[styles.toggleThumb, performancesReminderEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                {performancesReminderEnabled && (
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => setShowDropdown('performances-reminder')}
                  >
                    <Text style={styles.timeSelectorText}>{getTimeLabel(performancesReminderHours)} {t.notifications.inAdvance}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Calendar color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>{t.notifications.birthdays}</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <TouchableOpacity 
                style={styles.membersSection}
                onPress={() => setExpandedCategory(expandedCategory === 'birthdays' ? null : 'birthdays')}
              >
                <View style={styles.membersSectionHeader}>
                  <Users color={Colors.light.primary} size={18} strokeWidth={2.5} />
                  <Text style={styles.membersSectionTitle}>
                    {t.notifications.allMembersReceiving}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.notificationOnBirthday}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, birthdayEnabled && styles.toggleActive]}
                    onPress={() => setBirthdayEnabled(!birthdayEnabled)}
                  >
                    <View style={[styles.toggleThumb, birthdayEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.toggleSection}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t.notifications.birthdayReminder}</Text>
                  <TouchableOpacity
                    style={[styles.toggle, birthdayReminderEnabled && styles.toggleActive]}
                    onPress={() => setBirthdayReminderEnabled(!birthdayReminderEnabled)}
                  >
                    <View style={[styles.toggleThumb, birthdayReminderEnabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                {birthdayReminderEnabled && (
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => setShowDropdown('birthday-reminder')}
                  >
                    <Text style={styles.timeSelectorText}>{getTimeLabel(birthdayReminderHours)} {t.notifications.inAdvance}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <LinearGradient
              colors={[Colors.light.primary, Colors.light.primaryDark]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Bell color={Colors.light.text} size={20} strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>{t.notifications.saveSettings}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showDropdown !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(null)}
          >
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>{t.notifications.selectTime}</Text>
              <ScrollView style={styles.dropdownScroll}>
                {TIME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.hours}
                    style={styles.dropdownOption}
                    onPress={() => {
                      if (showDropdown === 'news-event') {
                        setNewsEventHours(option.hours);
                      } else if (showDropdown === 'assignments-deadline') {
                        setAssignmentsDeadlineHours(option.hours);
                      } else if (showDropdown === 'training-reminder') {
                        setTrainingReminderHours(option.hours);
                      } else if (showDropdown === 'performances-reminder') {
                        setPerformancesReminderHours(option.hours);
                      } else if (showDropdown === 'birthday-reminder') {
                        setBirthdayReminderHours(option.hours);
                      }
                      setShowDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
      <MenuModal 
        visible={showMenuModal} 
        onClose={() => setShowMenuModal(false)}
      />
    </>
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
    paddingBottom: 20,
  },
  appName: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: "900" as const,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: Colors.light.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.muted,
    marginTop: 8,
    fontWeight: "500" as const,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    gap: 16,
  },
  notificationCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.darkGray,
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: Colors.light.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.surface,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  cardContent: {
    marginTop: 16,
    gap: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  timeSelectorText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  toggleSection: {
    gap: 8,
    marginTop: 12,
  },
  toggleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  dropdownScroll: {
    maxHeight: 400,
  },
  dropdownOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  dropdownOptionText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
    textAlign: "center" as const,
  },
  saveButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  membersSection: {
    marginTop: 12,
  },
  membersSectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    padding: 12,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  membersSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  membersList: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 12,
  },
  memberChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.darkGray,
    borderWidth: 1.5,
    borderColor: Colors.light.surfaceLight,
  },
  memberChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  memberChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.light.muted,
  },
  memberChipTextActive: {
    color: Colors.light.text,
  },
});
