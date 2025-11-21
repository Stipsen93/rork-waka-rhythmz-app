import React, { useMemo, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Check, Clock, Edit3, Loader2, MapPin, Plus, Trash2, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { translations } from "@/constants/translations";
import { useAppState } from "@/providers/AppState";
import { useTrainings } from "@/hooks/useTrainings";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = [0, 15, 30, 45];

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

export default function RepetitieScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, language, syncAllData } = useAppState();
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

  const orderedTrainings = useMemo(() => {
    return [...trainings].sort((a, b) => {
      if (a.dayOfWeek === b.dayOfWeek) {
        return a.time.localeCompare(b.time);
      }
      return a.dayOfWeek - b.dayOfWeek;
    });
  }, [trainings]);

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
          <View style={styles.timePickerColumns}>
            <View style={styles.timePickerColumn}>
              <Text style={styles.timePickerLabel}>{t.hour}</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerList}>
                {HOURS.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.pickerItem, pickerHour === hour && styles.pickerItemActive]}
                    onPress={() => setPickerHour(hour)}
                  >
                    <Text style={[styles.pickerItemText, pickerHour === hour && styles.pickerItemTextActive]}>
                      {String(hour).padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.timePickerColumn}>
              <Text style={styles.timePickerLabel}>{t.minute}</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerList}>
                {MINUTES.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[styles.pickerItem, pickerMinute === minute && styles.pickerItemActive]}
                    onPress={() => setPickerMinute(minute)}
                  >
                    <Text style={[styles.pickerItemText, pickerMinute === minute && styles.pickerItemTextActive]}>
                      {String(minute).padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
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
          headerTitle: "WAKA RHYTHMZ",
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

          {isAdmin ? (
            <View style={styles.card} testID="training-create-form">
              <Text style={styles.cardTitle}>{t.addTraining}</Text>
              <Text style={styles.cardSubtitle}>Voeg direct een nieuwe training toe</Text>
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
          ) : (
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
        </ScrollView>
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
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  trainingName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
  },
  trainingNameInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    fontSize: 18,
    fontWeight: "700" as const,
    paddingVertical: 2,
    color: Colors.light.text,
  },
  trainingActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 6,
    backgroundColor: Colors.light.surface,
    borderRadius: 10,
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
  timePickerColumns: {
    flexDirection: "row",
    gap: 16,
  },
  timePickerColumn: {
    flex: 1,
    backgroundColor: Colors.light.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timePickerLabel: {
    textAlign: "center",
    paddingVertical: 8,
    fontWeight: "700" as const,
    color: Colors.light.muted,
  },
  pickerList: {
    paddingVertical: 8,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: "center",
  },
  pickerItemActive: {
    backgroundColor: Colors.light.primary + "22",
  },
  pickerItemText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  pickerItemTextActive: {
    color: Colors.light.primary,
    fontWeight: "800" as const,
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
});
