import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, Platform, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAppState, Assignment } from "@/providers/AppState";
import { useState, useEffect } from "react";
import { Plus, X, Calendar, Users, Video, Image as ImageIcon, Music, FileText, Trash2, CheckCircle2, Folder, Upload, ArrowLeft, ChevronRight, ChevronLeft } from "lucide-react-native";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";

import * as DocumentPicker from 'expo-document-picker';
import { supabase } from "@/lib/supabase";

const DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function AddAssignmentModal({ visible, onClose, editingAssignment }: { visible: boolean; onClose: () => void; editingAssignment?: Assignment }) {
  const { addAssignment, updateAssignment, users } = useAppState();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState<string>(editingAssignment?.title ?? "");
  const [description, setDescription] = useState<string>(editingAssignment?.description ?? "");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(editingAssignment?.assignedUserIds ?? []);
  const [dueDate, setDueDate] = useState<Date>(editingAssignment?.dueDate ? new Date(editingAssignment.dueDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date());
  const [mediaUri, setMediaUri] = useState<string>(editingAssignment?.mediaUri ?? "");
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'audio' | undefined>(editingAssignment?.mediaType);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingAssignment) {
      setTitle(editingAssignment.title);
      setDescription(editingAssignment.description);
      setSelectedUserIds(editingAssignment.assignedUserIds);
      setDueDate(editingAssignment.dueDate ? new Date(editingAssignment.dueDate) : new Date());
      setMediaUri(editingAssignment.mediaUri ?? "");
      setMediaType(editingAssignment.mediaType);
    } else {
      resetForm();
    }
  }, [editingAssignment]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedUserIds([]);
    setDueDate(new Date());
    setMediaUri("");
    setMediaType(undefined);
    setIsUploading(false);
  };

  const pickAndUploadMedia = async () => {
    try {
      setIsUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `assignments/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, blob, {
          contentType: file.mimeType || 'application/octet-stream',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      setMediaUri(urlData.publicUrl);

      if (file.mimeType?.startsWith('video/')) {
        setMediaType('video');
      } else if (file.mimeType?.startsWith('image/')) {
        setMediaType('image');
      } else if (file.mimeType?.startsWith('audio/')) {
        setMediaType('audio');
      }

      Alert.alert("Succes", "Media is succesvol geüpload!");
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert("Fout", "Er is een fout opgetreden bij het uploaden van media");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Fout", "Voer een titel in voor de opdracht");
      return;
    }

    if (editingAssignment) {
      updateAssignment(editingAssignment.id, {
        title: title.trim(),
        description: description.trim(),
        assignedUserIds: selectedUserIds,
        dueDate: dueDate.toISOString(),
        mediaUri: mediaUri.trim() || undefined,
        mediaType,
      });
      Alert.alert("Succes", "Huiswerk opdracht is bijgewerkt!");
    } else {
      addAssignment({
        title: title.trim(),
        description: description.trim(),
        assignedUserIds: selectedUserIds,
        dueDate: dueDate.toISOString(),
        mediaUri: mediaUri.trim() || undefined,
        mediaType,
      });
      Alert.alert("Succes", "Huiswerk opdracht is toegevoegd!");
    }

    resetForm();
    onClose();
  };

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const selectAllUsers = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={localStyles.modalOverlay}>
        <View style={[localStyles.modalContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <View style={localStyles.modalHeader}>
            <Text style={localStyles.modalTitle}>{editingAssignment ? "Opdracht Bewerken" : "Nieuwe Opdracht"}</Text>
            <Pressable onPress={onClose}>
              <X color={Colors.light.text} size={28} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView style={localStyles.modalScroll} contentContainerStyle={localStyles.modalScrollContent}>
            <Text style={localStyles.label}>Opdracht Naam</Text>
            <TextInput
              style={localStyles.input}
              placeholder="Bijv. Groove oefening week 3"
              placeholderTextColor={Colors.light.muted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={localStyles.label}>Omschrijving</Text>
            <TextInput
              style={[localStyles.input, localStyles.textArea]}
              placeholder="Beschrijf de opdracht..."
              placeholderTextColor={Colors.light.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <View style={localStyles.membersSection}>
              <View style={localStyles.membersSectionHeader}>
                <Text style={localStyles.label}>Selecteer Leden</Text>
                <Pressable onPress={selectAllUsers} style={localStyles.selectAllButton}>
                  <Text style={localStyles.selectAllText}>
                    {selectedUserIds.length === users.length ? "Deselecteer Alles" : "Selecteer Alles"}
                  </Text>
                </Pressable>
              </View>
              <View style={localStyles.membersList}>
                {users.map(user => (
                  <Pressable
                    key={user.id}
                    style={[localStyles.memberChip, selectedUserIds.includes(user.id) && localStyles.memberChipSelected]}
                    onPress={() => toggleUser(user.id)}
                  >
                    <Text style={[localStyles.memberChipText, selectedUserIds.includes(user.id) && localStyles.memberChipTextSelected]}>
                      {user.username}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Text style={localStyles.label}>Deadline Datum & Tijd</Text>
            <View style={localStyles.dateTimeContainer}>
              <Pressable
                style={localStyles.dateTimeButton}
                onPress={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowHourPicker(false);
                  if (!showDatePicker) {
                    setPickerMonth(dueDate);
                  }
                }}
              >
                <Calendar color={Colors.light.primary} size={20} />
                <Text style={localStyles.dateTimeText}>
                  {dueDate.toLocaleDateString("nl-NL", { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
              </Pressable>
              <Pressable
                style={localStyles.dateTimeButton}
                onPress={() => {
                  setShowHourPicker(!showHourPicker);
                  setShowDatePicker(false);
                }}
              >
                <Text style={localStyles.dateTimeText}>
                  {dueDate.toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <View style={localStyles.calendarPickerContainer}>
                <View style={localStyles.calendarPickerHeader}>
                  <TouchableOpacity 
                    onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}
                    style={localStyles.calendarPickerButton}
                  >
                    <ChevronLeft color={Colors.light.text} size={20} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text style={localStyles.calendarPickerMonth}>
                    {MONTHS[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}
                    style={localStyles.calendarPickerButton}
                  >
                    <ChevronRight color={Colors.light.text} size={20} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                <View style={localStyles.calendarPickerWeekDays}>
                  {DAYS.map((day) => (
                    <Text key={day} style={localStyles.calendarPickerWeekDay}>{day}</Text>
                  ))}
                </View>
                <View style={localStyles.calendarPickerGrid}>
                  {(() => {
                    const year = pickerMonth.getFullYear();
                    const month = pickerMonth.getMonth();
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
                  })().map((day, index) => {
                    const selectedDate = formatDateToLocal(dueDate);
                    return (
                      <TouchableOpacity
                        key={`${day.fullDate}-${index}`}
                        style={localStyles.calendarPickerDay}
                        onPress={() => {
                          if (day.isCurrentMonth) {
                            const [year, month, dayNum] = day.fullDate.split('-').map(Number);
                            const newDate = new Date(dueDate);
                            newDate.setFullYear(year, month - 1, dayNum);
                            setDueDate(newDate);
                            setShowDatePicker(false);
                          }
                        }}
                        disabled={!day.isCurrentMonth}
                      >
                        <View style={[
                          localStyles.calendarPickerDayCircle,
                          !day.isCurrentMonth && localStyles.calendarPickerDayInactive,
                          selectedDate === day.fullDate && localStyles.calendarPickerDaySelected,
                        ]}>
                          <Text style={[
                            localStyles.calendarPickerDayText,
                            !day.isCurrentMonth && localStyles.calendarPickerDayTextInactive,
                            selectedDate === day.fullDate && localStyles.calendarPickerDayTextSelected,
                          ]}>
                            {day.date}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {showHourPicker && (
              <View style={localStyles.timePickerContainer}>
                <View style={localStyles.timePickerContent}>
                  <View style={localStyles.timePickerColumn}>
                    <Text style={localStyles.timePickerColumnLabel}>Uur</Text>
                    <ScrollView 
                      style={localStyles.timePickerScroll}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = String(i).padStart(2, '0');
                        const isSelected = String(dueDate.getHours()).padStart(2, '0') === hour;
                        return (
                          <TouchableOpacity
                            key={hour}
                            style={[
                              localStyles.timePickerItem,
                              isSelected && localStyles.timePickerItemSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(dueDate);
                              newDate.setHours(parseInt(hour));
                              setDueDate(newDate);
                            }}
                          >
                            <Text style={[
                              localStyles.timePickerItemText,
                              isSelected && localStyles.timePickerItemTextSelected
                            ]}>
                              {hour}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                  <Text style={localStyles.timePickerColon}>:</Text>
                  <View style={localStyles.timePickerColumn}>
                    <Text style={localStyles.timePickerColumnLabel}>Min</Text>
                    <ScrollView 
                      style={localStyles.timePickerScroll}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const minute = String(i * 5).padStart(2, '0');
                        const isSelected = String(Math.floor(dueDate.getMinutes() / 5) * 5).padStart(2, '0') === minute;
                        return (
                          <TouchableOpacity
                            key={minute}
                            style={[
                              localStyles.timePickerItem,
                              isSelected && localStyles.timePickerItemSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(dueDate);
                              newDate.setMinutes(parseInt(minute));
                              setDueDate(newDate);
                            }}
                          >
                            <Text style={[
                              localStyles.timePickerItemText,
                              isSelected && localStyles.timePickerItemTextSelected
                            ]}>
                              {minute}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
                <TouchableOpacity
                  style={localStyles.timePickerDoneButton}
                  onPress={() => setShowHourPicker(false)}
                >
                  <Text style={localStyles.timePickerDoneButtonText}>Klaar</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={localStyles.label}>Media (Optioneel)</Text>
            <Pressable
              style={localStyles.uploadButton}
              onPress={pickAndUploadMedia}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={Colors.light.text} />
              ) : (
                <>
                  <Upload color={Colors.light.text} size={20} />
                  <Text style={localStyles.uploadButtonText}>
                    {mediaUri ? "Media Wijzigen" : "Media Uploaden"}
                  </Text>
                </>
              )}
            </Pressable>

            {mediaUri && (
              <View style={localStyles.uploadedMediaContainer}>
                <View style={localStyles.uploadedMediaInfo}>
                  {mediaType === 'video' && <Video color={Colors.light.primary} size={20} />}
                  {mediaType === 'image' && <ImageIcon color={Colors.light.primary} size={20} />}
                  {mediaType === 'audio' && <Music color={Colors.light.primary} size={20} />}
                  <Text style={localStyles.uploadedMediaText} numberOfLines={1}>
                    {mediaType === 'video' ? 'Video' : mediaType === 'image' ? 'Foto' : 'Audio'} bestand
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setMediaUri("");
                    setMediaType(undefined);
                  }}
                >
                  <X color={Colors.light.muted} size={20} />
                </Pressable>
              </View>
            )}

            <Pressable
              style={[localStyles.submitButton, { opacity: title ? 1 : 0.5 }]}
              disabled={!title}
              onPress={handleSubmit}
            >
              <Plus color={Colors.light.text} size={20} strokeWidth={2.5} />
              <Text style={localStyles.submitButtonText}>{editingAssignment ? "Opdracht Bijwerken" : "Opdracht Toevoegen"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AssignmentCard({ assignment, onPress, onLongPress, isSelected, selectionMode }: { assignment: Assignment; onPress: () => void; onLongPress: () => void; isSelected: boolean; selectionMode: boolean }) {
  const { users } = useAppState();

  const getMediaIcon = () => {
    if (!assignment.mediaType) return null;
    
    switch (assignment.mediaType) {
      case 'video':
        return <Video color={Colors.light.primary} size={20} />;
      case 'image':
        return <ImageIcon color={Colors.light.primary} size={20} />;
      case 'audio':
        return <Music color={Colors.light.primary} size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const assignedUsernames = assignment.assignedUserIds.length > 0
    ? users.filter(u => assignment.assignedUserIds.includes(u.id)).map(u => u.username).join(", ")
    : "Alle leden";

  return (
    <TouchableOpacity 
      style={[styles.assignmentCard, isSelected && styles.cardSelected]} 
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {selectionMode && (
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <CheckCircle2 color={Colors.light.primary} size={24} strokeWidth={2.5} />
          ) : (
            <View style={styles.checkboxEmpty} />
          )}
        </View>
      )}
      <View style={[styles.assignmentHeader, !selectionMode && styles.assignmentFullWidth]}>
        <Text style={styles.assignmentTitle}>{assignment.title}</Text>
        {assignment.mediaType && (
          <View style={styles.mediaIconContainer}>
            {getMediaIcon()}
          </View>
        )}
      </View>
      
      {assignment.description && (
        <Text style={styles.assignmentDescription}>{assignment.description}</Text>
      )}
      
      <View style={styles.assignmentFooter}>
        <View style={styles.assignmentInfo}>
          <Calendar color={Colors.light.muted} size={16} />
          <Text style={styles.assignmentInfoText}>
            {assignment.dueDate ? formatDate(assignment.dueDate) : "Geen deadline"}
          </Text>
        </View>
        
        <View style={styles.assignmentInfo}>
          <Users color={Colors.light.muted} size={16} />
          <Text style={styles.assignmentInfoText} numberOfLines={1}>
            {assignedUsernames}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HuiswerkScreen() {
  const insets = useSafeAreaInsets();
  const { assignments, currentUser, deleteAssignments } = useAppState();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | undefined>(undefined);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

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
        <View style={styles.header}>
          <Text style={styles.title}>Huiswerk</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {assignments.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText color={Colors.light.muted} size={48} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Nog geen huiswerk opdrachten</Text>
            </View>
          ) : (
            assignments.map(assignment => {
              const isSelected = selectedIds.has(assignment.id);
              return (
                <AssignmentCard 
                  key={assignment.id} 
                  assignment={assignment}
                  isSelected={isSelected}
                  selectionMode={selectionMode}
                  onPress={() => {
                    if (selectionMode) {
                      setSelectedIds((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(assignment.id)) {
                          newSet.delete(assignment.id);
                        } else {
                          newSet.add(assignment.id);
                        }
                        return newSet;
                      });
                    } else {
                      setEditingAssignment(assignment);
                      setShowAddModal(true);
                    }
                  }}
                  onLongPress={() => {
                    if (!selectionMode && currentUser?.role === "admin") {
                      setSelectionMode(true);
                      setSelectedIds(new Set([assignment.id]));
                    }
                  }}
                />
              );
            })
          )}
        </ScrollView>
      </View>

      {currentUser?.role === "admin" && (
        <>
          {selectionMode ? (
            <View style={[styles.selectionBar, { bottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => {
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                }}
              >
                <Text style={styles.selectionButtonText}>Annuleren</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteButton, selectedIds.size === 0 && styles.disabledDeleteButton]}
                onPress={() => {
                  if (selectedIds.size === 0) return;
                  setShowDeleteConfirm(true);
                }}
                disabled={selectedIds.size === 0}
              >
                <Trash2 color={selectedIds.size > 0 ? Colors.light.text : Colors.light.muted} size={20} strokeWidth={2.5} />
                <Text style={[styles.deleteButtonText, selectedIds.size === 0 && styles.disabledDeleteText]}>
                  Verwijderen ({selectedIds.size})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Pressable 
              style={[styles.fab, { bottom: insets.bottom + 20 }]} 
              onPress={() => {
                setEditingAssignment(undefined);
                setShowAddModal(true);
              }}
            >
              <LinearGradient
                colors={[Colors.light.primary, '#B91C1C']}
                style={styles.fabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Plus color={Colors.light.text} size={28} strokeWidth={3} />
              </LinearGradient>
            </Pressable>
          )}

          <AddAssignmentModal
            visible={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setEditingAssignment(undefined);
            }}
            editingAssignment={editingAssignment}
          />

          <Modal
            visible={showDeleteConfirm}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDeleteConfirm(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContentSmall}>
                <View style={styles.modalHeaderSmall}>
                  <Text style={styles.modalTitleSmall}>Bevestigen</Text>
                </View>
                
                <Text style={styles.confirmText}>
                  Weet je het zeker om {selectedIds.size} {selectedIds.size === 1 ? 'opdracht' : 'opdrachten'} te verwijderen?
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => setShowDeleteConfirm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Annuleren</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.actionButton]}
                    onPress={() => {
                      deleteAssignments(Array.from(selectedIds));
                      setSelectionMode(false);
                      setSelectedIds(new Set());
                      setShowDeleteConfirm(false);
                    }}
                  >
                    <LinearGradient
                      colors={['#DC2626', '#991B1B']}
                      style={styles.createButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.createButtonText}>Verwijderen</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          <MenuModal 
            visible={showMenuModal} 
            onClose={() => setShowMenuModal(false)}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.muted,
  },
  assignmentCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    gap: 12,
    flexDirection: 'row',
  },
  assignmentHeader: {
    flex: 1,
    gap: 12,
  },
  assignmentFullWidth: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mediaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  assignmentDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  assignmentFooter: {
    gap: 8,
    paddingTop: 4,
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignmentInfoText: {
    fontSize: 13,
    color: Colors.light.muted,
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cardSelected: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.3,
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.muted,
  },
  selectionBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  selectionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  selectionButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  disabledDeleteButton: {
    backgroundColor: Colors.light.darkGray,
  },
  deleteButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  disabledDeleteText: {
    color: Colors.light.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentSmall: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  modalHeaderSmall: {
    marginBottom: 16,
  },
  modalTitleSmall: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '800' as const,
  },
  confirmText: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: Colors.light.darkGray,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  createButtonGradient: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.light.text,
    fontSize: 32,
    fontWeight: '800' as const,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.light.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  membersSection: {
    gap: 12,
  },
  membersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  memberChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  memberChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  memberChipTextSelected: {
    color: Colors.light.text,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  uploadedMediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  uploadedMediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  uploadedMediaText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitButtonText: {
    color: Colors.light.text,
    fontWeight: '700' as const,
    fontSize: 16,
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
  timePickerContainer: {
    marginTop: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    padding: 12,
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerColumnLabel: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: '700' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timePickerScroll: {
    maxHeight: 180,
    width: '100%',
  },
  timePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  timePickerItemSelected: {
    backgroundColor: Colors.light.primary,
  },
  timePickerItemText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  timePickerItemTextSelected: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
  timePickerColon: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 32,
  },
  timePickerDoneButton: {
    marginTop: 12,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerDoneButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
});
