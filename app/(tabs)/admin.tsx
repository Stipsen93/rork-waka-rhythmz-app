import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View, Pressable, ScrollView, TouchableOpacity } from "react-native";
import Colors from "@/constants/colors";
import { Role, useAppState } from "@/providers/AppState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserPlus, Shield, User, Calendar as CalendarIcon, Clock, ChevronDown, ChevronUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const DAYS_OF_WEEK = [
  { id: 0, name: 'Zondag' },
  { id: 1, name: 'Maandag' },
  { id: 2, name: 'Dinsdag' },
  { id: 3, name: 'Woensdag' },
  { id: 4, name: 'Donderdag' },
  { id: 5, name: 'Vrijdag' },
  { id: 6, name: 'Zaterdag' },
];

function PracticeScheduleWidget() {
  const { practiceSchedule, updatePracticeSchedule } = useAppState();
  const [selectedDays, setSelectedDays] = useState<number[]>(practiceSchedule.regularDays.map(d => d.dayOfWeek));
  const [time, setTime] = useState<string>(practiceSchedule.regularDays[0]?.time || "19:00");
  const [isActive, setIsActive] = useState<boolean>(practiceSchedule.isActive);
  const [showDaySelector, setShowDaySelector] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [cancelledDates, setCancelledDates] = useState<string[]>(practiceSchedule.cancelledDates);

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId].sort();
      }
    });
  };

  const saveSchedule = () => {
    const newSchedule: typeof practiceSchedule = {
      regularDays: selectedDays.map(dayOfWeek => ({ dayOfWeek, time })),
      cancelledDates,
      isActive,
    };
    updatePracticeSchedule(newSchedule);
    Alert.alert('Opgeslagen', 'Oefeningsschema is bijgewerkt');
  };

  const toggleDate = (dateStr: string) => {
    setCancelledDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days: ({ date: Date; dateStr: string; isPracticeDay: boolean; isCancelled: boolean } | null)[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isPracticeDay = selectedDays.includes(dayOfWeek);
      const isCancelled = cancelledDates.includes(dateStr);
      days.push({ date, dateStr, isPracticeDay, isCancelled });
    }
    
    return days;
  };

  return (
    <View style={styles.practiceWidget}>
      <View style={styles.sectionHeader}>
        <CalendarIcon color={Colors.light.primary} size={22} strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>Oefening Schema</Text>
      </View>

      <View style={styles.practiceControl}>
        <Text style={styles.practiceLabel}>Dagen van de Week</Text>
        <TouchableOpacity 
          style={styles.daySelector}
          onPress={() => setShowDaySelector(!showDaySelector)}
        >
          <Text style={styles.daySelectorText}>
            {selectedDays.length === 0 ? 'Selecteer dagen' : selectedDays.map(d => DAYS_OF_WEEK.find(day => day.id === d)?.name.slice(0, 3)).join(', ')}
          </Text>
          {showDaySelector ? (
            <ChevronUp color={Colors.light.muted} size={20} />
          ) : (
            <ChevronDown color={Colors.light.muted} size={20} />
          )}
        </TouchableOpacity>
        
        {showDaySelector && (
          <View style={styles.dayList}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.id}
                style={[styles.dayItem, selectedDays.includes(day.id) && styles.dayItemSelected]}
                onPress={() => toggleDay(day.id)}
              >
                <Text style={[styles.dayItemText, selectedDays.includes(day.id) && styles.dayItemTextSelected]}>
                  {day.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.practiceControl}>
        <Text style={styles.practiceLabel}>Tijd</Text>
        <View style={styles.timeInputContainer}>
          <Clock color={Colors.light.muted} size={18} strokeWidth={2} />
          <TextInput
            style={styles.timeInput}
            value={time}
            onChangeText={setTime}
            placeholder="19:00"
            placeholderTextColor={Colors.light.muted}
          />
        </View>
      </View>

      <View style={styles.practiceControl}>
        <Text style={styles.practiceLabel}>Status</Text>
        <TouchableOpacity
          style={[styles.toggleContainer, isActive && styles.toggleContainerActive]}
          onPress={() => setIsActive(!isActive)}
        >
          <View style={[styles.toggleSlider, isActive && styles.toggleSliderActive]}>
            <View style={[styles.toggleBadge, { backgroundColor: isActive ? "#16A34A" : "#DC2626" }]}>
              <Text style={styles.toggleBadgeText}>{isActive ? "Gaat door" : "Gaat niet door"}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {selectedDays.length > 0 && (
        <View style={styles.practiceControl}>
          <TouchableOpacity
            style={styles.calendarToggle}
            onPress={() => setShowCalendar(!showCalendar)}
          >
            <Text style={styles.practiceLabel}>Afzeggen voor specifieke dagen</Text>
            {showCalendar ? (
              <ChevronUp color={Colors.light.muted} size={20} />
            ) : (
              <ChevronDown color={Colors.light.muted} size={20} />
            )}
          </TouchableOpacity>
          
          {showCalendar && (
            <View style={styles.calendar}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarHeaderText}>
                  {new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.calendarGrid}>
                {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(day => (
                  <View key={day} style={styles.calendarDayHeader}>
                    <Text style={styles.calendarDayHeaderText}>{day}</Text>
                  </View>
                ))}
                {getCalendarDays().map((dayData, idx) => {
                  if (!dayData) {
                    return <View key={`empty-${idx}`} style={styles.calendarDay} />;
                  }
                  
                  return (
                    <TouchableOpacity
                      key={dayData.dateStr}
                      style={[
                        styles.calendarDay,
                        dayData.isPracticeDay && styles.calendarDayPractice,
                        dayData.isCancelled && styles.calendarDayCancelled,
                      ]}
                      onPress={() => dayData.isPracticeDay && toggleDate(dayData.dateStr)}
                      disabled={!dayData.isPracticeDay}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        dayData.isPracticeDay && styles.calendarDayTextPractice,
                        dayData.isCancelled && styles.calendarDayTextCancelled,
                      ]}>
                        {dayData.date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      <Pressable style={styles.saveButton} onPress={saveSchedule}>
        <LinearGradient
          colors={[Colors.light.primary, Colors.light.primaryDark]}
          style={styles.saveButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.saveButtonText}>Schema Opslaan</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function AdminScreen() {
  const { users, addUser, setRole } = useAppState();
  const [username, setUsername] = useState<string>("");
  const [role, setRoleLocal] = useState<Role>("member");
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="admin-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.25, 1]}
      />
      
      <View style={styles.header}>
        <Text style={styles.appName}>WAKA RHYTHMZ</Text>
        <Text style={styles.title}>Beheer</Text>
        <Text style={styles.subtitle}>Beheer gebruikers & rechten</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <PracticeScheduleWidget />

        <View style={styles.createSection}>
        <View style={styles.sectionHeader}>
          <UserPlus color={Colors.light.primary} size={22} strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>Nieuwe Gebruiker Aanmaken</Text>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Voer gebruikersnaam in"
          placeholderTextColor={Colors.light.muted}
          value={username}
          onChangeText={setUsername}
          testID="new-username"
        />
        
        <View style={styles.roleSelector}>
          <Text style={styles.roleLabel}>Rol:</Text>
          <View style={styles.roleButtons}>
            <Pressable 
              style={[styles.roleButton, role === "member" && styles.roleButtonActive]} 
              onPress={() => setRoleLocal("member")}
            >
              <User color={role === "member" ? Colors.light.text : Colors.light.muted} size={16} strokeWidth={2} />
              <Text style={[styles.roleButtonText, role === "member" && styles.roleButtonTextActive]}>
                Lid
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.roleButton, role === "admin" && styles.roleButtonActive]} 
              onPress={() => setRoleLocal("admin")}
            >
              <Shield color={role === "admin" ? Colors.light.text : Colors.light.muted} size={16} strokeWidth={2} />
              <Text style={[styles.roleButtonText, role === "admin" && styles.roleButtonTextActive]}>
                Admin
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.createButton, { opacity: username ? 1 : 0.5 }]} 
          disabled={!username}
          onPress={() => {
            const { user, password } = addUser(username.trim(), role);
            Alert.alert("Account Aangemaakt", `Gebruikersnaam: ${user.username}\nWachtwoord: ${password}\n\nBewaar dit wachtwoord!`);
            setUsername("");
          }}
          testID="create-user"
        >
          <UserPlus color={Colors.light.text} size={20} strokeWidth={2.5} />
          <Text style={styles.createButtonText}>Account Aanmaken</Text>
        </Pressable>
        </View>

        <View style={styles.usersSection}>
        <Text style={styles.usersSectionTitle}>
          Alle Gebruikers ({users.length})
        </Text>
        
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userCardLeft}>
                <View style={[styles.userAvatar, item.role === "admin" && styles.userAvatarAdmin]}>
                  {item.role === "admin" ? (
                    <Shield color={Colors.light.text} size={20} strokeWidth={2.5} />
                  ) : (
                    <User color={Colors.light.muted} size={20} strokeWidth={2.5} />
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.username}</Text>
                  <Text style={styles.userRole}>{item.role.toUpperCase()}</Text>
                </View>
              </View>
              
              <View style={styles.userActions}>
                <Pressable 
                  style={[styles.actionButton, item.role === "member" && styles.actionButtonActive]} 
                  onPress={() => setRole(item.id, "member")} 
                  testID={`make-member-${item.id}`}
                >
                  <Text style={[styles.actionButtonText, item.role === "member" && styles.actionButtonTextActive]}>
                    Lid
                  </Text>
                </Pressable>
                <Pressable 
                  style={[styles.actionButton, item.role === "admin" && styles.actionButtonActive]} 
                  onPress={() => setRole(item.id, "admin")} 
                  testID={`make-admin-${item.id}`}
                >
                  <Text style={[styles.actionButtonText, item.role === "admin" && styles.actionButtonTextActive]}>
                    Admin
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
        </View>
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
  createSection: {
    marginHorizontal: 20,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "700" as const,
  },
  input: {
    backgroundColor: Colors.light.darkGray,
    borderColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.light.text,
    fontSize: 16,
    marginBottom: 16,
  },
  roleSelector: {
    marginBottom: 16,
  },
  roleLabel: {
    color: Colors.light.muted,
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 10,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.darkGray,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  roleButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  roleButtonText: {
    color: Colors.light.muted,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  roleButtonTextActive: {
    color: Colors.light.text,
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonText: { 
    color: Colors.light.text, 
    fontWeight: "700" as const,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 24,
  },
  practiceWidget: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    gap: 16,
  },
  practiceControl: {
    gap: 10,
  },
  practiceLabel: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  daySelector: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  daySelectorText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  dayList: {
    gap: 8,
    marginTop: 4,
  },
  dayItem: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  dayItemSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayItemText: {
    color: Colors.light.muted,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  dayItemTextSelected: {
    color: Colors.light.text,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    gap: 10,
  },
  timeInput: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "600" as const,
    paddingVertical: 14,
  },
  toggleContainer: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  toggleContainerActive: {
    backgroundColor: Colors.light.surfaceLight,
  },
  toggleSlider: {
    alignItems: "flex-start",
  },
  toggleSliderActive: {
    alignItems: "flex-end",
  },
  toggleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBadgeText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  calendarToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calendar: {
    marginTop: 8,
  },
  calendarHeader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  calendarHeaderText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700" as const,
    textTransform: "capitalize" as const,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayHeader: {
    width: "14.28%",
    paddingVertical: 8,
    alignItems: "center",
  },
  calendarDayHeaderText: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 4,
  },
  calendarDayPractice: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 8,
  },
  calendarDayCancelled: {
    backgroundColor: "#DC2626",
  },
  calendarDayText: {
    color: Colors.light.muted,
    fontSize: 14,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  calendarDayTextPractice: {
    color: Colors.light.text,
    fontWeight: "700" as const,
  },
  calendarDayTextCancelled: {
    color: Colors.light.text,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  saveButtonGradient: {
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  usersSection: {
    gap: 12,
  },
  usersSectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  list: { 
    gap: 12,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  userAvatarAdmin: {
    backgroundColor: Colors.light.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: { 
    color: Colors.light.text, 
    fontSize: 17, 
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  userRole: { 
    color: Colors.light.muted, 
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  userActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    backgroundColor: Colors.light.darkGray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  actionButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  actionButtonText: { 
    color: Colors.light.muted, 
    fontWeight: "700" as const,
    fontSize: 13,
  },
  actionButtonTextActive: {
    color: Colors.light.text,
  },
});
