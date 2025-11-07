import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAppState } from "@/providers/AppState";
import { Bell, Newspaper, FileText, Calendar, AlertCircle, Plus, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

type TimeOption = { label: string; hours: number };

const TIME_OPTIONS: TimeOption[] = [
  { label: "1 uur", hours: 1 },
  { label: "2 uur", hours: 2 },
  { label: "3 uur", hours: 3 },
  { label: "6 uur", hours: 6 },
  { label: "12 uur", hours: 12 },
  { label: "24 uur", hours: 24 },
  { label: "48 uur", hours: 48 },
  { label: "3 dagen", hours: 72 },
  { label: "7 dagen", hours: 168 },
];

export default function MeldingenScreen() {
  const insets = useSafeAreaInsets();
  const { notificationSettings, updateNotificationSettings } = useAppState();
  
  const [newsEnabled, setNewsEnabled] = useState<boolean>(notificationSettings.newsEnabled);
  const [newsReminders, setNewsReminders] = useState<number[]>([notificationSettings.newsHoursAdvance]);
  
  const [assignmentsEnabled, setAssignmentsEnabled] = useState<boolean>(notificationSettings.assignmentsEnabled);
  const [assignmentsReminders, setAssignmentsReminders] = useState<number[]>([notificationSettings.newsHoursAdvance]);
  
  const [trainingCancellationEnabled, setTrainingCancellationEnabled] = useState<boolean>(notificationSettings.trainingCancellationEnabled);
  const [trainingReminders, setTrainingReminders] = useState<number[]>([notificationSettings.trainingHoursAdvance]);
  
  const [performancesEnabled, setPerformancesEnabled] = useState<boolean>(notificationSettings.performancesEnabled);
  const [performancesReminders, setPerformancesReminders] = useState<number[]>([notificationSettings.performancesHoursAdvance]);

  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const getTimeLabel = (hours: number): string => {
    const option = TIME_OPTIONS.find(opt => opt.hours === hours);
    return option ? option.label : `${hours} uur`;
  };

  const addReminder = (type: 'news' | 'assignments' | 'training' | 'performances') => {
    switch(type) {
      case 'news':
        setNewsReminders([...newsReminders, 24]);
        break;
      case 'assignments':
        setAssignmentsReminders([...assignmentsReminders, 24]);
        break;
      case 'training':
        setTrainingReminders([...trainingReminders, 2]);
        break;
      case 'performances':
        setPerformancesReminders([...performancesReminders, 48]);
        break;
    }
  };

  const removeReminder = (type: 'news' | 'assignments' | 'training' | 'performances', index: number) => {
    switch(type) {
      case 'news':
        if (newsReminders.length > 1) {
          setNewsReminders(newsReminders.filter((_, i) => i !== index));
        }
        break;
      case 'assignments':
        if (assignmentsReminders.length > 1) {
          setAssignmentsReminders(assignmentsReminders.filter((_, i) => i !== index));
        }
        break;
      case 'training':
        if (trainingReminders.length > 1) {
          setTrainingReminders(trainingReminders.filter((_, i) => i !== index));
        }
        break;
      case 'performances':
        if (performancesReminders.length > 1) {
          setPerformancesReminders(performancesReminders.filter((_, i) => i !== index));
        }
        break;
    }
  };

  const updateReminder = (type: 'news' | 'assignments' | 'training' | 'performances', index: number, hours: number) => {
    switch(type) {
      case 'news':
        const newNewsReminders = [...newsReminders];
        newNewsReminders[index] = hours;
        setNewsReminders(newNewsReminders);
        break;
      case 'assignments':
        const newAssignmentsReminders = [...assignmentsReminders];
        newAssignmentsReminders[index] = hours;
        setAssignmentsReminders(newAssignmentsReminders);
        break;
      case 'training':
        const newTrainingReminders = [...trainingReminders];
        newTrainingReminders[index] = hours;
        setTrainingReminders(newTrainingReminders);
        break;
      case 'performances':
        const newPerformancesReminders = [...performancesReminders];
        newPerformancesReminders[index] = hours;
        setPerformancesReminders(newPerformancesReminders);
        break;
    }
  };

  const saveSettings = () => {
    updateNotificationSettings({
      newsEnabled,
      newsHoursAdvance: newsReminders[0] || 24,
      assignmentsEnabled,
      trainingCancellationEnabled,
      trainingHoursAdvance: trainingReminders[0] || 2,
      performancesEnabled,
      performancesHoursAdvance: performancesReminders[0] || 48,
    });

    Alert.alert("Opgeslagen", "Notificatie-instellingen zijn bijgewerkt");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <LinearGradient 
          colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
          style={styles.headerBg} 
          locations={[0, 0.25, 1]}
        />
        
        <View style={styles.header}>
          <Text style={styles.appName}>WAKA RHYTHMZ</Text>
          <Text style={styles.title}>Meldingen</Text>
          <Text style={styles.subtitle}>Beheer notificatie-instellingen</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Newspaper color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>Nieuws</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, newsEnabled && styles.toggleActive]}
                onPress={() => setNewsEnabled(!newsEnabled)}
              >
                <View style={[styles.toggleThumb, newsEnabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            {newsEnabled && (
              <View style={styles.cardContent}>
                <Text style={styles.cardDescription}>Leden krijgen een melding wanneer er een nieuwsbericht wordt geplaatst</Text>
                <View style={styles.remindersContainer}>
                  <Text style={styles.remindersTitle}>Herinneringen:</Text>
                  {newsReminders.map((hours, index) => (
                    <View key={`news-reminder-${index}-${hours}`} style={styles.reminderRow}>
                      <TouchableOpacity
                        style={styles.timeSelector}
                        onPress={() => setShowDropdown(`news-${index}`)}
                      >
                        <Text style={styles.timeSelectorText}>{getTimeLabel(hours)} van tevoren</Text>
                      </TouchableOpacity>
                      {newsReminders.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => removeReminder('news', index)}
                        >
                          <X color={Colors.light.primaryDark} size={20} strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addReminder('news')}
                  >
                    <Plus color={Colors.light.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.addButtonText}>Herinnering toevoegen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <FileText color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>Huiswerk</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, assignmentsEnabled && styles.toggleActive]}
                onPress={() => setAssignmentsEnabled(!assignmentsEnabled)}
              >
                <View style={[styles.toggleThumb, assignmentsEnabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            {assignmentsEnabled && (
              <View style={styles.cardContent}>
                <Text style={styles.cardDescription}>Leden krijgen een melding wanneer er een nieuwe huiswerkopdracht is</Text>
                <View style={styles.remindersContainer}>
                  <Text style={styles.remindersTitle}>Herinneringen:</Text>
                  {assignmentsReminders.map((hours, index) => (
                    <View key={`assignments-reminder-${index}-${hours}`} style={styles.reminderRow}>
                      <TouchableOpacity
                        style={styles.timeSelector}
                        onPress={() => setShowDropdown(`assignments-${index}`)}
                      >
                        <Text style={styles.timeSelectorText}>{getTimeLabel(hours)} van tevoren</Text>
                      </TouchableOpacity>
                      {assignmentsReminders.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => removeReminder('assignments', index)}
                        >
                          <X color={Colors.light.primaryDark} size={20} strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addReminder('assignments')}
                  >
                    <Plus color={Colors.light.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.addButtonText}>Herinnering toevoegen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <AlertCircle color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>Trainingen</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, trainingCancellationEnabled && styles.toggleActive]}
                onPress={() => setTrainingCancellationEnabled(!trainingCancellationEnabled)}
              >
                <View style={[styles.toggleThumb, trainingCancellationEnabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            {trainingCancellationEnabled && (
              <View style={styles.cardContent}>
                <Text style={styles.cardDescription}>Leden krijgen een melding over trainingen die wel of niet doorgaan</Text>
                <View style={styles.remindersContainer}>
                  <Text style={styles.remindersTitle}>Herinneringen:</Text>
                  {trainingReminders.map((hours, index) => (
                    <View key={`training-reminder-${index}-${hours}`} style={styles.reminderRow}>
                      <TouchableOpacity
                        style={styles.timeSelector}
                        onPress={() => setShowDropdown(`training-${index}`)}
                      >
                        <Text style={styles.timeSelectorText}>{getTimeLabel(hours)} van tevoren</Text>
                      </TouchableOpacity>
                      {trainingReminders.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => removeReminder('training', index)}
                        >
                          <X color={Colors.light.primaryDark} size={20} strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addReminder('training')}
                  >
                    <Plus color={Colors.light.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.addButtonText}>Herinnering toevoegen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Calendar color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.cardTitle}>Optredens</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, performancesEnabled && styles.toggleActive]}
                onPress={() => setPerformancesEnabled(!performancesEnabled)}
              >
                <View style={[styles.toggleThumb, performancesEnabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            
            {performancesEnabled && (
              <View style={styles.cardContent}>
                <Text style={styles.cardDescription}>Leden krijgen een melding over aankomende optredens</Text>
                <View style={styles.remindersContainer}>
                  <Text style={styles.remindersTitle}>Herinneringen:</Text>
                  {performancesReminders.map((hours, index) => (
                    <View key={`performances-reminder-${index}-${hours}`} style={styles.reminderRow}>
                      <TouchableOpacity
                        style={styles.timeSelector}
                        onPress={() => setShowDropdown(`performances-${index}`)}
                      >
                        <Text style={styles.timeSelectorText}>{getTimeLabel(hours)} van tevoren</Text>
                      </TouchableOpacity>
                      {performancesReminders.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => removeReminder('performances', index)}
                        >
                          <X color={Colors.light.primaryDark} size={20} strokeWidth={2.5} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addReminder('performances')}
                  >
                    <Plus color={Colors.light.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.addButtonText}>Herinnering toevoegen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <LinearGradient
              colors={[Colors.light.primary, Colors.light.primaryDark]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Bell color={Colors.light.text} size={20} strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>Instellingen Opslaan</Text>
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
              <Text style={styles.dropdownTitle}>Selecteer tijd</Text>
              <ScrollView style={styles.dropdownScroll}>
                {TIME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.hours}
                    style={styles.dropdownOption}
                    onPress={() => {
                      if (showDropdown) {
                        const [type, indexStr] = showDropdown.split('-');
                        const index = parseInt(indexStr);
                        updateReminder(type as 'news' | 'assignments' | 'training' | 'performances', index, option.hours);
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
  remindersContainer: {
    gap: 10,
  },
  remindersTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginTop: 4,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.darkGray,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    borderStyle: "dashed" as const,
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.primary,
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
});
