import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View, Pressable, Platform } from "react-native";
import * as Clipboard from 'expo-clipboard';
import Colors from "@/constants/colors";
import { Group, Role, useAppState } from "@/providers/AppState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserPlus, Shield, User, RotateCcw, Copy } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";


export default function AdminScreen() {
  const { users, addUser, setRole, resetPassword, currentUser, groups, addGroup, updateGroup, deleteGroups } = useAppState();
  const [username, setUsername] = useState<string>("");
  const [role, setRoleLocal] = useState<Role>("member");
  const [groupName, setGroupName] = useState<string>("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const insets = useSafeAreaInsets();

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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListFooterComponent={() => (
          <View style={styles.scrollContent}>
            <View style={styles.groupsSection}>
              <View style={styles.sectionHeader}>
                <UserPlus color={Colors.light.primary} size={22} strokeWidth={2.5} />
                <Text style={styles.sectionTitle}>
                  {editingGroup ? 'Groep Bewerken' : 'Nieuwe Groep Aanmaken'}
                </Text>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Voer groepnaam in"
                placeholderTextColor={Colors.light.muted}
                value={groupName}
                onChangeText={setGroupName}
                testID="group-name"
              />
              
              <View style={styles.memberSelector}>
                <Text style={styles.roleLabel}>Leden selecteren:</Text>
                <View style={styles.membersList}>
                  {users.filter(u => u.role === 'member').map(user => (
                    <Pressable
                      key={user.id}
                      style={[styles.memberChip, selectedMemberIds.includes(user.id) && styles.memberChipSelected]}
                      onPress={() => {
                        setSelectedMemberIds(prev =>
                          prev.includes(user.id)
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                      testID={`select-member-${user.id}`}
                    >
                      <User
                        color={selectedMemberIds.includes(user.id) ? Colors.light.text : Colors.light.muted}
                        size={14}
                        strokeWidth={2}
                      />
                      <Text
                        style={[
                          styles.memberChipText,
                          selectedMemberIds.includes(user.id) && styles.memberChipTextSelected,
                        ]}
                      >
                        {user.username}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.groupButtonsRow}>
                <Pressable
                  style={[styles.createButton, { opacity: groupName ? 1 : 0.5, flex: editingGroup ? 1 : 0 }]}
                  disabled={!groupName}
                  onPress={async () => {
                    if (editingGroup) {
                      await updateGroup(editingGroup.id, groupName.trim(), selectedMemberIds);
                      Alert.alert('Groep Bijgewerkt', `Groep "${groupName}" is succesvol bijgewerkt.`);
                    } else {
                      await addGroup(groupName.trim(), selectedMemberIds);
                      Alert.alert('Groep Aangemaakt', `Groep "${groupName}" is aangemaakt met ${selectedMemberIds.length} lid(en).`);
                    }
                    setGroupName('');
                    setSelectedMemberIds([]);
                    setEditingGroup(null);
                  }}
                  testID="create-group"
                >
                  <UserPlus color={Colors.light.text} size={20} strokeWidth={2.5} />
                  <Text style={styles.createButtonText}>
                    {editingGroup ? 'Groep Bijwerken' : 'Groep Aanmaken'}
                  </Text>
                </Pressable>
                {editingGroup && (
                  <Pressable
                    style={[styles.createButton, { flex: 1, backgroundColor: Colors.light.muted, marginLeft: 10 }]}
                    onPress={() => {
                      setGroupName('');
                      setSelectedMemberIds([]);
                      setEditingGroup(null);
                    }}
                    testID="cancel-edit-group"
                  >
                    <Text style={styles.createButtonText}>Annuleren</Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.groupsListSection}>
              <Text style={styles.usersSectionTitle}>
                Alle Groepen ({groups.length})
              </Text>
              {groups.map(group => (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupCardLeft}>
                    <View style={styles.groupAvatar}>
                      <UserPlus color={Colors.light.primary} size={20} strokeWidth={2.5} />
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupMembers}>
                        {group.memberIds.length} lid(en)
                      </Text>
                      <Text style={styles.groupMemberNames}>
                        {group.memberIds.map(id => users.find(u => u.id === id)?.username).filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.groupActions}>
                    <Pressable
                      style={styles.iconButton}
                      onPress={() => {
                        setGroupName(group.name);
                        setSelectedMemberIds(group.memberIds);
                        setEditingGroup(group);
                      }}
                      testID={`edit-group-${group.id}`}
                    >
                      <User color={Colors.light.primary} size={16} strokeWidth={2.5} />
                    </Pressable>
                    <Pressable
                      style={styles.iconButton}
                      onPress={() => {
                        Alert.alert(
                          'Groep Verwijderen',
                          `Weet je zeker dat je de groep "${group.name}" wilt verwijderen?`,
                          [
                            { text: 'Annuleren', style: 'cancel' },
                            {
                              text: 'Verwijderen',
                              style: 'destructive',
                              onPress: async () => {
                                await deleteGroups([group.id]);
                                if (editingGroup?.id === group.id) {
                                  setEditingGroup(null);
                                  setGroupName('');
                                  setSelectedMemberIds([]);
                                }
                              },
                            },
                          ]
                        );
                      }}
                      testID={`delete-group-${group.id}`}
                    >
                      <RotateCcw color={Colors.light.primary} size={16} strokeWidth={2.5} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
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
  groupsSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    marginBottom: 24,
  },
  memberSelector: {
    marginBottom: 16,
  },
  membersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.darkGray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  memberChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  memberChipText: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  memberChipTextSelected: {
    color: Colors.light.text,
  },
  groupButtonsRow: {
    flexDirection: "row",
  },
  groupsListSection: {
    marginBottom: 20,
  },
  groupCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  groupCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Colors.light.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  groupMembers: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  groupMemberNames: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: "500" as const,
    marginTop: 2,
  },
  groupActions: {
    flexDirection: "row",
    gap: 8,
  },
});
