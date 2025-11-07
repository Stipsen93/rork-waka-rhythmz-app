import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAppState } from "@/providers/AppState";
import { Bell, ChevronDown, ChevronUp, Clock, Newspaper, FileText, Calendar, AlertCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function MeldingenScreen() {
  const insets = useSafeAreaInsets();
  const { notificationSettings, updateNotificationSettings } = useAppState();
  
  const [newsEnabled, setNewsEnabled] = useState<boolean>(notificationSettings.newsEnabled);
  const [newsHoursAdvance, setNewsHoursAdvance] = useState<string>(notificationSettings.newsHoursAdvance.toString());
  
  const [assignmentsEnabled, setAssignmentsEnabled] = useState<boolean>(notificationSettings.assignmentsEnabled);
  
  const [trainingCancellationEnabled, setTrainingCancellationEnabled] = useState<boolean>(notificationSettings.trainingCancellationEnabled);
  const [trainingHoursAdvance, setTrainingHoursAdvance] = useState<string>(notificationSettings.trainingHoursAdvance.toString());
  
  const [performancesEnabled, setPerformancesEnabled] = useState<boolean>(notificationSettings.performancesEnabled);
  const [performancesHoursAdvance, setPerformancesHoursAdvance] = useState<string>(notificationSettings.performancesHoursAdvance.toString());

  const [showNewsTime, setShowNewsTime] = useState<boolean>(false);
  const [showTrainingTime, setShowTrainingTime] = useState<boolean>(false);
  const [showPerformanceTime, setShowPerformanceTime] = useState<boolean>(false);

  const saveSettings = () => {
    const newsHours = parseInt(newsHoursAdvance) || 24;
    const trainingHours = parseInt(trainingHoursAdvance) || 2;
    const performanceHours = parseInt(performancesHoursAdvance) || 48;

    updateNotificationSettings({
      newsEnabled,
      newsHoursAdvance: newsHours,
      assignmentsEnabled,
      trainingCancellationEnabled,
      trainingHoursAdvance: trainingHours,
      performancesEnabled,
      performancesHoursAdvance: performanceHours,
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
                <TouchableOpacity
                  style={styles.timeSelector}
                  onPress={() => setShowNewsTime(!showNewsTime)}
                >
                  <View style={styles.timeSelectorLeft}>
                    <Clock color={Colors.light.muted} size={18} strokeWidth={2} />
                    <Text style={styles.timeSelectorText}>Uren van tevoren: {newsHoursAdvance}</Text>
                  </View>
                  {showNewsTime ? (
                    <ChevronUp color={Colors.light.muted} size={20} />
                  ) : (
                    <ChevronDown color={Colors.light.muted} size={20} />
                  )}
                </TouchableOpacity>
                {showNewsTime && (
                  <TextInput
                    style={styles.hoursInput}
                    value={newsHoursAdvance}
                    onChangeText={setNewsHoursAdvance}
                    keyboardType="number-pad"
                    placeholder="24"
                    placeholderTextColor={Colors.light.muted}
                  />
                )}
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
                <TouchableOpacity
                  style={styles.timeSelector}
                  onPress={() => setShowTrainingTime(!showTrainingTime)}
                >
                  <View style={styles.timeSelectorLeft}>
                    <Clock color={Colors.light.muted} size={18} strokeWidth={2} />
                    <Text style={styles.timeSelectorText}>Uren van tevoren: {trainingHoursAdvance}</Text>
                  </View>
                  {showTrainingTime ? (
                    <ChevronUp color={Colors.light.muted} size={20} />
                  ) : (
                    <ChevronDown color={Colors.light.muted} size={20} />
                  )}
                </TouchableOpacity>
                {showTrainingTime && (
                  <TextInput
                    style={styles.hoursInput}
                    value={trainingHoursAdvance}
                    onChangeText={setTrainingHoursAdvance}
                    keyboardType="number-pad"
                    placeholder="2"
                    placeholderTextColor={Colors.light.muted}
                  />
                )}
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
                <TouchableOpacity
                  style={styles.timeSelector}
                  onPress={() => setShowPerformanceTime(!showPerformanceTime)}
                >
                  <View style={styles.timeSelectorLeft}>
                    <Clock color={Colors.light.muted} size={18} strokeWidth={2} />
                    <Text style={styles.timeSelectorText}>Uren van tevoren: {performancesHoursAdvance}</Text>
                  </View>
                  {showPerformanceTime ? (
                    <ChevronUp color={Colors.light.muted} size={20} />
                  ) : (
                    <ChevronDown color={Colors.light.muted} size={20} />
                  )}
                </TouchableOpacity>
                {showPerformanceTime && (
                  <TextInput
                    style={styles.hoursInput}
                    value={performancesHoursAdvance}
                    onChangeText={setPerformancesHoursAdvance}
                    keyboardType="number-pad"
                    placeholder="48"
                    placeholderTextColor={Colors.light.muted}
                  />
                )}
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
  timeSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeSelectorText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  hoursInput: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "600" as const,
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
