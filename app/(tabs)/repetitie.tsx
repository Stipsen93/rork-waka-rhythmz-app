import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAppState, PracticeDay, CancelledPractice } from "@/providers/AppState";
import { useState } from "react";
import { Trash2, ChevronDown } from "lucide-react-native";

const WEEKDAYS = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
const WEEKDAYS_FULL = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

type CancelOption = "next1" | "next2" | "next3" | "custom";

export default function RepetitieScreen() {
  const insets = useSafeAreaInsets();
  const { practiceSchedule, updatePracticeSchedule, currentUser } = useAppState();
  
  const [selectedDays, setSelectedDays] = useState<number[]>(
    practiceSchedule.regularDays.map(d => d.dayOfWeek)
  );
  const [time, setTime] = useState<string>(
    practiceSchedule.regularDays[0]?.time || "19:00"
  );
  const [location, setLocation] = useState<string>(practiceSchedule.location);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCancelOption, setSelectedCancelOption] = useState<CancelOption | null>(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [selectedCancelDates, setSelectedCancelDates] = useState<string[]>([]);
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});
  const [currentMonth] = useState(new Date());

  const isAdmin = currentUser?.role === "admin";

  const toggleDay = (day: number) => {
    if (!isAdmin) return;
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const getNextPracticeDates = (count: number): string[] => {
    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    
    while (dates.length < count) {
      const dayOfWeek = currentDate.getDay();
      if (selectedDays.includes(dayOfWeek)) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!practiceSchedule.cancelledDates.some(cd => cd.date === dateStr)) {
          dates.push(dateStr);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const handleCancelOptionSelect = (option: CancelOption) => {
    setSelectedCancelOption(option);
    setDropdownOpen(false);
    
    if (option === "next1") {
      setSelectedCancelDates(getNextPracticeDates(1));
    } else if (option === "next2") {
      setSelectedCancelDates(getNextPracticeDates(2));
    } else if (option === "next3") {
      setSelectedCancelDates(getNextPracticeDates(3));
    } else if (option === "custom") {
      setCalendarModalOpen(true);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isScheduledPracticeDay = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return selectedDays.includes(dayOfWeek) && date >= new Date(new Date().setHours(0, 0, 0, 0));
  };

  const handleCalendarDateToggle = (dateStr: string) => {
    setSelectedCancelDates(prev => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleCalendarConfirm = () => {
    setCalendarModalOpen(false);
  };

  const removeCancelDate = (dateStr: string) => {
    setSelectedCancelDates(prev => prev.filter(d => d !== dateStr));
    setCancelReasons(prev => {
      const newReasons = { ...prev };
      delete newReasons[dateStr];
      return newReasons;
    });
  };

  const handleSave = () => {
    if (!isAdmin) return;

    const regularDays: PracticeDay[] = selectedDays.map(day => ({
      dayOfWeek: day,
      time: time,
    }));

    const cancelledDates: CancelledPractice[] = selectedCancelDates.map(date => ({
      date,
      reason: cancelReasons[date],
    }));

    const allCancelledDates = [
      ...practiceSchedule.cancelledDates.filter(
        cd => !selectedCancelDates.includes(cd.date)
      ),
      ...cancelledDates,
    ];

    updatePracticeSchedule({
      regularDays,
      location,
      cancelledDates: allCancelledDates,
      isActive: true,
    });

    setSelectedCancelDates([]);
    setCancelReasons({});
    setSelectedCancelOption(null);
  };

  const renderCalendarModal = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }

    return (
      <Modal
        visible={calendarModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCalendarModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <Text style={styles.calendarTitle}>{monthName}</Text>
            
            <View style={styles.calendarHeader}>
              {WEEKDAYS.map(day => (
                <Text key={day} style={styles.calendarHeaderDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
                }

                const date = new Date(year, month, day);
                const dateStr = date.toISOString().split('T')[0];
                const isScheduled = isScheduledPracticeDay(date);
                const isSelected = selectedCancelDates.includes(dateStr);

                return (
                  <TouchableOpacity
                    key={day}
                    style={styles.calendarDayCell}
                    onPress={() => isScheduled && handleCalendarDateToggle(dateStr)}
                    disabled={!isScheduled}
                  >
                    <View style={[
                      styles.calendarDay,
                      isScheduled && styles.calendarDayScheduled,
                      isSelected && styles.calendarDayCancelled,
                    ]}>
                      <Text style={[
                        styles.calendarDayText,
                        isScheduled && styles.calendarDayTextScheduled,
                        isSelected && styles.calendarDayTextCancelled,
                        !isScheduled && styles.calendarDayTextDisabled,
                      ]}>{day}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => setCalendarModalOpen(false)}
              >
                <Text style={styles.calendarButtonText}>Terug</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.calendarButton, styles.calendarButtonPrimary]}
                onPress={handleCalendarConfirm}
              >
                <Text style={[styles.calendarButtonText, styles.calendarButtonTextPrimary]}>Selecteer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dayOfWeek = WEEKDAYS_FULL[date.getDay()];
    const day = date.getDate();
    const month = date.toLocaleDateString('nl-NL', { month: 'long' });
    return `${dayOfWeek} ${day} ${month}`;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Repetitie Planning</Text>

          {!isAdmin && (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>Alleen admins kunnen de planning aanpassen</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekdagen</Text>
            <View style={styles.weekdaysContainer}>
              {WEEKDAYS.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weekdayButton,
                    selectedDays.includes(index) && styles.weekdayButtonActive,
                    !isAdmin && styles.weekdayButtonDisabled,
                  ]}
                  onPress={() => toggleDay(index)}
                  disabled={!isAdmin}
                >
                  <Text style={[
                    styles.weekdayButtonText,
                    selectedDays.includes(index) && styles.weekdayButtonTextActive,
                  ]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tijd</Text>
            <TextInput
              style={[styles.input, !isAdmin && styles.inputDisabled]}
              value={time}
              onChangeText={setTime}
              placeholder="19:00"
              placeholderTextColor={Colors.light.mutedLight}
              editable={isAdmin}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plaats</Text>
            <TextInput
              style={[styles.input, !isAdmin && styles.inputDisabled]}
              value={location}
              onChangeText={setLocation}
              placeholder="Locatie"
              placeholderTextColor={Colors.light.mutedLight}
              editable={isAdmin}
            />
          </View>

          {isAdmin && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Training Annuleren</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Text style={styles.dropdownText}>
                    {selectedCancelOption === "next1" ? "Eerstvolgende training" :
                     selectedCancelOption === "next2" ? "Komende 2 trainingen" :
                     selectedCancelOption === "next3" ? "Komende 3 trainingen" :
                     selectedCancelOption === "custom" ? "Aangepast" :
                     "Selecteer optie"}
                  </Text>
                  <ChevronDown color={Colors.light.text} size={20} />
                </TouchableOpacity>

                {dropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleCancelOptionSelect("next1")}
                    >
                      <Text style={styles.dropdownItemText}>Eerstvolgende training</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleCancelOptionSelect("next2")}
                    >
                      <Text style={styles.dropdownItemText}>Komende 2 trainingen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleCancelOptionSelect("next3")}
                    >
                      <Text style={styles.dropdownItemText}>Komende 3 trainingen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleCancelOptionSelect("custom")}
                    >
                      <Text style={styles.dropdownItemText}>Aangepast</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {selectedCancelDates.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Geselecteerde Trainingen</Text>
                  {selectedCancelDates.map(dateStr => (
                    <View key={dateStr} style={styles.cancelDateItem}>
                      <View style={styles.cancelDateInfo}>
                        <Text style={styles.cancelDateText}>{formatDate(dateStr)}</Text>
                        <TextInput
                          style={styles.reasonInput}
                          value={cancelReasons[dateStr] || ""}
                          onChangeText={(text) => setCancelReasons(prev => ({ ...prev, [dateStr]: text }))}
                          placeholder="Optioneel: reden"
                          placeholderTextColor={Colors.light.mutedLight}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeCancelDate(dateStr)}
                      >
                        <Trash2 color={Colors.light.error} size={20} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {selectedCancelDates.length > 0 && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Opslaan</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {practiceSchedule.cancelledDates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Geannuleerde Trainingen</Text>
              {practiceSchedule.cancelledDates
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(cancelled => (
                  <View key={cancelled.date} style={styles.cancelledItem}>
                    <Text style={styles.cancelledDateText}>{formatDate(cancelled.date)}</Text>
                    {cancelled.reason && (
                      <Text style={styles.cancelledReasonText}>{cancelled.reason}</Text>
                    )}
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      </View>
      {renderCalendarModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.light.text,
    marginBottom: 24,
  },
  noticeCard: {
    backgroundColor: Colors.light.warning + "20",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.warning,
  },
  noticeText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  weekdaysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  weekdayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.surface,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  weekdayButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primaryDark,
  },
  weekdayButtonDisabled: {
    opacity: 0.6,
  },
  weekdayButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  weekdayButtonTextActive: {
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  inputDisabled: {
    backgroundColor: Colors.light.surfaceLight,
    opacity: 0.6,
  },
  dropdown: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  dropdownMenu: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  cancelDateItem: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelDateInfo: {
    flex: 1,
    marginRight: 12,
  },
  cancelDateText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.light.text,
  },
  deleteButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  cancelledItem: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.error,
  },
  cancelledDateText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  cancelledReasonText: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  calendarHeaderDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.muted,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
  },
  calendarDay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  calendarDayScheduled: {
    backgroundColor: Colors.light.success + "20",
    borderWidth: 2,
    borderColor: Colors.light.success,
  },
  calendarDayCancelled: {
    backgroundColor: Colors.light.error + "20",
    borderWidth: 2,
    borderColor: Colors.light.error,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  calendarDayTextScheduled: {
    color: Colors.light.success,
    fontWeight: "700" as const,
  },
  calendarDayTextCancelled: {
    color: Colors.light.error,
    fontWeight: "700" as const,
  },
  calendarDayTextDisabled: {
    color: Colors.light.mutedLight,
  },
  calendarActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  calendarButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.light.surfaceLight,
  },
  calendarButtonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  calendarButtonTextPrimary: {
    color: "#FFFFFF",
  },
});
