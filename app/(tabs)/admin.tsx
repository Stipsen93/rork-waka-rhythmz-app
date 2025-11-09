import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View, Pressable, Platform, Modal, ActivityIndicator } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import Colors from "@/constants/colors";
import { Role, useAppState } from "@/providers/AppState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserPlus, Shield, User, RotateCcw, Upload, HardDrive, X, Copy } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";


export default function AdminScreen() {
  const { users, addUser, setRole, resetPassword, currentUser } = useAppState();
  const [username, setUsername] = useState<string>("");
  const [role, setRoleLocal] = useState<Role>("member");
  const insets = useSafeAreaInsets();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const appState = useAppState();

  const handleCopyPassword = async (password: string, userName: string) => {
    await Clipboard.setStringAsync(password);
    Alert.alert("Gekopieerd", `Wachtwoord voor ${userName} is gekopieerd naar klembord`);
  };

  const handleResetPassword = (userId: string, userName: string) => {
    Alert.alert(
      "Wachtwoord Resetten",
      `Weet je zeker dat je het wachtwoord voor ${userName} wilt resetten?`,
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Resetten",
          style: "destructive",
          onPress: async () => {
            const newPassword = await resetPassword(userId);
            Alert.alert(
              "Wachtwoord Gereset",
              `Nieuw wachtwoord voor ${userName}:\n${newPassword}\n\nBewaar dit wachtwoord!`
            );
          },
        },
      ]
    );
  };

  const handleUploadMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Toestemming Vereist', 'We hebben toegang nodig tot je mediabibliotheek om bestanden te uploaden.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log('[Admin] Selected media:', {
        uri: asset.uri,
        type: asset.type,
        fileName: asset.fileName,
      });

      setIsUploading(true);
      setShowUploadModal(false);

      try {
        const base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });

        const fileName = asset.fileName || `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`;
        const fileSize = asset.fileSize || 0;
        const mimeType = asset.type === 'video' 
          ? 'video/mp4' 
          : asset.mimeType || 'image/jpeg';

        await appState.uploadMedia({
          name: fileName,
          folderPath: folderPath.trim(),
          fileType: asset.type || 'image',
          fileSize,
          mimeType,
          base64Data,
        });

        await appState.refreshStorageUsage();

        setFolderPath("");
        Alert.alert('Succes', 'Media succesvol geüpload!');
      } catch (error) {
        console.error('[Admin] Error uploading media:', error);
        Alert.alert('Fout', 'Er is een fout opgetreden bij het uploaden van media.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const renderHeader = () => (
    <>
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.25, 1]}
      />
      
      <View style={styles.header}>
        <Text style={styles.appName}>WAKA RHYTHMZ</Text>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.subtitle}>Beheer gebruikers & media</Text>
      </View>

      <View style={styles.scrollContent}>
        {isAdmin && appState.storageUsage && (
          <View style={styles.storageSection}>
            <View style={styles.sectionHeader}>
              <HardDrive color={Colors.light.primary} size={22} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Opslag Beheer</Text>
            </View>

            <View style={styles.storageCard}>
              <View style={styles.storageMeter}>
                <View style={styles.storageBar}>
                  <LinearGradient
                    colors={
                      (appState.storageUsage.percentage || 0) > 90
                        ? ['#DC2626', '#991B1B']
                        : (appState.storageUsage.percentage || 0) > 75
                        ? ['#F59E0B', '#D97706']
                        : [Colors.light.primary, Colors.light.primaryDark]
                    }
                    style={[styles.storageBarFill, { width: `${Math.min(appState.storageUsage.percentage || 0, 100)}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.storageText}>
                  {(appState.storageUsage.usageGB || 0).toFixed(2)} GB / {appState.storageUsage.maxGB || 0} GB ({appState.storageUsage.percentage || 0}%)
                </Text>
                {(appState.storageUsage.percentage || 0) > 90 && (
                  <Text style={styles.warningText}>
                    ⚠️ Opslag bijna vol! Verwijder ongebruikte media.
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              style={styles.uploadButton}
              onPress={() => setShowUploadModal(true)}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={Colors.light.text} />
              ) : (
                <>
                  <Upload color={Colors.light.text} size={20} strokeWidth={2.5} />
                  <Text style={styles.uploadButtonText}>Media Uploaden</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

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
            onPress={async () => {
              const { user, password } = await addUser(username.trim(), role);
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
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="admin-screen">
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
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
                <Text style={styles.userPassword}>
                  {item.passwordChangedByUser ? "••••••••" : item.password}
                </Text>
              </View>
            </View>
            
            <View style={styles.userActions}>
              <View style={styles.iconButtons}>
                {!item.passwordChangedByUser && (
                  <Pressable
                    style={styles.iconButton}
                    onPress={() => handleCopyPassword(item.password, item.username)}
                    testID={`copy-password-${item.id}`}
                  >
                    <Copy color={Colors.light.primary} size={16} strokeWidth={2.5} />
                  </Pressable>
                )}
                <Pressable
                  style={styles.iconButton}
                  onPress={() => handleResetPassword(item.id, item.username)}
                  testID={`reset-password-${item.id}`}
                >
                  <RotateCcw color={Colors.light.primary} size={16} strokeWidth={2.5} />
                </Pressable>
              </View>
              <View style={styles.roleButtonsWrapper}>
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
          </View>
        )}
      />

      <Modal
        visible={showUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Media Uploaden</Text>
              <Pressable onPress={() => setShowUploadModal(false)}>
                <X color={Colors.light.muted} size={24} />
              </Pressable>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Map (optioneel)</Text>
              <TextInput
                style={styles.input}
                value={folderPath}
                onChangeText={setFolderPath}
                placeholder="bijv. trainings/2025"
                placeholderTextColor={Colors.light.muted}
              />
              <Text style={styles.inputHint}>
                Laat leeg voor de hoofdmap. Gebruik / voor submappen.
              </Text>
            </View>

            <Pressable
              style={styles.selectMediaButton}
              onPress={handleUploadMedia}
            >
              <LinearGradient
                colors={[Colors.light.primary, Colors.light.primaryDark]}
                style={styles.selectMediaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Upload color={Colors.light.text} size={20} strokeWidth={2.5} />
                <Text style={styles.selectMediaButtonText}>Selecteer Bestand</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  storageSection: {
    marginBottom: 24,
  },
  storageCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    marginBottom: 12,
  },
  storageMeter: {
    gap: 8,
  },
  storageBar: {
    height: 8,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  storageText: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  warningText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  uploadButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  uploadButtonText: {
    color: Colors.light.text,
    fontWeight: "700" as const,
    fontSize: 16,
  },
  createSection: {
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
  },
  usersSection: {
    marginBottom: 16,
  },
  usersSectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 16,
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
    marginHorizontal: 20,
    marginBottom: 12,
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
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  iconButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.light.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  roleButtonsWrapper: {
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
  userPassword: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '800' as const,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 10,
  },
  inputHint: {
    color: Colors.light.muted,
    fontSize: 12,
    marginTop: 8,
  },
  selectMediaButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  selectMediaGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  selectMediaButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
