import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Clock, Edit3, Loader2, MapPin, Plus, Trash2, X, Calendar as CalendarIcon, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { translations } from "@/constants/translations";
import { useAppState, CancelledPractice, Training } from "@/providers/AppState";
import { useTrainings } from "@/hooks/useTrainings";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = [0, 15, 30, 45];
const QUICK_TIMES = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];
const WHEEL_ITEM_HEIGHT = 48;

const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

type WheelPickerColumnProps = {
  label: string;
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  testID: string;
};

const WheelPickerColumn = ({ label, values, selected, onSelect, testID }: WheelPickerColumnProps) => {
  const listRef = useRef<FlatList<number>>(null);

  const scrollToValue = useCallback(
    (value: number, animated = true) => {
      const index = values.indexOf(value);
      if (index >= 0) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToOffset({ offset: index * WHEEL_ITEM_HEIGHT, animated });
        });
      }
    },
    [values],
  );

  useEffect(() => {
    scrollToValue(selected, false);
  }, [scrollToValue, selected]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
      const clampedIndex = Math.min(Math.max(index, 0), values.length - 1);
      const value = values[clampedIndex];
      if (value !== undefined) {
        onSelect(value);
        scrollToValue(value);
      }
    },
    [onSelect, scrollToValue, values],
  );

  return (
    <View style={styles.wheelColumn}>
      <Text style={styles.wheelLabel}>{label}</Text>
      <View style={styles.wheelListWrapper}>
        <FlatList
          ref={listRef}
          data={values}
          keyExtractor={(item) => `${testID}-${item}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={WHEEL_ITEM_HEIGHT}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: WHEEL_ITEM_HEIGHT, offset: WHEEL_ITEM_HEIGHT * index, index })}
          contentContainerStyle={{ paddingVertical: WHEEL_ITEM_HEIGHT * 1.5 }}
          onMomentumScrollEnd={handleMomentumEnd}
          onScrollEndDrag={handleMomentumEnd}
          renderItem={({ item }) => {
            const isActive = item === selected;
            return (
              <TouchableOpacity
                style={[styles.wheelItem, isActive && styles.wheelItemActive]}
                onPress={() => {
                  onSelect(item);
                  scrollToValue(item);
                }}
                testID={`${testID}-option-${item}`}
              >
                <Text style={[styles.wheelItemText, isActive && styles.wheelItemTextActive]}>{String(item).padStart(2, "0")}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <View style={styles.wheelHighlight} pointerEvents="none" />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0)"]}
          style={styles.pickerGradientTop}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)"]}
          style={styles.pickerGradientBottom}
        />
      </View>
    </View>
  );
};

type TrainingDraftState = {
  name: string;
  dayOfWeek: number;
  time: string;
  location: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

const formatTime = (hour: number, minute: number) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDatePickerDays = (baseDate: Date) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  
  const days: { date: number; isCurrentMonth: boolean; fullDate: string }[] = [];
  
  for (let i = 0; i < startDayOfWeek; i++) {
    const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
    days.push({
      date: prevMonthDay.getDate(),
      isCurrentMonth: false,
      fullDate: formatDateToLocal(prevMonthDay),
    });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const fullDate = new Date(year, month, i);
    days.push({
      date: i,
      isCurrentMonth: true,
      fullDate: formatDateToLocal(fullDate),
    });
  }
  
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const nextMonthDay = new Date(year, month + 1, i);
    days.push({
      date: i,
      isCurrentMonth: false,
      fullDate: formatDateToLocal(nextMonthDay),
    });
  }
  
  return days;
};

export default function RepetitieScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, language, syncAllData, practiceSchedule, updatePracticeSchedule, addAnnouncement } = useAppState();
  const t = translations[language].practices;
  const tc = translations[language].common;
  const WEEKDAYS_SHORT = t.weekdays.short;
  const WEEKDAYS_FULL = t.weekdays.full;
  const isAdmin = currentUser?.role === "admin";

  const { trainings, isLoading, addTraining, updateTraining, deleteTraining } = useTrainings();

  const defaultDay = new Date().getDay();
  const [formState, setFormState] = useState<TrainingDraftState>({
    name: "",
    dayOfWeek: defaultDay,
    time: "19:00",
    location: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDrafts, setEditingDrafts] = useState<Record<string, TrainingDraftState>>({});
  const [timePickerTarget, setTimePickerTarget] = useState<{ mode: "new" | "edit"; trainingId?: string } | null>(null);
  const [pickerHour, setPickerHour] = useState<number>(19);
  const [pickerMinute, setPickerMinute] = useState<number>(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddTrainingExpanded, setIsAddTrainingExpanded] = useState(false);

  // Cancellation Widget State
  const [showCancellationDropdown, setShowCancellationDropdown] = useState(false);
  const [selectedCancellationDates, setSelectedCancellationDates] = useState<string[]>([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const orderedTrainings = useMemo(() => {
    return [...trainings].sort((a, b) => {
      if (a.dayOfWeek === b.dayOfWeek) {
        return a.time.localeCompare(b.time);
      }
      return a.dayOfWeek - b.dayOfWeek;
    });
  }, [trainings]);

  const upcomingTrainings = useMemo(() => {
    if (orderedTrainings.length === 0) return [];

    const upcoming: { date: string; displayDate: string; trainings: Training[] }[] = [];
    const now = new Date();
    let current = new Date(now);
    
    let daysFound = 0;
    let attempts = 0;
    
    while (daysFound < 4 && attempts < 60) {
      const dayOfWeek = current.getDay();
      const dateStr = formatDateToLocal(current);
      
      const trainingsOnDay = orderedTrainings.filter(t => t.dayOfWeek === dayOfWeek);
      
      if (trainingsOnDay.length > 0) {
        const isCancelled = practiceSchedule.cancelledDates?.some(cd => cd.date === dateStr);
        const isSelectedForCancellation = selectedCancellationDates.includes(dateStr);
        
        if (!isCancelled && !isSelectedForCancellation) {
             upcoming.push({
            date: dateStr,
            displayDate: current.toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
            trainings: trainingsOnDay
          });
          daysFound++;
        }
      }
      
      current.setDate(current.getDate() + 1);
      attempts++;
    }
    
    return upcoming;
  }, [orderedTrainings, practiceSchedule.cancelledDates, selectedCancellationDates, language]);

  const handleToggleCancellationDate = (date: string) => {
    setSelectedCancellationDates(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleConfirmCancellation = async () => {
    if (selectedCancellationDates.length === 0) return;
    
    Alert.alert(
      "Trainingen annuleren",
      `Weet je zeker dat je trainingen op ${selectedCancellationDates.length} dagen wilt annuleren? Er wordt automatisch een mededeling verstuurd.`,
      [
        { text: "Annuleren", style: "cancel" },
        { 
          text: "Bevestigen", 
          onPress: async () => {
            try {
              setIsSubmitting(true);
              
              // 1. Update practice schedule
              const newCancelledDates: CancelledPractice[] = [
                ...(practiceSchedule.cancelledDates || []),
                ...selectedCancellationDates.map(date => ({ date, reason: "Geannuleerd via dashboard" }))
              ];
              
              // Remove duplicates just in case
              const uniqueCancelled = Array.from(new Map(newCancelledDates.map(item => [item.date, item])).values());
              
              await updatePracticeSchedule({
                ...practiceSchedule,
                cancelledDates: uniqueCancelled
              });
              
              // 2. Create announcements
              for (const dateStr of selectedCancellationDates) {
                const dateObj = new Date(dateStr);
                const formattedDate = dateObj.toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
                
                await addAnnouncement({
                  name: `Training geannuleerd: ${formattedDate}`,
                  description: `De trainingen op ${formattedDate} gaan niet door.`,
                  date: dateStr,
                });
              }
              
              setFeedback({ type: "success", message: "Trainingen geannuleerd en mededeling verstuurd" });
              setSelectedCancellationDates([]);
              setShowCancellationDropdown(false);
              
            } catch (error) {
              console.error("Error cancelling trainings:", error);
              setFeedback({ type: "error", message: "Er is iets misgegaan bij het annuleren." });
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };


  const openTimePicker = (mode: "new" | "edit", value: string, trainingId?: string) => {
    const [hour, minute] = value.split(":").map(Number);
    setPickerHour(hour);
    setPickerMinute(minute);
    setTimePickerTarget({ mode, trainingId });
  };

  const closeTimePicker = () => {
    setTimePickerTarget(null);
  };

  const handleTimeConfirm = () => {
    const value = formatTime(pickerHour, pickerMinute);
    if (timePickerTarget?.mode === "new") {
      setFormState((prev) => ({ ...prev, time: value }));
    } else if (timePickerTarget?.mode === "edit" && timePickerTarget.trainingId) {
      setEditingDrafts((prev) => ({
        ...prev,
        [timePickerTarget.trainingId!]: {
          ...(prev[timePickerTarget.trainingId!] ?? { name: "", dayOfWeek: 0, location: "", time: value }),
          time: value,
        },
      }));
    }
    closeTimePicker();
  };

  const handleQuickTimeSelect = (value: string) => {
    const [hour, minute] = value.split(":").map(Number);
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      setPickerHour(hour);
      setPickerMinute(minute);
    }
  };

  const ensureDraft = (trainingId: string, defaults: TrainingDraftState) => {
    setEditingDrafts((prev) => {
      if (prev[trainingId]) return prev;
      return { ...prev, [trainingId]: defaults };
    });
  };

  const handleCreateTraining = async () => {
    if (!isAdmin || isSubmitting) return;
    if (!formState.name.trim() || !formState.location.trim()) {
      setFeedback({ type: "error", message: "Vul naam en locatie in" });
      return;
    }

    setIsSubmitting(true);
    console.log("[Repetitie] Creating training", formState);
    try {
      await addTraining({
        name: formState.name.trim(),
        dayOfWeek: formState.dayOfWeek,
        time: formState.time,
        location: formState.location.trim(),
      });
      await syncAllData().catch((error) => console.warn("[Repetitie] Sync after create failed", error));
      setFormState({ name: "", dayOfWeek: defaultDay, time: "19:00", location: "" });
      setFeedback({ type: "success", message: "Training toegevoegd" });
    } catch (error) {
      console.error("[Repetitie] Create training error", error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : tc.error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (trainingId: string) => {
    const draft = editingDrafts[trainingId];
    if (!draft) return;
    console.log("[Repetitie] Saving training", trainingId, draft);
    try {
      await updateTraining({
        id: trainingId,
        name: draft.name.trim(),
        dayOfWeek: draft.dayOfWeek,
        time: draft.time,
        location: draft.location.trim(),
      });
      await syncAllData().catch((error) => console.warn("[Repetitie] Sync after update failed", error));
      setEditingId(null);
      setFeedback({ type: "success", message: "Training bijgewerkt" });
    } catch (error) {
      console.error("[Repetitie] Update training error", error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : tc.error });
    }
  };

  const handleDeleteTraining = async (trainingId: string) => {
    console.log("[Repetitie] Deleting training", trainingId);
    try {
      await deleteTraining(trainingId);
      await syncAllData().catch((error) => console.warn("[Repetitie] Sync after delete failed", error));
      setFeedback({ type: "success", message: "Training verwijderd" });
    } catch (error) {
      console.error("[Repetitie] Delete training error", error);
      setFeedback({ type: "error", message: error instanceof Error ? error.message : tc.error });
    }
  };

  const renderTimePicker = () => (
    <Modal visible={!!timePickerTarget} transparent animationType="fade" onRequestClose={closeTimePicker}>
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerCard}>
          <Text style={styles.timePickerTitle}>{t.selectTime}</Text>
          <Text style={styles.timePreview}>{formatTime(pickerHour, pickerMinute)}</Text>
          <View style={styles.wheelColumns}>
            <WheelPickerColumn label={t.hour} values={HOURS} selected={pickerHour} onSelect={setPickerHour} testID="hour-picker" />
            <WheelPickerColumn label={t.minute} values={MINUTES} selected={pickerMinute} onSelect={setPickerMinute} testID="minute-picker" />
          </View>

          <View style={styles.quickTimeRow}>
            <Text style={styles.quickTimeLabel}>Snelle selectie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickTimeChips}>
              {QUICK_TIMES.map((time) => {
                const isActive = time === formatTime(pickerHour, pickerMinute);
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.quickTimeChip, isActive && styles.quickTimeChipActive]}
                    onPress={() => handleQuickTimeSelect(time)}
                    testID={`quick-time-${time}`}
                  >
                    <Text style={[styles.quickTimeChipText, isActive && styles.quickTimeChipTextActive]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButtonAlt} onPress={closeTimePicker} testID="time-picker-cancel">
              <Text style={styles.modalButtonAltText}>{tc.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleTimeConfirm} testID="time-picker-confirm">
              <Text style={styles.modalButtonPrimaryText}>{tc.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "OneBand",
          headerLeft: () => <MenuButton onPress={() => setShowMenuModal(true)} />, 
          headerTitleStyle: styles.headerTitle,
          headerStyle: { backgroundColor: Colors.light.background },
          headerShadowVisible: false,
        }}
      />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}
        testID="repetitie-screen"
      >
        <LinearGradient colors={[Colors.light.primary, Colors.light.background]} style={styles.gradientBg} locations={[0, 0.35]} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroLabel}>{t.practiceSchedule}</Text>
              <Text style={styles.heroTitle}>{t.trainings}</Text>
              <Text style={styles.heroSubtitle}>Beheer hier je trainingen</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{orderedTrainings.length}</Text>
              <Text style={styles.heroBadgeLabel}>{t.trainings}</Text>
            </View>
          </View>

          {feedback && (
            <View style={[styles.feedbackCard, feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError]}>
              <Text style={styles.feedbackText}>{feedback.message}</Text>
              <TouchableOpacity onPress={() => setFeedback(null)}>
                <X size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {isAdmin && (
            <View style={styles.card} testID="training-create-form">
              <TouchableOpacity 
                style={styles.expandableHeader}
                onPress={() => setIsAddTrainingExpanded(!isAddTrainingExpanded)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{t.addTraining}</Text>
                  <Text style={styles.cardSubtitle}>Voeg direct een nieuwe training toe</Text>
                </View>
                {isAddTrainingExpanded ? (
                  <ChevronUp size={20} color={Colors.light.text} />
                ) : (
                  <ChevronDown size={20} color={Colors.light.text} />
                )}
              </TouchableOpacity>

              {isAddTrainingExpanded && (
                <View style={{ marginTop: 16, gap: 16 }}>
                  <TextInput
                    value={formState.name}
                    onChangeText={(text) => setFormState((prev) => ({ ...prev, name: text }))}
                    placeholder={t.trainingName}
                    placeholderTextColor={Colors.light.muted}
                    style={styles.input}
                  />
                  <View style={styles.daySelectorRow}>
                    {WEEKDAYS_SHORT.map((label, index) => (
                      <TouchableOpacity
                        key={label}
                        style={[styles.dayChip, formState.dayOfWeek === index && styles.dayChipActive]}
                        onPress={() => setFormState((prev) => ({ ...prev, dayOfWeek: index }))}
                      >
                        <Text style={[styles.dayChipText, formState.dayOfWeek === index && styles.dayChipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.timeSelector}
                    onPress={() => openTimePicker("new", formState.time)}
                    testID="new-training-time"
                  >
                    <Clock color={Colors.light.primary} size={18} />
                    <Text style={styles.timeSelectorText}>{formState.time}</Text>
                  </TouchableOpacity>
                  <TextInput
                    value={formState.location}
                    onChangeText={(text) => setFormState((prev) => ({ ...prev, location: text }))}
                    placeholder={t.location}
                    placeholderTextColor={Colors.light.muted}
                    style={styles.input}
                  />
                  <TouchableOpacity
                    style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
                    onPress={handleCreateTraining}
                    disabled={isSubmitting}
                    testID="create-training-button"
                  >
                    {isSubmitting ? (
                      <Loader2 color="#fff" size={18} />
                    ) : (
                      <Plus color="#fff" size={18} />
                    )}
                    <Text style={styles.primaryButtonText}>{t.addTraining}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {!isAdmin && (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>{t.adminOnly}</Text>
            </View>
          )}

          <View style={styles.card} testID="training-list">
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t.trainings}</Text>
              <Text style={styles.cardSubtitle}>Alle ingeplande repetities</Text>
            </View>
            {isLoading ? (
              <ActivityIndicator color={Colors.light.primary} style={{ marginVertical: 24 }} />
            ) : orderedTrainings.length === 0 ? (
              <Text style={styles.emptyText}>Geen trainingen gevonden</Text>
            ) : (
              orderedTrainings.map((training) => {
                const isEditing = editingId === training.id;
                const draft = editingDrafts[training.id] ?? {
                  name: training.name,
                  dayOfWeek: training.dayOfWeek,
                  time: training.time,
                  location: training.location,
                };

                return (
                  <View key={training.id} style={styles.trainingCard} testID={`training-card-${training.id}`}>
                    <View style={styles.trainingCardHeader}>
                      {isEditing ? (
                        <TextInput
                          value={draft.name}
                          onChangeText={(text) => {
                            ensureDraft(training.id, draft);
                            setEditingDrafts((prev) => ({ ...prev, [training.id]: { ...draft, name: text } }));
                          }}
                          style={styles.trainingNameInput}
                        />
                      ) : (
                        <Text style={styles.trainingName}>{training.name}</Text>
                      )}
                      {isAdmin && (
                        <View style={styles.trainingActions}>
                          {isEditing ? (
                            <>
                              <TouchableOpacity style={styles.actionButton} onPress={() => handleSaveEdit(training.id)}>
                                <Check color={Colors.light.success} size={18} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                  setEditingId(null);
                                  setEditingDrafts((prev) => ({ ...prev, [training.id]: draft }));
                                }}
                              >
                                <X color={Colors.light.error} size={18} />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                  ensureDraft(training.id, draft);
                                  setEditingId(training.id);
                                }}
                              >
                                <Edit3 color={Colors.light.text} size={18} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleDeleteTraining(training.id)}
                              >
                                <Trash2 color={Colors.light.error} size={18} />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      )}
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Clock color={Colors.light.muted} size={16} />
                        {isEditing ? (
                          <TouchableOpacity
                            style={styles.inlineTimeButton}
                            onPress={() => {
                              ensureDraft(training.id, draft);
                              openTimePicker("edit", draft.time, training.id);
                            }}
                          >
                            <Text style={styles.inlineTimeText}>{draft.time}</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.metaText}>{training.time}</Text>
                        )}
                      </View>
                      <View style={styles.metaItem}>
                        <MapPin color={Colors.light.muted} size={16} />
                        {isEditing ? (
                          <TextInput
                            value={draft.location}
                            style={styles.locationInput}
                            onChangeText={(text) => {
                              ensureDraft(training.id, draft);
                              setEditingDrafts((prev) => ({ ...prev, [training.id]: { ...draft, location: text } }));
                            }}
                          />
                        ) : (
                          <Text style={styles.metaText}>{training.location}</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.dayRow}>
                      {WEEKDAYS_SHORT.map((label, index) => (
                        <TouchableOpacity
                          key={`${training.id}-${label}`}
                          style={[styles.dayChipSmall, (isEditing ? draft.dayOfWeek : training.dayOfWeek) === index && styles.dayChipSmallActive]}
                          disabled={!isEditing}
                          onPress={() => {
                            ensureDraft(training.id, draft);
                            setEditingDrafts((prev) => ({ ...prev, [training.id]: { ...draft, dayOfWeek: index } }));
                          }}
                        >
                          <Text
                            style={[
                              styles.dayChipSmallText,
                              (isEditing ? draft.dayOfWeek : training.dayOfWeek) === index && styles.dayChipSmallTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.dayCaption}>{WEEKDAYS_FULL[isEditing ? draft.dayOfWeek : training.dayOfWeek]}</Text>
                  </View>
                );
              })
            )}
          </View>

          {isAdmin && (
            <View style={styles.card} testID="cancellation-widget">
              <Text style={styles.cardTitle}>Training annuleren</Text>
              <Text style={styles.cardSubtitle}>Selecteer dagen om trainingen te annuleren</Text>
              
              <TouchableOpacity 
                style={styles.dropdownHeader}
                onPress={() => setShowCancellationDropdown(!showCancellationDropdown)}
              >
                <Text style={styles.dropdownHeaderText}>
                  {selectedCancellationDates.length > 0 
                    ? `${selectedCancellationDates.length} dag(en) geselecteerd` 
                    : "Kies dagen"}
                </Text>
                {showCancellationDropdown ? (
                  <ChevronUp size={20} color={Colors.light.muted} />
                ) : (
                  <ChevronDown size={20} color={Colors.light.muted} />
                )}
              </TouchableOpacity>
              
              {showCancellationDropdown && (
                <View style={styles.dropdownContent}>
                  {upcomingTrainings.length === 0 ? (
                    <Text style={styles.emptyText}>Geen komende trainingen gevonden</Text>
                  ) : (
                    upcomingTrainings.map((item) => {
                      const isSelected = selectedCancellationDates.includes(item.date);
                      return (
                        <TouchableOpacity 
                          key={item.date} 
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                          onPress={() => handleToggleCancellationDate(item.date)}
                        >
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                            {item.displayDate}
                          </Text>
                          {isSelected && <Check size={16} color={Colors.light.primary} />}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setShowCalendarModal(true)}
              >
                <CalendarIcon size={18} color={Colors.light.text} />
                <Text style={styles.secondaryButtonText}>Kalender</Text>
              </TouchableOpacity>
              
              {selectedCancellationDates.length > 0 && (
                <View style={styles.selectedDatesContainer}>
                  <Text style={styles.selectedDatesTitle}>Geselecteerde dagen:</Text>
                  {selectedCancellationDates.sort().map(date => (
                    <View key={date} style={styles.selectedDateChip}>
                      <Text style={styles.selectedDateText}>
                        {new Date(date).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'short' })}
                      </Text>
                      <TouchableOpacity onPress={() => handleToggleCancellationDate(date)}>
                        <X size={14} color={Colors.light.text} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.dangerButton, selectedCancellationDates.length === 0 && styles.dangerButtonDisabled]}
                onPress={handleConfirmCancellation}
                disabled={selectedCancellationDates.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 color="#fff" size={18} />
                ) : (
                  <Trash2 color="#fff" size={18} />
                )}
                <Text style={styles.dangerButtonText}>Trainingen annuleren</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        <Modal
          visible={showCalendarModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCalendarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Kies dagen</Text>
                <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                  <X color={Colors.light.text} size={24} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.calendarHeader}>
                <TouchableOpacity 
                  onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  style={styles.calendarNavButton}
                >
                  <ChevronLeft color={Colors.light.text} size={20} />
                </TouchableOpacity>
                <Text style={styles.calendarMonthTitle}>
                  {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </Text>
                <TouchableOpacity 
                  onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  style={styles.calendarNavButton}
                >
                  <ChevronRight color={Colors.light.text} size={20} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.weekDaysRow}>
                {DAYS.map(day => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>
              
              <View style={styles.daysGrid}>
                {getDatePickerDays(calendarMonth).map((day, index) => {
                   const isSelected = selectedCancellationDates.includes(day.fullDate);
                   const isCancelled = practiceSchedule.cancelledDates?.some(cd => cd.date === day.fullDate);
                   
                   // Check if there is training on this day
                   const dateObj = new Date(day.fullDate);
                   const dayOfWeek = dateObj.getDay();
                   const hasTraining = orderedTrainings.some(t => t.dayOfWeek === dayOfWeek);
                   
                   return (
                    <TouchableOpacity
                      key={`${day.fullDate}-${index}`}
                      style={[
                        styles.dayCell,
                        !day.isCurrentMonth && styles.dayCellInactive,
                        isSelected && styles.dayCellSelected,
                        isCancelled && !isSelected && styles.dayCellCancelled
                      ]}
                      onPress={() => {
                        if (day.isCurrentMonth) {
                          handleToggleCancellationDate(day.fullDate);
                        }
                      }}
                      disabled={!day.isCurrentMonth}
                    >
                      <Text style={[
                        styles.dayText,
                        !day.isCurrentMonth && styles.dayTextInactive,
                        isSelected && styles.dayTextSelected,
                        isCancelled && !isSelected && styles.dayTextCancelled
                      ]}>
                        {day.date}
                      </Text>
                      {hasTraining && !isCancelled && !isSelected && (
                        <View style={styles.trainingDot} />
                      )}
                    </TouchableOpacity>
                   );
                })}
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalButtonPrimary} 
                  onPress={() => setShowCalendarModal(false)}
                >
                  <Text style={styles.modalButtonPrimaryText}>Klaar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {renderTimePicker()}
        <MenuModal visible={showMenuModal} onClose={() => setShowMenuModal(false)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800" as const,
    letterSpacing: 1,
  },
  heroCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  heroLabel: {
    color: Colors.light.muted,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  heroTitle: {
    color: Colors.light.text,
    fontSize: 26,
    fontWeight: "800" as const,
    marginTop: 6,
  },
  heroSubtitle: {
    color: Colors.light.muted,
    marginTop: 6,
  },
  heroBadge: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 90,
  },
  heroBadgeText: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#fff",
  },
  heroBadgeLabel: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    gap: 16,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  cardSubtitle: {
    color: Colors.light.muted,
    fontSize: 14,
  },
  input: {
    backgroundColor: Colors.light.surfaceLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.text,
    fontWeight: "600" as const,
  },
  daySelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    flex: 1,
    minWidth: 44,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceLight,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dayChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayChipText: {
    color: Colors.light.text,
    fontWeight: "700" as const,
  },
  dayChipTextActive: {
    color: "#fff",
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timeSelectorText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 16,
  },
  noticeCard: {
    backgroundColor: Colors.light.warning + "20",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.warning,
  },
  noticeText: {
    color: Colors.light.warning,
    fontWeight: "700" as const,
  },
  trainingCard: {
    backgroundColor: Colors.light.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  trainingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap" as const,
    marginBottom: 12,
    gap: 12,
  },
  trainingName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
    minWidth: 0,
  },
  trainingNameInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    fontSize: 18,
    fontWeight: "700" as const,
    paddingVertical: 2,
    color: Colors.light.text,
    minWidth: 0,
  },
  trainingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  metaText: {
    color: Colors.light.text,
    fontWeight: "600" as const,
  },
  locationInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.text,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 6,
  },
  dayChipSmall: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 10,
    paddingVertical: 8,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.surface,
  },
  dayChipSmallActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayChipSmallText: {
    fontSize: 12,
    color: Colors.light.muted,
    fontWeight: "700" as const,
  },
  dayChipSmallTextActive: {
    color: "#fff",
  },
  dayCaption: {
    textAlign: "center",
    color: Colors.light.muted,
    fontSize: 12,
  },
  emptyText: {
    color: Colors.light.muted,
    textAlign: "center",
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  timePickerCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    gap: 16,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    textAlign: "center",
    color: Colors.light.text,
  },
  timePreview: {
    fontSize: 34,
    fontWeight: "800" as const,
    textAlign: "center",
    color: Colors.light.primary,
  },
  wheelColumns: {
    flexDirection: "row",
    gap: 16,
  },
  wheelColumn: {
    flex: 1,
  },
  wheelLabel: {
    textAlign: "center",
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: Colors.light.muted,
    marginBottom: 6,
    fontWeight: "700" as const,
  },
  wheelListWrapper: {
    height: WHEEL_ITEM_HEIGHT * 5,
    borderRadius: 18,
    backgroundColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: "hidden",
    position: "relative",
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelItemActive: {},
  wheelItemText: {
    fontSize: 20,
    color: Colors.light.muted,
    fontWeight: "600" as const,
  },
  wheelItemTextActive: {
    color: Colors.light.text,
    fontSize: 28,
    fontWeight: "800" as const,
  },
  wheelHighlight: {
    position: "absolute",
    left: 8,
    right: 8,
    top: (WHEEL_ITEM_HEIGHT * 5 - WHEEL_ITEM_HEIGHT) / 2,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: Colors.light.primary + "1A",
    borderWidth: 1,
    borderColor: Colors.light.primary + "55",
  },
  pickerGradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT,
  },
  pickerGradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT,
  },
  quickTimeRow: {
    gap: 8,
  },
  quickTimeLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: Colors.light.muted,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  quickTimeChips: {
    flexDirection: "row",
    gap: 8,
  },
  quickTimeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  quickTimeChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  quickTimeChipText: {
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  quickTimeChipTextActive: {
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonAlt: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  modalButtonAltText: {
    color: Colors.light.text,
    fontWeight: "700" as const,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    color: "#fff",
    fontWeight: "700" as const,
  },
  inlineTimeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: Colors.light.surface,
  },
  inlineTimeText: {
    fontWeight: "700" as const,
    color: Colors.light.primary,
  },
  feedbackCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
  },
  feedbackSuccess: {
    backgroundColor: Colors.light.success + "22",
  },
  feedbackError: {
    backgroundColor: Colors.light.error + "22",
  },
  feedbackText: {
    color: Colors.light.text,
    fontWeight: "600" as const,
    flex: 1,
  },
  expandableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownHeader: {
    backgroundColor: Colors.light.surfaceLight,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dropdownHeaderText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dropdownContent: {
    backgroundColor: Colors.light.surfaceLight,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemSelected: {
    backgroundColor: Colors.light.primary + "1A",
  },
  dropdownItemText: {
    color: Colors.light.text,
    fontSize: 15,
  },
  dropdownItemTextSelected: {
    color: Colors.light.primary,
    fontWeight: '700' as const,
  },
  secondaryButton: {
    backgroundColor: Colors.light.surfaceLight,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryButtonText: {
    color: Colors.light.text,
    fontWeight: "600" as const,
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: Colors.light.error,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dangerButtonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.light.muted,
  },
  dangerButtonText: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 16,
  },
  selectedDatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedDatesTitle: {
    width: '100%',
    fontSize: 12,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  selectedDateChip: {
    backgroundColor: Colors.light.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedDateText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600' as const,
  },
  calendarModalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.light.muted,
    fontWeight: '700' as const,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  dayCellInactive: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: Colors.light.primary,
  },
  dayCellCancelled: {
    backgroundColor: Colors.light.error + "22",
  },
  dayText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600' as const,
  },
  dayTextInactive: {
    color: Colors.light.muted,
  },
  dayTextSelected: {
    color: "#fff",
  },
  dayTextCancelled: {
    color: Colors.light.error,
    textDecorationLine: 'line-through',
  },
  trainingDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
  },
});
