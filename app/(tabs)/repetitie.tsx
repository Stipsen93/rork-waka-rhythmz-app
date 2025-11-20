import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAppState, Training, CancelledPractice } from "@/providers/AppState";
import { useEffect, useState } from "react";
import { Trash2, ChevronDown, Clock, Plus, X, Check, Edit2, Undo2, ChevronLeft, ChevronRight } from "lucide-react-native";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { translations } from "@/constants/translations";



type CancelOption = "next1" | "next2" | "next3" | "custom";

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function RepetitieScreen() {
  const insets = useSafeAreaInsets();
  const { practiceSchedule, updatePracticeSchedule, currentUser, language } = useAppState();
  const t = translations[language].practices;
  const tc = translations[language].common;
  
  const WEEKDAYS = t.weekdays.short;
  const WEEKDAYS_FULL = t.weekdays.full;
  
  const filterOneTimeTrainings = (trainings: Training[]): Training[] => {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    now.setHours(0, 0, 0, 0);
    
    return trainings.filter(training => {
      if (!training.isOneTime) return true;
      
      const trainingDayOfWeek = training.dayOfWeek;
      
      let nextTrainingDate = new Date(now);
      const daysUntilTraining = (trainingDayOfWeek - currentDayOfWeek + 7) % 7;
      
      if (daysUntilTraining === 0) {
        return true;
      }
      
      nextTrainingDate.setDate(nextTrainingDate.getDate() + daysUntilTraining);
      
      return nextTrainingDate >= now;
    });
  };
  
  const [trainings, setTrainings] = useState<Training[]>(filterOneTimeTrainings(practiceSchedule.trainings || []));
  useEffect(() => {
    const syncedTrainings = filterOneTimeTrainings(practiceSchedule.trainings || []);
    setTrainings(syncedTrainings);
  }, [practiceSchedule.trainings]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCancelOption, setSelectedCancelOption] = useState<CancelOption | null>(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [selectedCancelDates, setSelectedCancelDates] = useState<string[]>([]);
  const [cancelReasons, setCancelReasons] = useState<Record<string, string>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [tempHour, setTempHour] = useState(19);
  const [tempMinute, setTempMinute] = useState(0);
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [lockedTrainings, setLockedTrainings] = useState<Set<string>>(new Set());
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [repeatDropdownOpen, setRepeatDropdownOpen] = useState<string | null>(null);
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState<string | null>(null);
  const [customDateMonth, setCustomDateMonth] = useState(new Date());

  const isAdmin = currentUser?.role === "admin";

  const updateTraining = (trainingId: string, updates: Partial<Training>) => {
    if (!isAdmin) return;
    setTrainings(prev => prev.map(t => t.id === trainingId ? { ...t, ...updates } : t));
  };

  const getRepeatModeLabel = (training: Training): string => {
    if (!training.repeatMode || training.repeatMode === 'none') return '-';
    if (training.repeatMode === '1x') return '1x';
    if (training.repeatMode === '2x') return '2x';
    if (training.repeatMode === 'custom') {
      if (training.customDate) {
        const date = new Date(training.customDate);
        return `${date.getDate()} ${date.toLocaleDateString('nl-NL', { month: 'short' })}`;
      }
      return t.custom;
    }
    return '-';
  };

  const toggleDay = (trainingId: string, day: number) => {
    if (!isAdmin) return;
    const training = trainings.find(t => t.id === trainingId);
    if (!training) return;
    
    updateTraining(trainingId, { dayOfWeek: day });
  };

  const addTraining = () => {
    if (!isAdmin) return;
    const newTraining: Training = {
      id: genId("t"),
      name: t.newTraining,
      dayOfWeek: 1,
      time: "19:00",
      location: "Zaal 3",
      isOneTime: false,
      repeatMode: 'none',
    };
    setTrainings(prev => [...prev, newTraining]);
  };

  const removeTraining = (trainingId: string) => {
    if (!isAdmin) return;
    setTrainings(prev => prev.filter(t => t.id !== trainingId));
    setLockedTrainings(prev => {
      const newSet = new Set(prev);
      newSet.delete(trainingId);
      return newSet;
    });
  };

  const toggleTrainingLock = (trainingId: string) => {
    if (!isAdmin) return;
    setLockedTrainings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trainingId)) {
        newSet.delete(trainingId);
      } else {
        newSet.add(trainingId);
      }
      return newSet;
    });
  };

  const getNextPracticeDates = (count: number): string[] => {
    const dates: string[] = [];
    const now = new Date();
    
    const selectedDays = trainings.map(t => t.dayOfWeek);
    
    console.log('getNextPracticeDates - selected days:', selectedDays);
    console.log('getNextPracticeDates - trainings:', trainings);
    console.log('getNextPracticeDates - current day:', now.getDay(), 'current date:', now.toISOString());
    
    if (selectedDays.length === 0) {
      console.log('No training days selected');
      return [];
    }
    
    let currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);
    
    const todayDayOfWeek = currentDate.getDay();
    console.log('Today is day:', todayDayOfWeek, WEEKDAYS_FULL[todayDayOfWeek]);
    
    let iterations = 0;
    const maxIterations = 365;
    
    while (dates.length < count && iterations < maxIterations) {
      iterations++;
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      console.log('Iteration', iterations, '- Checking date:', dateStr, 'dayOfWeek:', dayOfWeek, WEEKDAYS_FULL[dayOfWeek], 'matches:', selectedDays.includes(dayOfWeek));
      
      if (selectedDays.includes(dayOfWeek)) {
        dates.push(dateStr);
        console.log('✓ Added date:', dateStr, WEEKDAYS_FULL[dayOfWeek]);
      }
    }
    
    console.log('Final dates:', dates);
    return dates;
  }

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
    const selectedDays = trainings.map(t => t.dayOfWeek);
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

  const undoCancelledTraining = (dateStr: string) => {
    if (!isAdmin) return;
    
    updatePracticeSchedule({
      ...practiceSchedule,
      cancelledDates: practiceSchedule.cancelledDates.filter(cd => cd.date !== dateStr),
    });
  };

  const saveTrainingChanges = () => {
    if (!isAdmin) return;
    
    updatePracticeSchedule({
      ...practiceSchedule,
      regularDays: trainings.map(t => ({ dayOfWeek: t.dayOfWeek, time: t.time })),
      location: trainings[0]?.location || "Zaal 3",
      trainings: trainings,
    });
    
    const filtered = filterOneTimeTrainings(trainings);
    setTrainings(filtered);
  };

  const handleSave = () => {
    if (!isAdmin) return;

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
      regularDays: trainings.map(t => ({ dayOfWeek: t.dayOfWeek, time: t.time })),
      location: trainings[0]?.location || "Zaal 3",
      cancelledDates: allCancelledDates,
      isActive: true,
      trainings: trainings,
    });

    setSelectedCancelDates([]);
    setCancelReasons({});
    setSelectedCancelOption(null);
  };

  const goToPreviousCalendarMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextCalendarMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
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
            <View style={styles.calendarTitleContainer}>
              <TouchableOpacity onPress={goToPreviousCalendarMonth} style={styles.calendarNavButton}>
                <ChevronLeft color={Colors.light.primary} size={24} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>{monthName}</Text>
              <TouchableOpacity onPress={goToNextCalendarMonth} style={styles.calendarNavButton}>
                <ChevronRight color={Colors.light.primary} size={24} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            
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
                <Text style={styles.calendarButtonText}>{t.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.calendarButton, styles.calendarButtonPrimary]}
                onPress={handleCalendarConfirm}
              >
                <Text style={[styles.calendarButtonText, styles.calendarButtonTextPrimary]}>{t.select}</Text>
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

  const openTimePicker = (trainingId: string) => {
    if (!isAdmin) return;
    const training = trainings.find(t => t.id === trainingId);
    if (!training) return;
    
    const [hours, minutes] = training.time.split(':').map(Number);
    setTempHour(hours);
    setTempMinute(minutes);
    setEditingTrainingId(trainingId);
    setTimePickerOpen(true);
  };

  const handleTimeConfirm = () => {
    if (editingTrainingId) {
      const formattedTime = `${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`;
      updateTraining(editingTrainingId, { time: formattedTime });
    }
    setTimePickerOpen(false);
    setEditingTrainingId(null);
  };

  const renderCustomDatePicker = (trainingId: string) => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(customDateMonth);
    const monthName = customDateMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }

    const training = trainings.find(t => t.id === trainingId);
    const selectedDate = training?.customDate;

    return (
      <Modal
        visible={customDatePickerOpen === trainingId}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCustomDatePickerOpen(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarTitleContainer}>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(customDateMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCustomDateMonth(newDate);
                }}
                style={styles.calendarNavButton}
              >
                <ChevronLeft color={Colors.light.primary} size={24} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>{monthName}</Text>
              <TouchableOpacity
                onPress={() => {
                  const newDate = new Date(customDateMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCustomDateMonth(newDate);
                }}
                style={styles.calendarNavButton}
              >
                <ChevronRight color={Colors.light.primary} size={24} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            
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
                const isSelected = selectedDate === dateStr;
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <TouchableOpacity
                    key={day}
                    style={styles.calendarDayCell}
                    onPress={() => {
                      if (!isPast) {
                        updateTraining(trainingId, { customDate: dateStr });
                      }
                    }}
                    disabled={isPast}
                  >
                    <View style={[
                      styles.calendarDay,
                      isSelected && styles.calendarDayScheduled,
                    ]}>
                      <Text style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextScheduled,
                        isPast && styles.calendarDayTextDisabled,
                      ]}>{day}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => setCustomDatePickerOpen(null)}
              >
                <Text style={styles.calendarButtonText}>{tc.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.calendarButton, styles.calendarButtonPrimary]}
                onPress={() => {
                  setCustomDatePickerOpen(null);
                }}
              >
                <Text style={[styles.calendarButtonText, styles.calendarButtonTextPrimary]}>{t.select}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCircularTimePicker = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 15, 30, 45];

    return (
      <Modal
        visible={timePickerOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTimePickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <Text style={styles.timePickerTitle}>{t.selectTime}</Text>
            
            <View style={styles.timeDisplayContainer}>
              <Text style={styles.timeDisplay}>
                {String(tempHour).padStart(2, '0')}:{String(tempMinute).padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.scrollPickersContainer}>
              <View style={styles.scrollPickerColumn}>
                <Text style={styles.scrollPickerLabel}>{t.hour}</Text>
                <ScrollView 
                  style={styles.scrollPicker}
                  contentContainerStyle={styles.scrollPickerContent}
                  showsVerticalScrollIndicator={false}
                >
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.scrollPickerItem,
                        tempHour === hour && styles.scrollPickerItemActive
                      ]}
                      onPress={() => setTempHour(hour)}
                    >
                      <Text style={[
                        styles.scrollPickerItemText,
                        tempHour === hour && styles.scrollPickerItemTextActive
                      ]}>
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.scrollPickerColumn}>
                <Text style={styles.scrollPickerLabel}>{t.minute}</Text>
                <ScrollView 
                  style={styles.scrollPicker}
                  contentContainerStyle={styles.scrollPickerContent}
                  showsVerticalScrollIndicator={false}
                >
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.scrollPickerItem,
                        tempMinute === minute && styles.scrollPickerItemActive
                      ]}
                      onPress={() => setTempMinute(minute)}
                    >
                      <Text style={[
                        styles.scrollPickerItemText,
                        tempMinute === minute && styles.scrollPickerItemTextActive
                      ]}>
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.timePickerActions}>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setTimePickerOpen(false)}
              >
                <Text style={styles.timePickerButtonText}>{tc.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timePickerButton, styles.timePickerButtonPrimary]}
                onPress={handleTimeConfirm}
              >
                <Text style={[styles.timePickerButtonText, styles.timePickerButtonTextPrimary]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
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
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{t.practiceSchedule}</Text>

          {!isAdmin && (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>{t.adminOnly}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.trainings}</Text>
            
            {filterOneTimeTrainings(trainings).map((training) => {
              const isLocked = lockedTrainings.has(training.id);
              const isEditable = isAdmin && !isLocked;
              
              return (
              <View key={training.id} style={[
                styles.trainingBadge,
                repeatDropdownOpen === training.id && styles.trainingBadgeWithDropdown
              ]}>
                <View style={styles.trainingHeader}>
                  <TextInput
                    style={[styles.trainingNameInput, (!isEditable) && styles.inputDisabled]}
                    value={training.name}
                    onChangeText={(text) => updateTraining(training.id, { name: text })}
                    placeholder={t.trainingName}
                    placeholderTextColor={Colors.light.mutedLight}
                    editable={isEditable}
                  />
                  {isAdmin && (
                    <View style={styles.trainingActions}>
                      {!isLocked ? (
                        <>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                              toggleTrainingLock(training.id);
                              saveTrainingChanges();
                            }}
                          >
                            <Check color={Colors.light.success} size={20} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => removeTraining(training.id)}
                          >
                            <X color={Colors.light.error} size={20} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => toggleTrainingLock(training.id)}
                        >
                          <Edit2 color={Colors.light.primary} size={20} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.weekdaysContainer}>
                  {WEEKDAYS.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.weekdayButton,
                        training.dayOfWeek === index && styles.weekdayButtonActive,
                        !isEditable && styles.weekdayButtonDisabled,
                      ]}
                      onPress={() => toggleDay(training.id, index)}
                      disabled={!isEditable}
                    >
                      <Text style={[
                        styles.weekdayButtonText,
                        training.dayOfWeek === index && styles.weekdayButtonTextActive,
                      ]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.trainingDetailsRow}>
                  <TouchableOpacity
                    style={[styles.timeInput, !isEditable && styles.inputDisabled]}
                    onPress={() => openTimePicker(training.id)}
                    disabled={!isEditable}
                  >
                    <Clock color={Colors.light.primary} size={18} />
                    <Text style={styles.timeInputText}>{training.time}</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.locationInput, !isEditable && styles.inputDisabled]}
                    value={training.location}
                    onChangeText={(text) => updateTraining(training.id, { location: text })}
                    placeholder={t.location}
                    placeholderTextColor={Colors.light.mutedLight}
                    editable={isEditable}
                  />
                </View>

                <View style={styles.repeatModeContainer}>
                  <TouchableOpacity
                    style={[styles.repeatModeDropdown, !isEditable && styles.inputDisabled]}
                    onPress={() => setRepeatDropdownOpen(repeatDropdownOpen === training.id ? null : training.id)}
                    disabled={!isEditable}
                  >
                    <Text style={styles.repeatModeText}>{getRepeatModeLabel(training)}</Text>
                    <ChevronDown color={Colors.light.text} size={18} />
                  </TouchableOpacity>

                  {repeatDropdownOpen === training.id && (
                    <View style={styles.repeatDropdownMenu}>
                      <TouchableOpacity
                        style={styles.repeatDropdownItem}
                        onPress={() => {
                          updateTraining(training.id, { repeatMode: 'none', isOneTime: false, customDate: undefined });
                          setRepeatDropdownOpen(null);
                        }}
                      >
                        <Text style={styles.repeatDropdownItemText}>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.repeatDropdownItem}
                        onPress={() => {
                          updateTraining(training.id, { repeatMode: '1x', isOneTime: true, customDate: undefined });
                          setRepeatDropdownOpen(null);
                        }}
                      >
                        <Text style={styles.repeatDropdownItemText}>1x</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.repeatDropdownItem}
                        onPress={() => {
                          updateTraining(training.id, { repeatMode: '2x', isOneTime: false, customDate: undefined });
                          setRepeatDropdownOpen(null);
                        }}
                      >
                        <Text style={styles.repeatDropdownItemText}>2x</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.repeatDropdownItem}
                        onPress={() => {
                          updateTraining(training.id, { repeatMode: 'custom', isOneTime: true });
                          setRepeatDropdownOpen(null);
                          setCustomDatePickerOpen(training.id);
                        }}
                      >
                        <Text style={styles.repeatDropdownItemText}>{t.custom}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              );
            })}

            {isAdmin && (
              <TouchableOpacity style={styles.addTrainingButton} onPress={addTraining}>
                <Plus color={Colors.light.primary} size={24} strokeWidth={2.5} />
                <Text style={styles.addTrainingText}>{t.addTraining}</Text>
              </TouchableOpacity>
            )}
          </View>

          {isAdmin && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.cancelTraining}</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Text style={styles.dropdownText}>
                    {selectedCancelOption === "next1" ? t.next1 :
                     selectedCancelOption === "next2" ? t.next2 :
                     selectedCancelOption === "next3" ? t.next3 :
                     selectedCancelOption === "custom" ? t.custom :
                     t.selectOption}
                  </Text>
                  <ChevronDown color={Colors.light.text} size={20} />
                </TouchableOpacity>

                {dropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleCancelOptionSelect("next1")}
                    >
                      <Text style={styles.dropdownItemText}>{t.next1}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleCancelOptionSelect("next2")}
                    >
                      <Text style={styles.dropdownItemText}>{t.next2}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleCancelOptionSelect("next3")}
                    >
                      <Text style={styles.dropdownItemText}>{t.next3}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleCancelOptionSelect("custom")}
                    >
                      <Text style={styles.dropdownItemText}>{t.custom}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {selectedCancelDates.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t.selectedTrainings}</Text>
                  {selectedCancelDates.map(dateStr => (
                    <View key={dateStr} style={styles.cancelDateItem}>
                      <View style={styles.cancelDateInfo}>
                        <Text style={styles.cancelDateText}>{formatDate(dateStr)}</Text>
                        <TextInput
                          style={styles.reasonInput}
                          value={cancelReasons[dateStr] || ""}
                          onChangeText={(text) => setCancelReasons(prev => ({ ...prev, [dateStr]: text }))}
                          placeholder={t.optionalReason}
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
                  <Text style={styles.saveButtonText}>{tc.save}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {practiceSchedule.cancelledDates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.cancelledTrainings}</Text>
              {practiceSchedule.cancelledDates
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(cancelled => (
                  <View key={cancelled.date} style={styles.cancelledItemContainer}>
                    <View style={styles.cancelledItem}>
                      <View style={styles.cancelledInfo}>
                        <Text style={styles.cancelledDateText}>{formatDate(cancelled.date)}</Text>
                        {cancelled.reason && (
                          <Text style={styles.cancelledReasonText}>{cancelled.reason}</Text>
                        )}
                      </View>
                      {isAdmin && (
                        <TouchableOpacity
                          style={styles.undoButton}
                          onPress={() => undoCancelledTraining(cancelled.date)}
                        >
                          <Undo2 color={Colors.light.primary} size={22} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          )}
        </ScrollView>
      </View>
      {renderCalendarModal()}
      {renderCircularTimePicker()}
      {trainings.map(training => renderCustomDatePicker(training.id))}
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
  trainingBadge: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  trainingBadgeWithDropdown: {
    zIndex: 100,
    elevation: 100,
  },
  trainingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  trainingNameInput: {
    flex: 1,
    backgroundColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  trainingActions: {
    flexDirection: "row",
    gap: 4,
    marginRight: 4,
  },
  actionButton: {
    padding: 4,
  },
  weekdaysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  weekdayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceLight,
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
  trainingDetailsRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeInput: {
    flex: 1,
    backgroundColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInputText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "600" as const,
  },
  locationInput: {
    flex: 1,
    backgroundColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "600" as const,
  },
  addTrainingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: "dashed",
  },
  addTrainingText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: "700" as const,
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
  cancelledItemContainer: {
    marginBottom: 12,
  },
  cancelledItem: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelledInfo: {
    flex: 1,
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
  undoButton: {
    padding: 8,
    marginLeft: 12,
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
  calendarTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    textAlign: "center",
    flex: 1,
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
  timePickerModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 360,
    alignItems: "center",
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 20,
  },
  timeDisplayContainer: {
    backgroundColor: Colors.light.primary + "15",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  timeDisplay: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.light.primary,
    letterSpacing: 2,
  },
  scrollPickersContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
    width: "100%",
  },
  scrollPickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  scrollPickerLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  scrollPicker: {
    backgroundColor: Colors.light.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxHeight: 200,
    width: "100%",
  },
  scrollPickerContent: {
    paddingVertical: 8,
  },
  scrollPickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  scrollPickerItemActive: {
    backgroundColor: Colors.light.primary + "20",
  },
  scrollPickerItemText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  scrollPickerItemTextActive: {
    color: Colors.light.primary,
    fontWeight: "800" as const,
    fontSize: 20,
  },
  timePickerActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  timePickerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.light.surfaceLight,
  },
  timePickerButtonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  timePickerButtonTextPrimary: {
    color: "#FFFFFF",
  },
  oneTimeCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
  },
  checkboxDisabled: {
    opacity: 0.6,
  },
  oneTimeLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.muted,
  },
  oneTimeLabelActive: {
    color: Colors.light.primary,
    fontWeight: "700" as const,
  },
  repeatModeContainer: {
    marginTop: 12,
  },
  repeatModeDropdown: {
    backgroundColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  repeatModeText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "600" as const,
  },
  repeatDropdownMenu: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  repeatDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    backgroundColor: Colors.light.surface,
  },
  repeatDropdownItemText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: "600" as const,
  },
});
