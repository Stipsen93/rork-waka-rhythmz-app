import React, { useState, useCallback, memo } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View, Pressable, Platform } from "react-native";
import * as Clipboard from 'expo-clipboard';
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { Group, Role, useAppState } from "@/providers/AppState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserPlus, Shield, User, RotateCcw, Copy, Trash2, X, CheckCircle, XCircle, Crown } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { translations } from "@/constants/translations";


const CreateUserSection = memo(({ onUserCreated, language }: { onUserCreated: () => void; language: 'nl' | 'en' }) => {
  const { addUser } = useAppState();
  const t = translations[language];
  const [username, setUsername] = useState<string>("");
  const [role, setRoleLocal] = useState<Role>("member");

  const handleCreateUser = useCallback(async () => {
    const { user, password } = await addUser(username.trim(), role);
    Alert.alert(
      t.admin.accountCreated,
      `${t.admin.username}: ${user.username}\n${t.admin.password}: ${password}\n\n${t.admin.savePassword}`
    );
    setUsername("");
    onUserCreated();
  }, [username, role, addUser, onUserCreated, t]);

  return (
    <View style={styles.createSection}>
      <View style={styles.sectionHeader}>
        <UserPlus color={Colors.light.primary} size={22} strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>{t.admin.createNewUser}</Text>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder={t.admin.enterUsername}
        placeholderTextColor={Colors.light.muted}
        value={username}
        onChangeText={setUsername}
        testID="new-username"
        autoCorrect={false}
        autoCapitalize="none"
      />
      
      <View style={styles.roleSelector}>
        <Text style={styles.roleLabel}>{t.memberProfile.role}:</Text>
        <View style={styles.roleButtons}>
          <Pressable 
            style={[styles.roleButton, role === "member" && styles.roleButtonActive]} 
            onPress={() => setRoleLocal("member")}
          >
            <User color={role === "member" ? Colors.light.text : Colors.light.muted} size={16} strokeWidth={2} />
            <Text style={[styles.roleButtonText, role === "member" && styles.roleButtonTextActive]}>
              {t.admin.member}
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.roleButton, role === "admin" && styles.roleButtonActive]} 
            onPress={() => setRoleLocal("admin")}
          >
            <Shield color={role === "admin" ? Colors.light.text : Colors.light.muted} size={16} strokeWidth={2} />
            <Text style={[styles.roleButtonText, role === "admin" && styles.roleButtonTextActive]}>
              {t.admin.admin}
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[styles.createButton, { opacity: username ? 1 : 0.5 }]} 
        disabled={!username}
        onPress={handleCreateUser}
        testID="create-user"
      >
        <UserPlus color={Colors.light.text} size={20} strokeWidth={2.5} />
        <Text style={styles.createButtonText}>{t.admin.createAccount}</Text>
      </Pressable>
    </View>
  );
});

CreateUserSection.displayName = 'CreateUserSection';

