import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useState } from "react";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { useAppState } from "@/providers/AppState";
import { Plus, X, Trash2, Calendar, Edit2 } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Announcement } from "@/providers/AppState";

export default function NieuwsScreen() {
  const insets = useSafeAreaInsets();
  const [showMenuModal, setShowMenuModal] = useState(false);
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncements, currentUser } = useAppState();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const handleAddAnnouncement = () => {
    if (!name.trim()) {
      Alert.alert("Fout", "Naam is verplicht");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Fout", "Omschrijving is verplicht");
      return;
    }
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    addAnnouncement({ 
      name: name.trim(), 
      description: description.trim(),
      date: dateStr
    });
    setName("");
    setDescription("");
    setSelectedDate(new Date());
    setShowAddModal(false);
  };



  const handleOpenEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setName(announcement.name);
    setDescription(announcement.description);
    setSelectedDate(new Date(announcement.date));
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingAnnouncement(null);
    setName("");
    setDescription("");
    setSelectedDate(new Date());
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
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    updateAnnouncement(editingAnnouncement.id, {
      name: name.trim(),
      description: description.trim(),
      date: dateStr
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

          {announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Geen mededelingen</Text>
              {isAdmin && (
                <Text style={styles.emptySubtext}>Maak je eerste mededeling aan</Text>
              )}
            </View>
          ) : (
            <View style={styles.announcementsList}>
              {announcements.map((announcement) => (
                <TouchableOpacity 
                  key={announcement.id} 
                  style={styles.announcementCard}
                  onPress={() => isAdmin ? handleOpenEditModal(announcement) : null}
                  activeOpacity={isAdmin ? 0.7 : 1}
                >
                  <View style={styles.announcementHeader}>
                    <Text style={styles.announcementName}>{announcement.name}</Text>
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
              {Platform.OS === 'web' ? (
                <TextInput
                  style={styles.input}
                  value={selectedDate.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    const date = new Date(text);
                    if (!isNaN(date.getTime())) {
                      setSelectedDate(date);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.light.muted}
                />
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar color={Colors.light.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.datePickerButtonText}>
                      {selectedDate.toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) {
                          setSelectedDate(date);
                        }
                      }}
                    />
                  )}
                </>
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
              {Platform.OS === 'web' ? (
                <TextInput
                  style={styles.input}
                  value={selectedDate.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    const date = new Date(text);
                    if (!isNaN(date.getTime())) {
                      setSelectedDate(date);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.light.muted}
                />
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowEditDatePicker(true)}
                  >
                    <Calendar color={Colors.light.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.datePickerButtonText}>
                      {selectedDate.toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showEditDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        setShowEditDatePicker(false);
                        if (date) {
                          setSelectedDate(date);
                        }
                      }}
                    />
                  )}
                </>
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
        onAdminPress={() => {}}
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
  announcementName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
    marginRight: 12,
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
});
