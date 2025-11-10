import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useState } from "react";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { useAppState } from "@/providers/AppState";
import { Plus, X, Trash2, Calendar, Edit2, ChevronLeft, ChevronRight } from "lucide-react-native";
import type { Announcement } from "@/providers/AppState";

const DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function NieuwsScreen() {
  const insets = useSafeAreaInsets();
  const [showMenuModal, setShowMenuModal] = useState(false);
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncements, currentUser, appointments } = useAppState();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(formatDateToLocal(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date());
  const [editPickerMonth, setEditPickerMonth] = useState<Date>(new Date());

  const isAdmin = currentUser?.role === "admin";

  const getDatePickerDays = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
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

  const handleAddAnnouncement = () => {
    if (!name.trim()) {
      Alert.alert("Fout", "Naam is verplicht");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Fout", "Omschrijving is verplicht");
      return;
    }
    
    addAnnouncement({ 
      name: name.trim(), 
      description: description.trim(),
      date: selectedDate
    });
    setName("");
    setDescription("");
    setSelectedDate(formatDateToLocal(new Date()));
    setShowAddModal(false);
  };



  const handleOpenEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setName(announcement.name);
    setDescription(announcement.description);
    setSelectedDate(announcement.date);
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingAnnouncement(null);
    setName("");
    setDescription("");
    setSelectedDate(formatDateToLocal(new Date()));
  };

  const handleSaveEdit = () => {
    if (!editingAnnouncement) return;
    
    if (!name.trim()) {
      Alert.alert("Fout", "Naam is verplicht");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Fout", "Omschrijving is verplicht");
      return;
    }
    
    updateAnnouncement(editingAnnouncement.id, {
      name: name.trim(),
      description: description.trim(),
      date: selectedDate
    });
    
    handleCancelEdit();
  };

  const handleDeleteFromEdit = () => {
    if (!editingAnnouncement) return;
    
    Alert.alert(
      "Mededeling verwijderen",
      "Weet je zeker dat je deze mededeling wilt verwijderen?",
      [
        { text: "Annuleer", style: "cancel" },
        { 
          text: "Verwijder", 
          style: "destructive", 
          onPress: () => {
            deleteAnnouncements([editingAnnouncement.id]);
            handleCancelEdit();
          } 
        },
      ]
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
          {isAdmin && (
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowAddModal(true)}
              testID="add-announcement-button"
            >
              <View style={styles.addButtonContent}>
                <View style={styles.addButtonIcon}>
                  <Plus color={Colors.light.background} size={24} strokeWidth={3} />
                </View>
                <View style={styles.addButtonTextContainer}>
                  <Text style={styles.addButtonTitle}>Nieuwe Mededeling</Text>
                  <Text style={styles.addButtonSubtitle}>Maak een nieuwe mededeling aan</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {announcements.filter((announcement) => {
            const isCancelledAppointmentNews = announcement.name.startsWith('Afspraak geannuleerd:');
            if (!isCancelledAppointmentNews) return true;
            
            const appointmentName = announcement.name.replace('Afspraak geannuleerd: ', '');
            const relatedAppointment = appointments.find(apt => 
              apt.name === appointmentName && apt.status === 'cancelled'
            );
            
            return !!relatedAppointment;
          }).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Geen mededelingen</Text>
              {isAdmin && (
                <Text style={styles.emptySubtext}>Maak je eerste mededeling aan</Text>
              )}
            </View>
          ) : (
            <View style={styles.announcementsList}>
              {announcements.filter((announcement) => {
                const isCancelledAppointmentNews = announcement.name.startsWith('Afspraak geannuleerd:');
                if (!isCancelledAppointmentNews) return true;
                
                const appointmentName = announcement.name.replace('Afspraak geannuleerd: ', '');
                const relatedAppointment = appointments.find(apt => 
                  apt.name === appointmentName && apt.status === 'cancelled'
                );
                
                return !!relatedAppointment;
              }).map((announcement) => (
                <TouchableOpacity 
                  key={announcement.id} 
                  style={styles.announcementCard}
                  onPress={() => isAdmin ? handleOpenEditModal(announcement) : null}
                  activeOpacity={isAdmin ? 0.7 : 1}
                >
                  <View style={styles.announcementHeader}>
                    <View style={styles.announcementNameContainer}>
                      <Text style={styles.announcementName}>{announcement.name}</Text>
                      {announcement.isExtraTraining && (
                        <View style={styles.extraTrainingBadge}>
                          <Text style={styles.extraTrainingBadgeText}>Extra training</Text>
                        </View>
                      )}
                    </View>
                    {isAdmin && (
                      <View style={styles.editIndicator}>
                        <Edit2 color={Colors.light.primary} size={18} strokeWidth={2.5} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.announcementDescription}>{announcement.description}</Text>
                  <View style={styles.announcementFooter}>
                    <Calendar color={Colors.light.muted} size={14} strokeWidth={2} />
                    <Text style={styles.announcementDate}>
                      {new Date(announcement.date).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nieuwe Mededeling</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeButton}>
              <X color={Colors.light.text} size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Naam *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Bijv. Nieuw trainingsschema"
                placeholderTextColor={Colors.light.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Omschrijving *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Beschrijf de mededeling..."
                placeholderTextColor={Colors.light.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Datum *</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => {
                  setShowDatePicker(!showDatePicker);
                  if (!showDatePicker) {
                    setPickerMonth(parseDateString(selectedDate));
                  }
                }}
              >
                <Calendar color={Colors.light.primary} size={20} strokeWidth={2.5} />
                <Text style={styles.datePickerButtonText}>
                  {parseDateString(selectedDate).toLocaleDateString('nl-NL', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.calendarPickerContainer}>
                  <View style={styles.calendarPickerHeader}>
                    <TouchableOpacity 
                      onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}
                      style={styles.calendarPickerButton}
                    >
                      <ChevronLeft color={Colors.light.text} size={20} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.calendarPickerMonth}>
                      {MONTHS[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}
                      style={styles.calendarPickerButton}
                    >
                      <ChevronRight color={Colors.light.text} size={20} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.calendarPickerWeekDays}>
                    {DAYS.map((day) => (
                      <Text key={day} style={styles.calendarPickerWeekDay}>{day}</Text>
                    ))}
                  </View>
                  <View style={styles.calendarPickerGrid}>
                    {getDatePickerDays(pickerMonth).map((day, index) => (
                      <TouchableOpacity
                        key={`${day.fullDate}-${index}`}
                        style={styles.calendarPickerDay}
                        onPress={() => {
                          if (day.isCurrentMonth) {
                            setSelectedDate(day.fullDate);
                            setShowDatePicker(false);
                          }
                        }}
                        disabled={!day.isCurrentMonth}
                      >
                        <View style={[
                          styles.calendarPickerDayCircle,
                          !day.isCurrentMonth && styles.calendarPickerDayInactive,
                          selectedDate === day.fullDate && styles.calendarPickerDaySelected,
                        ]}>
                          <Text style={[
                            styles.calendarPickerDayText,
                            !day.isCurrentMonth && styles.calendarPickerDayTextInactive,
                            selectedDate === day.fullDate && styles.calendarPickerDayTextSelected,
                          ]}>
                            {day.date}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddAnnouncement}
            >
              <Text style={styles.submitButtonText}>Toevoegen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mededeling Bewerken</Text>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.closeButton}>
              <X color={Colors.light.text} size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Naam *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Bijv. Nieuw trainingsschema"
                placeholderTextColor={Colors.light.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Omschrijving *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Beschrijf de mededeling..."
                placeholderTextColor={Colors.light.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Datum *</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => {
                  setShowEditDatePicker(!showEditDatePicker);
                  if (!showEditDatePicker) {
                    setEditPickerMonth(parseDateString(selectedDate));
                  }
                }}
              >
                <Calendar color={Colors.light.primary} size={20} strokeWidth={2.5} />
                <Text style={styles.datePickerButtonText}>
                  {parseDateString(selectedDate).toLocaleDateString('nl-NL', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
              {showEditDatePicker && (
                <View style={styles.calendarPickerContainer}>
                  <View style={styles.calendarPickerHeader}>
                    <TouchableOpacity 
                      onPress={() => setEditPickerMonth(new Date(editPickerMonth.getFullYear(), editPickerMonth.getMonth() - 1, 1))}
                      style={styles.calendarPickerButton}
                    >
                      <ChevronLeft color={Colors.light.text} size={20} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.calendarPickerMonth}>
                      {MONTHS[editPickerMonth.getMonth()]} {editPickerMonth.getFullYear()}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setEditPickerMonth(new Date(editPickerMonth.getFullYear(), editPickerMonth.getMonth() + 1, 1))}
                      style={styles.calendarPickerButton}
                    >
                      <ChevronRight color={Colors.light.text} size={20} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.calendarPickerWeekDays}>
                    {DAYS.map((day) => (
                      <Text key={day} style={styles.calendarPickerWeekDay}>{day}</Text>
                    ))}
                  </View>
                  <View style={styles.calendarPickerGrid}>
                    {getDatePickerDays(editPickerMonth).map((day, index) => (
                      <TouchableOpacity
                        key={`${day.fullDate}-${index}`}
                        style={styles.calendarPickerDay}
                        onPress={() => {
                          if (day.isCurrentMonth) {
                            setSelectedDate(day.fullDate);
                            setShowEditDatePicker(false);
                          }
                        }}
                        disabled={!day.isCurrentMonth}
                      >
                        <View style={[
                          styles.calendarPickerDayCircle,
                          !day.isCurrentMonth && styles.calendarPickerDayInactive,
                          selectedDate === day.fullDate && styles.calendarPickerDaySelected,
                        ]}>
                          <Text style={[
                            styles.calendarPickerDayText,
                            !day.isCurrentMonth && styles.calendarPickerDayTextInactive,
                            selectedDate === day.fullDate && styles.calendarPickerDayTextSelected,
                          ]}>
                            {day.date}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.submitButtonText}>Opslaan</Text>
            </TouchableOpacity>
            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButtonLarge}
                onPress={handleDeleteFromEdit}
              >
                <Trash2 color={Colors.light.background} size={20} strokeWidth={2.5} />
                <Text style={styles.deleteButtonText}>Verwijderen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 16,
  },
  addButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: "dashed" as const,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  addButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonTextContainer: {
    flex: 1,
  },
  addButtonTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  addButtonSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
    fontWeight: "500" as const,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  announcementsList: {
    gap: 12,
  },
  announcementCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  announcementNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  announcementName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  extraTrainingBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  extraTrainingBadgeText: {
    color: Colors.light.background,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 4,
  },
  editIndicator: {
    padding: 4,
  },
  editModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: "700" as const,
  },
  deleteButtonLarge: {
    flex: 1,
    backgroundColor: Colors.light.error,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
    color: Colors.light.background,
    fontSize: 17,
    fontWeight: "700" as const,
  },
  announcementDescription: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceLight,
  },
  announcementDate: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: "600" as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surfaceLight,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surfaceLight,
    gap: 12,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  submitButtonText: {
    color: Colors.light.background,
    fontSize: 17,
    fontWeight: "700" as const,
  },
  datePickerButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  datePickerButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
  },
  calendarPickerContainer: {
    marginTop: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    padding: 12,
  },
  calendarPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  calendarPickerButton: {
    padding: 4,
  },
  calendarPickerMonth: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  calendarPickerWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarPickerWeekDay: {
    flex: 1,
    textAlign: 'center',
    color: Colors.light.muted,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  calendarPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarPickerDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  calendarPickerDayCircle: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarPickerDayInactive: {
    opacity: 0.3,
  },
  calendarPickerDaySelected: {
    backgroundColor: Colors.light.primary,
  },
  calendarPickerDayText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  calendarPickerDayTextInactive: {
    color: Colors.light.muted,
  },
  calendarPickerDayTextSelected: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
});
