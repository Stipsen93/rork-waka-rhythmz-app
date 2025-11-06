import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useState } from "react";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { useAppState } from "@/providers/AppState";
import { Plus, X, Trash2, Calendar } from "lucide-react-native";

export default function NieuwsScreen() {
  const insets = useSafeAreaInsets();
  const [showMenuModal, setShowMenuModal] = useState(false);
  const { announcements, addAnnouncement, deleteAnnouncements, currentUser } = useAppState();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

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
    addAnnouncement({ name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
    setShowAddModal(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    Alert.alert(
      "Mededeling verwijderen",
      "Weet je zeker dat je deze mededeling wilt verwijderen?",
      [
        { text: "Annuleer", style: "cancel" },
        { text: "Verwijder", style: "destructive", onPress: () => deleteAnnouncements([id]) },
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
                <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <Text style={styles.announcementName}>{announcement.name}</Text>
                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() => handleDeleteAnnouncement(announcement.id)}
                        style={styles.deleteButton}
                      >
                        <Trash2 color={Colors.light.error} size={20} strokeWidth={2.5} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.announcementDescription}>{announcement.description}</Text>
                  <View style={styles.announcementFooter}>
                    <Calendar color={Colors.light.muted} size={14} strokeWidth={2} />
                    <Text style={styles.announcementDate}>
                      {new Date(announcement.createdAt).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
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
});
