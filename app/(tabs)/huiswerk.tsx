import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, Platform } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAppState, Assignment } from "@/providers/AppState";
import { useState } from "react";
import { Plus, X, Calendar, Users, Video, Image as ImageIcon, Music, FileText } from "lucide-react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

function AddAssignmentModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { addAssignment, users } = useAppState();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mediaUri, setMediaUri] = useState<string>("");
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'audio' | undefined>(undefined);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedUserIds([]);
    setDueDate(new Date());
    setMediaUri("");
    setMediaType(undefined);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Fout", "Voer een titel in voor de opdracht");
      return;
    }

    addAssignment({
      title: title.trim(),
      description: description.trim(),
      assignedUserIds: selectedUserIds,
      dueDate: dueDate.toISOString(),
      mediaUri: mediaUri.trim() || undefined,
      mediaType,
    });

    Alert.alert("Succes", "Huiswerk opdracht is toegevoegd!");
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
            <Text style={localStyles.modalTitle}>Nieuwe Opdracht</Text>
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
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar color={Colors.light.primary} size={20} />
                <Text style={localStyles.dateTimeText}>
                  {dueDate.toLocaleDateString("nl-NL")}
                </Text>
              </Pressable>
              <Pressable
                style={localStyles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={localStyles.dateTimeText}>
                  {dueDate.toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={dueDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
              />
            )}

            <Text style={localStyles.label}>Media Type (Optioneel)</Text>
            <View style={localStyles.mediaTypeContainer}>
              <Pressable
                style={[localStyles.mediaTypeButton, mediaType === 'video' && localStyles.mediaTypeButtonSelected]}
                onPress={() => setMediaType(mediaType === 'video' ? undefined : 'video')}
              >
                <Video color={mediaType === 'video' ? Colors.light.text : Colors.light.muted} size={20} />
                <Text style={[localStyles.mediaTypeText, mediaType === 'video' && localStyles.mediaTypeTextSelected]}>
                  Video
                </Text>
              </Pressable>
              <Pressable
                style={[localStyles.mediaTypeButton, mediaType === 'image' && localStyles.mediaTypeButtonSelected]}
                onPress={() => setMediaType(mediaType === 'image' ? undefined : 'image')}
              >
                <ImageIcon color={mediaType === 'image' ? Colors.light.text : Colors.light.muted} size={20} />
                <Text style={[localStyles.mediaTypeText, mediaType === 'image' && localStyles.mediaTypeTextSelected]}>
                  Foto
                </Text>
              </Pressable>
              <Pressable
                style={[localStyles.mediaTypeButton, mediaType === 'audio' && localStyles.mediaTypeButtonSelected]}
                onPress={() => setMediaType(mediaType === 'audio' ? undefined : 'audio')}
              >
                <Music color={mediaType === 'audio' ? Colors.light.text : Colors.light.muted} size={20} />
                <Text style={[localStyles.mediaTypeText, mediaType === 'audio' && localStyles.mediaTypeTextSelected]}>
                  Audio
                </Text>
              </Pressable>
            </View>

            {mediaType && (
              <>
                <Text style={localStyles.label}>Media URL</Text>
                <TextInput
                  style={localStyles.input}
                  placeholder="Bijv. https://example.com/media.mp4"
                  placeholderTextColor={Colors.light.muted}
                  value={mediaUri}
                  onChangeText={setMediaUri}
                />
              </>
            )}

            <Pressable
              style={[localStyles.submitButton, { opacity: title ? 1 : 0.5 }]}
              disabled={!title}
              onPress={handleSubmit}
            >
              <Plus color={Colors.light.text} size={20} strokeWidth={2.5} />
              <Text style={localStyles.submitButtonText}>Opdracht Toevoegen</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
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
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
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
    </View>
  );
}

export default function HuiswerkScreen() {
  const insets = useSafeAreaInsets();
  const { assignments, currentUser } = useAppState();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
            assignments.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </ScrollView>
      </View>

      {currentUser?.role === "admin" && (
        <>
          <Pressable 
            style={[styles.fab, { bottom: insets.bottom + 20 }]} 
            onPress={() => setShowAddModal(true)}
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

          <AddAssignmentModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
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
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
  },
  mediaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
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
  mediaTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.surface,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  mediaTypeButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  mediaTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  mediaTypeTextSelected: {
    color: Colors.light.text,
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
});