const CreateGroupSection = memo(({ language }: { language: 'nl' | 'en' }) => {
  const { users, groups, addGroup, updateGroup, deleteGroups } = useAppState();
  const t = translations[language];
  const [groupName, setGroupName] = useState<string>("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const handleCreateOrUpdateGroup = useCallback(async () => {
    if (editingGroup) {
      await updateGroup(editingGroup.id, groupName.trim(), selectedMemberIds);
      Alert.alert(
        t.admin.groupUpdated,
        `${t.admin.groupUpdated}: "${groupName}"`
      );
    } else {
      await addGroup(groupName.trim(), selectedMemberIds);
      Alert.alert(
        t.admin.groupCreated,
        `"${groupName}" - ${selectedMemberIds.length} ${t.admin.members}`
      );
    }
    setGroupName('');
    setSelectedMemberIds([]);
    setEditingGroup(null);
  }, [editingGroup, groupName, selectedMemberIds, addGroup, updateGroup, t]);

  const handleEditGroup = useCallback((group: Group) => {
    setGroupName(group.name);
    setSelectedMemberIds(group.memberIds);
    setEditingGroup(group);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setGroupName('');
    setSelectedMemberIds([]);
    setEditingGroup(null);
  }, []);

  const handleDeleteEditingGroup = useCallback(async () => {
    if (!editingGroup) return;
    Alert.alert(
      t.admin.deleteGroup,
      `${t.admin.confirmDeleteGroup} "${editingGroup.name}"?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteGroups([editingGroup.id]);
            setEditingGroup(null);
            setGroupName('');
            setSelectedMemberIds([]);
          },
        },
      ]
    );
  }, [editingGroup, deleteGroups, t]);

  const handleDeleteGroup = useCallback(async (group: Group) => {
    Alert.alert(
      t.admin.deleteGroup,
      `${t.admin.confirmDeleteGroup} "${group.name}"?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
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
  }, [deleteGroups, editingGroup, t]);

  const toggleMemberSelection = useCallback((userId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  return (
    <View style={styles.scrollContent}>
      <View style={styles.groupsSection}>
        <View style={styles.sectionHeader}>
          <UserPlus color={Colors.light.primary} size={22} strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>
            {editingGroup ? t.admin.editGroup : t.admin.createNewGroup}
          </Text>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder={t.admin.enterGroupName}
          placeholderTextColor={Colors.light.muted}
          value={groupName}
          onChangeText={setGroupName}
          testID="group-name"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
        />
        
        <View style={styles.memberSelector}>
          <Text style={styles.roleLabel}>{t.admin.selectMembers}:</Text>
          <View style={styles.membersList}>
            {users.map(user => (
              <Pressable
                key={user.id}
                style={[styles.memberChip, selectedMemberIds.includes(user.id) && styles.memberChipSelected]}
                onPress={() => toggleMemberSelection(user.id)}
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

        <Pressable
          style={[styles.createButton, { opacity: groupName ? 1 : 0.5 }]}
          disabled={!groupName}
          onPress={handleCreateOrUpdateGroup}
          testID="create-group"
        >
          <UserPlus color={Colors.light.text} size={20} strokeWidth={2.5} />
          <Text style={styles.createButtonText}>
            {editingGroup ? t.admin.updateGroup : t.admin.createGroup}
          </Text>
        </Pressable>

        {editingGroup && (
          <View style={styles.groupButtonsRow}>
            <Pressable
              style={[styles.deleteButton]}
              onPress={handleDeleteEditingGroup}
              testID="delete-editing-group"
            >
              <Text style={styles.deleteButtonText}>{t.admin.deleteGroup}</Text>
            </Pressable>
            <Pressable
              style={[styles.cancelButton]}
              onPress={handleCancelEdit}
              testID="cancel-edit-group"
            >
              <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.groupsListSection}>
        <Text style={styles.usersSectionTitle}>
          {t.admin.allGroups} ({groups.length})
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
                  {group.memberIds.length} {t.admin.members}
                </Text>
                <Text style={styles.groupMemberNames}>
                  {group.memberIds.map(id => users.find(u => u.id === id)?.username).filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
            
            <View style={styles.groupActions}>
              <Pressable
                style={styles.iconButton}
                onPress={() => handleEditGroup(group)}
                testID={`edit-group-${group.id}`}
              >
                <User color={Colors.light.primary} size={16} strokeWidth={2.5} />
              </Pressable>
              <Pressable
                style={styles.iconButton}
                onPress={() => handleDeleteGroup(group)}
                testID={`delete-group-${group.id}`}
              >
                <RotateCcw color={Colors.light.primary} size={16} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
});

CreateGroupSection.displayName = 'CreateGroupSection';

export default function AdminScreen() {
  const { users, currentUser, setRole, resetPassword, deleteUsers, reactivateAccount, permanentDeleteAccount, language } = useAppState();
  const t = translations[language];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleUserCreated = useCallback(() => {
  }, []);

  const handleCopyPassword = async (password: string, userName: string) => {
    await Clipboard.setStringAsync(password);
    Alert.alert(
      t.admin.copied,
      `${t.admin.copiedPassword} ${userName} ${t.admin.copiedToClipboard}`
    );
  };

  const handleResetPassword = (userId: string, userName: string) => {
    Alert.alert(
      t.admin.resetPassword,
      `${t.admin.confirmResetPassword} ${userName}?`,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.admin.reset,
          onPress: async () => {
            const newPassword = await resetPassword(userId);
            Alert.alert(
              t.admin.passwordReset,
              `${t.admin.newPasswordFor} ${userName}:\n\n${newPassword}\n\n${t.admin.savePassword}`,
              [
                {
                  text: t.admin.copyPassword || 'Kopieer wachtwoord',
                  onPress: () => handleCopyPassword(newPassword, userName)
                },
                {
                  text: 'OK',
                  style: 'default'
                }
              ]
            );
          },
        },
      ]
    );
  };

  const handleLongPress = useCallback((userId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedUserIds([userId]);
    }
  }, [selectionMode]);

  const handlePressIn = useCallback((userId: string) => {
    if (!selectionMode) {
      const timer = setTimeout(() => {
        handleLongPress(userId);
      }, 500);
      setLongPressTimer(timer);
    }
  }, [selectionMode, handleLongPress]);

  const handlePressOut = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const toggleUserSelection = useCallback((userId: string) => {
    if (selectionMode) {
      setSelectedUserIds(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  }, [selectionMode]);

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedUserIds([]);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    const userNames = users.filter(u => selectedUserIds.includes(u.id)).map(u => u.username).join(', ');
    Alert.alert(
      t.admin.deleteMembers,
      `${t.admin.confirmDeleteMembers} ${selectedUserIds.length} ${selectedUserIds.length === 1 ? t.admin.member.toLowerCase() : t.admin.members}?\n\n${userNames}`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteUsers(selectedUserIds);
            setSelectionMode(false);
            setSelectedUserIds([]);
          },
        },
      ]
    );
  }, [selectedUserIds, users, deleteUsers, t]);

  const handleReactivateAccount = (userId: string, userName: string) => {
    Alert.alert(
      t.admin.reactivateAccount,
      `${t.admin.confirmReactivateAccount} ${userName} ${t.admin.withNewPassword}`,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.admin.reactivate,
          onPress: async () => {
            const newPassword = Math.random().toString(36).slice(2, 8) + Math.floor(100 + Math.random() * 900).toString();
            await reactivateAccount(userId, newPassword);
            Alert.alert(
              t.admin.accountReactivated,
              `${t.admin.accountReactivatedFor} ${userName} ${t.admin.hasBeenReactivated}\n${t.admin.newPassword} ${newPassword}\n\n${t.admin.savePassword}`
            );
          },
        },
      ]
    );
  };

  const handlePermanentDelete = (userId: string, userName: string) => {
    Alert.alert(
      t.admin.permanentlyDeleteAccount,
      `${t.admin.confirmPermanentDelete} ${userName}? ${t.admin.cannotBeUndone}`,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.admin.permanentlyDelete,
          style: "destructive",
          onPress: async () => {
            await permanentDeleteAccount(userId);
            Alert.alert(
              t.admin.deleted,
              `${t.admin.accountDeleted} ${userName} ${t.admin.hasBeenDeleted}`
            );
          },
        },
      ]
    );
  };

  const renderHeader = useCallback(() => (
    <>
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.25, 1]}
      />
      
      <View style={styles.header}>
        <Text style={styles.appName}>WAKA RHYTHMZ</Text>
        <Text style={styles.title}>{t.admin.title}</Text>
        <Text style={styles.subtitle}>{t.admin.subtitle}</Text>
      </View>

      <View style={styles.scrollContent}>
        <CreateUserSection onUserCreated={handleUserCreated} language={language} />

        <View style={styles.usersSection}>
          <View style={styles.usersSectionHeader}>
            <Text style={styles.usersSectionTitle}>
              {t.admin.allMembers} ({users.length})
            </Text>
            {selectionMode && (
              <View style={styles.selectionActions}>
                <Pressable
                  style={styles.cancelSelectionButton}
                  onPress={handleCancelSelection}
                  testID="cancel-selection"
                >
                  <X color={Colors.light.text} size={20} strokeWidth={2.5} />
                </Pressable>
                {selectedUserIds.length > 0 && (
                  <Pressable
                    style={styles.deleteSelectionButton}
                    onPress={handleDeleteSelected}
                    testID="delete-selected"
                  >
                    <Trash2 color={Colors.light.text} size={20} strokeWidth={2.5} />
                    <Text style={styles.deleteSelectionButtonText}>
                      {selectedUserIds.length}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </>
  ), [users.length, handleUserCreated, selectionMode, selectedUserIds.length, handleCancelSelection, handleDeleteSelected, t.admin.title, t.admin.allMembers, language]);

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="admin-screen">
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews={false}
        automaticallyAdjustKeyboardInsets
        ListFooterComponent={() => <CreateGroupSection language={language} />}
        renderItem={({ item }) => {
          const isSelected = selectedUserIds.includes(item.id);
          return (
            <Pressable
              style={[styles.userCard, isSelected && styles.userCardSelected]}
              onPress={() => {
                if (selectionMode) {
                  toggleUserSelection(item.id);
                } else {
                  router.push(`/member-profile?userId=${item.id}`);
                }
              }}
              onPressIn={() => handlePressIn(item.id)}
              onPressOut={handlePressOut}
              testID={`user-card-${item.id}`}
            >
              {selectionMode && (
                <View style={styles.selectionCheckbox}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <View style={styles.checkboxInner} />
                    )}
                  </View>
                </View>
              )}
              <View style={styles.userCardLeft}>
                <View style={[styles.userAvatar, item.role === "admin" && styles.userAvatarAdmin, item.deletedByUser && styles.userAvatarDeleted]}>
                  {item.role === "admin" ? (
                    <Shield color={Colors.light.text} size={20} strokeWidth={2.5} />
                  ) : (
                    <User color={item.deletedByUser ? "#ef4444" : Colors.light.muted} size={20} strokeWidth={2.5} />
                  )}
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    {item.isCrownAdmin && (
                      <Crown color="#FFD700" size={16} strokeWidth={2.5} style={{ marginRight: 4 }} />
                    )}
                    <Text style={styles.userName}>{item.username}</Text>
                    {item.deletedByUser && (
                      <View style={styles.deletedBadge}>
                        <Text style={styles.deletedBadgeText}>{t.admin.deletedByUser}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userRole}>{item.role.toUpperCase()}</Text>
                  {!item.deletedByUser && (
                    <Text style={styles.userPassword}>
                      {item.passwordChangedByUser ? "••••••••" : item.password}
                    </Text>
                  )}
                </View>
              </View>
              
              {!selectionMode && (
                <View style={styles.userActions}>
                  {item.deletedByUser ? (
                    <View style={styles.deletedActions}>
                      <Pressable
                        style={styles.reactivateButton}
                        onPress={() => handleReactivateAccount(item.id, item.username)}
                        testID={`reactivate-${item.id}`}
                      >
                        <CheckCircle color="#10b981" size={16} strokeWidth={2.5} />
                        <Text style={styles.reactivateButtonText}>{t.admin.reactivate}</Text>
                      </Pressable>
                      <Pressable
                        style={styles.permanentDeleteButton}
                        onPress={() => handlePermanentDelete(item.id, item.username)}
                        testID={`permanent-delete-${item.id}`}
                      >
                        <XCircle color="#ef4444" size={16} strokeWidth={2.5} />
                        <Text style={styles.permanentDeleteButtonText}>{t.admin.permanentDelete}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
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
                          style={[
                            styles.actionButton, 
                            item.role === "member" && styles.actionButtonActive,
                            (item.role === "admin" && !currentUser?.isCrownAdmin) && styles.actionButtonDisabled
                          ]} 
                          onPress={async () => {
                            if (item.role === "admin" && !currentUser?.isCrownAdmin) {
                              Alert.alert(
                                t.admin.accessDenied || "Geen toegang",
                                t.admin.onlyCrownAdminCanDemote || "Alleen de hoofdbeheerder kan admins depromoveren naar leden"
                              );
                              return;
                            }
                            try {
                              await setRole(item.id, "member");
                            } catch (error) {
                              Alert.alert(
                                t.admin.accessDenied || "Geen toegang",
                                t.admin.onlyCrownAdminCanDemote || "Alleen de hoofdbeheerder kan admins depromoveren naar leden"
                              );
                            }
                          }} 
                          testID={`make-member-${item.id}`}
                        >
                          <Text style={[
                            styles.actionButtonText, 
                            item.role === "member" && styles.actionButtonTextActive,
                            (item.role === "admin" && !currentUser?.isCrownAdmin) && styles.actionButtonTextDisabled
                          ]}>
                            {t.admin.member}
                          </Text>
                        </Pressable>
                        <Pressable 
                          style={[styles.actionButton, item.role === "admin" && styles.actionButtonActive]} 
                          onPress={() => setRole(item.id, "admin")} 
                          testID={`make-admin-${item.id}`}
                        >
                          <Text style={[styles.actionButtonText, item.role === "admin" && styles.actionButtonTextActive]}>
                            {t.admin.admin}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              )}
            </Pressable>
          );
        }}
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
    fontSize: 15,
    textAlign: "center" as const,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  usersSection: {
    marginBottom: 16,
  },
  usersSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  usersSectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: "700" as const,
  },
  selectionActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  cancelSelectionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  deleteSelectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  deleteSelectionButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700" as const,
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
  userCardSelected: {
    backgroundColor: `${Colors.light.primary}15`,
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  selectionCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.light.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.light.text,
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
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonTextDisabled: {
    color: Colors.light.muted,
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
    gap: 10,
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  deleteButtonText: { 
    color: Colors.light.text, 
    fontWeight: "700" as const,
    fontSize: 15,
    textAlign: "center" as const,
  },
  cancelButton: {
    backgroundColor: Colors.light.darkGray,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  cancelButtonText: { 
    color: Colors.light.text, 
    fontWeight: "700" as const,
    fontSize: 15,
    textAlign: "center" as const,
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
  userAvatarDeleted: {
    backgroundColor: "#fee2e2",
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  deletedBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deletedBadgeText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  deletedActions: {
    gap: 8,
  },
  reactivateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#d1fae5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  reactivateButtonText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  permanentDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fee2e2",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  permanentDeleteButtonText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700" as const,
  },
});
