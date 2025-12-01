import { Tabs, useRouter } from "expo-router";
import { CalendarDays, FolderOpen, LayoutDashboard, Settings, Menu, Trash2, ChevronRight, X, UserPlus, Shield, User as UserIcon, Users, CalendarCheck, Newspaper, BookOpen, Bell, LogOut, Crown } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, Alert, TextInput, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAppState, Role } from "@/providers/AppState";

function MenuModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { currentUser, logout, t } = useAppState();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      t.account.logout,
      "Weet je zeker dat je wilt uitloggen?",
      [
        { text: t.common.cancel, style: "cancel" },
        { 
          text: t.account.logout, 
          style: "destructive",
          onPress: () => {
            logout();
            onClose();
            router.replace("/login");
          }
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={localStyles.modalOverlay}>
        <View style={[localStyles.menuModalContent, { paddingTop: insets.top + 20 }]}>
          <View style={localStyles.modalHeader}>
            <Text style={localStyles.modalTitle}>Menu</Text>
            <Pressable onPress={onClose} testID="close-menu-modal">
              <X color={Colors.light.text} size={28} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView
            style={localStyles.scrollView}
            contentContainerStyle={[localStyles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={true}
          >

          <TouchableOpacity
            style={localStyles.menuItem}
            onPress={() => {
              onClose();
              router.push("/account");
            }}
            testID="menu-account"
          >
            <View style={localStyles.menuIconContainer}>
              <UserIcon color={Colors.light.primary} size={22} strokeWidth={2.5} />
            </View>
            <Text style={localStyles.menuItemText}>{t.tabs.account}</Text>
            <ChevronRight color={Colors.light.muted} size={20} />
          </TouchableOpacity>

          {currentUser?.role === "admin" && (
            <TouchableOpacity
              style={localStyles.menuItem}
              onPress={() => {
                onClose();
                router.push("/admin");
              }}
              testID="menu-admin"
            >
              <View style={localStyles.menuIconContainer}>
                <Users color={Colors.light.primary} size={22} strokeWidth={2.5} />
              </View>
              <Text style={localStyles.menuItemText}>{t.tabs.admin}</Text>
              <ChevronRight color={Colors.light.muted} size={20} />
            </TouchableOpacity>
          )}

          {currentUser?.role === "admin" && (
            <TouchableOpacity
              style={localStyles.menuItem}
              onPress={() => {
                onClose();
                router.push("/repetitie");
              }}
              testID="menu-repetitie"
            >
              <View style={localStyles.menuIconContainer}>
                <CalendarCheck color={Colors.light.primary} size={22} strokeWidth={2.5} />
              </View>
              <Text style={localStyles.menuItemText}>{t.tabs.repetitie}</Text>
              <ChevronRight color={Colors.light.muted} size={20} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={localStyles.menuItem}
            onPress={() => {
              onClose();
              router.push("/huiswerk");
            }}
            testID="menu-huiswerk"
          >
            <View style={localStyles.menuIconContainer}>
              <BookOpen color={Colors.light.primary} size={22} strokeWidth={2.5} />
            </View>
            <Text style={localStyles.menuItemText}>{t.tabs.huiswerk}</Text>
            <ChevronRight color={Colors.light.muted} size={20} />
          </TouchableOpacity>

          {currentUser?.role === "admin" && (
            <TouchableOpacity
              style={localStyles.menuItem}
              onPress={() => {
                onClose();
                router.push("/nieuws");
              }}
              testID="menu-nieuws"
            >
              <View style={localStyles.menuIconContainer}>
                <Newspaper color={Colors.light.primary} size={22} strokeWidth={2.5} />
              </View>
              <Text style={localStyles.menuItemText}>{t.tabs.nieuws}</Text>
              <ChevronRight color={Colors.light.muted} size={20} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={localStyles.menuItem}
            onPress={() => {
              onClose();
              router.push("/meldingen");
            }}
            testID="menu-meldingen"
          >
            <View style={localStyles.menuIconContainer}>
              <Bell color={Colors.light.primary} size={22} strokeWidth={2.5} />
            </View>
            <Text style={localStyles.menuItemText}>{t.tabs.meldingen}</Text>
            <ChevronRight color={Colors.light.muted} size={20} />
          </TouchableOpacity>

          {currentUser?.role === "admin" && (
            <TouchableOpacity
              style={localStyles.menuItem}
              onPress={() => {
                onClose();
                router.push("/deleted");
              }}
              testID="menu-deleted"
            >
              <View style={localStyles.menuIconContainer}>
                <Trash2 color={Colors.light.primary} size={22} strokeWidth={2.5} />
              </View>
              <Text style={localStyles.menuItemText}>{t.tabs.deleted}</Text>
              <ChevronRight color={Colors.light.muted} size={20} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={localStyles.menuItem}
            onPress={() => {
              onClose();
              router.push("/instellingen");
            }}
            testID="menu-instellingen"
          >
            <View style={localStyles.menuIconContainer}>
              <Settings color={Colors.light.primary} size={22} strokeWidth={2.5} />
            </View>
            <Text style={localStyles.menuItemText}>{t.tabs.instellingen}</Text>
            <ChevronRight color={Colors.light.muted} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.menuItem, localStyles.logoutMenuItem]}
            onPress={handleLogout}
            testID="menu-logout"
          >
            <View style={[localStyles.menuIconContainer, localStyles.logoutIconContainer]}>
              <LogOut color={Colors.light.error} size={22} strokeWidth={2.5} />
            </View>
            <Text style={[localStyles.menuItemText, localStyles.logoutText]}>{t.account.logout}</Text>
            <ChevronRight color={Colors.light.error} size={20} />
          </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AdminModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { users, addUser, setRole, currentUser } = useAppState();
  const [username, setUsername] = useState<string>("");
  const [role, setRoleLocal] = useState<Role>("member");
  const insets = useSafeAreaInsets();

  if (currentUser?.role !== "admin") {
    return null;
  }

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
            <Text style={localStyles.modalTitle}>Beheer</Text>
            <Pressable onPress={onClose} testID="close-admin-modal">
              <X color={Colors.light.text} size={28} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={localStyles.createSection}>
            <View style={localStyles.sectionHeader}>
              <UserPlus color={Colors.light.primary} size={22} strokeWidth={2.5} />
              <Text style={localStyles.sectionTitle}>Nieuwe Gebruiker Aanmaken</Text>
            </View>
            
            <TextInput
              style={localStyles.input}
              placeholder="Voer gebruikersnaam in"
              placeholderTextColor={Colors.light.muted}
              value={username}
              onChangeText={setUsername}
              testID="new-username"
            />
            
            <View style={localStyles.roleSelector}>
              <Text style={localStyles.roleLabel}>Rol:</Text>
              <View style={localStyles.roleButtons}>
                <Pressable 
                  style={[localStyles.roleButton, role === "member" && localStyles.roleButtonActive]} 
                  onPress={() => setRoleLocal("member")}
                >
                  <UserIcon color={role === "member" ? Colors.light.text : Colors.light.muted} size={16} strokeWidth={2} />
                  <Text style={[localStyles.roleButtonText, role === "member" && localStyles.roleButtonTextActive]}>
                    Lid
                  </Text>
                </Pressable>
                <Pressable 
                  style={[localStyles.roleButton, role === "admin" && localStyles.roleButtonActive]} 
                  onPress={() => setRoleLocal("admin")}
                >
                  <Shield color={role === "admin" ? Colors.light.text : Colors.light.muted} size={16} strokeWidth={2} />
                  <Text style={[localStyles.roleButtonText, role === "admin" && localStyles.roleButtonTextActive]}>
                    Admin
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[localStyles.createButton, { opacity: username ? 1 : 0.5 }]} 
              disabled={!username}
              onPress={async () => {
                try {
                  const trimmedUsername = username.trim();
                  if (!trimmedUsername) {
                    return;
                  }
                  const { user, password } = await addUser(trimmedUsername, role);
                  Alert.alert("Account Aangemaakt", `Gebruikersnaam: ${user.username}\nWachtwoord: ${password}\n\nBewaar dit wachtwoord!`);
                  setUsername("");
                } catch (error) {
                  console.error("Error creating account", error);
                  Alert.alert("Fout", "Kon account niet aanmaken. Probeer het later opnieuw.");
                }
              }}
              testID="create-user"
            >
              <UserPlus color={Colors.light.text} size={20} strokeWidth={2.5} />
              <Text style={localStyles.createButtonText}>Account Aanmaken</Text>
            </Pressable>
          </View>

          <View style={localStyles.usersSection}>
            <Text style={localStyles.usersSectionTitle}>
              Alle Gebruikers ({users.length})
            </Text>
            
            <FlatList
              data={users}
              keyExtractor={(u) => u.id}
              contentContainerStyle={localStyles.list}
              renderItem={({ item }) => (
                <View style={localStyles.userCard}>
                  <View style={localStyles.userCardLeft}>
                    <View style={[localStyles.userAvatar, item.role === "admin" && localStyles.userAvatarAdmin]}>
                      {item.role === "admin" ? (
                        <Shield color={Colors.light.text} size={20} strokeWidth={2.5} />
                      ) : (
                        <UserIcon color={Colors.light.muted} size={20} strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={localStyles.userInfo}>
                      <Text style={localStyles.userName}>{item.username}</Text>
                      <Text style={localStyles.userRole}>{item.role.toUpperCase()}</Text>
                    </View>
                  </View>
                  
                  <View style={localStyles.userActions}>
                    <Pressable 
                      style={[localStyles.actionButton, item.role === "member" && localStyles.actionButtonActive]} 
                      onPress={() => setRole(item.id, "member")} 
                      testID={`make-member-${item.id}`}
                    >
                      <Text style={[localStyles.actionButtonText, item.role === "member" && localStyles.actionButtonTextActive]}>
                        Lid
                      </Text>
                    </Pressable>
                    <Pressable 
                      style={[localStyles.actionButton, item.role === "admin" && localStyles.actionButtonActive]} 
                      onPress={() => setRole(item.id, "admin")} 
                      testID={`make-admin-${item.id}`}
                    >
                      <Text style={[localStyles.actionButtonText, item.role === "admin" && localStyles.actionButtonTextActive]}>
                        Admin
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TabLayout() {
  const { currentUser, t } = useAppState();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.tint,
          tabBarInactiveTintColor: Colors.light.muted,
          headerShown: true,
          tabBarStyle: { 
            backgroundColor: Colors.light.surface,
            borderTopWidth: 1,
            borderTopColor: Colors.light.border,
            height: 80,
            paddingBottom: 10,
            paddingTop: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 8,
          },
          headerStyle: { 
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.text,
          headerShadowVisible: false,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600" as const,
            marginTop: 4,
          },
          headerLeft: () => (
            <Pressable 
              onPress={() => setShowMenuModal(true)} 
              style={localStyles.menuButton}
              testID="menu-button"
            >
              <Menu color={Colors.light.primary} size={24} strokeWidth={2.5} />
            </Pressable>
          ),
          headerTitle: "OneBand",
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "800" as const,
            letterSpacing: 1,
          },
          headerRight: () => (
            <View style={localStyles.userNameContainer}>
              {currentUser?.isCrownAdmin && (
                <Crown color="#FFD700" size={16} strokeWidth={2.5} style={{ marginRight: 6 }} />
              )}
              <Text style={localStyles.headerUserName}>{currentUser?.username || ''}</Text>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="library"
          options={{
            title: t.tabs.library,
            tabBarIcon: ({ color, focused }) => <FolderOpen color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />,
          }}
        />
        <Tabs.Screen
          name="assignments"
          options={{
            title: t.tabs.assignments,
            tabBarIcon: ({ color, focused }) => <LayoutDashboard color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: t.tabs.calendar,
            tabBarIcon: ({ color, focused }) => <CalendarDays color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />,
          }}
        />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="deleted" options={{ href: null }} />
        <Tabs.Screen name="all-media" options={{ href: null }} />
        <Tabs.Screen name="all-assignments" options={{ href: null }} />
        <Tabs.Screen name="all-news" options={{ href: null }} />
        <Tabs.Screen name="all-practices" options={{ href: null }} />
        <Tabs.Screen name="account" options={{ href: null }} />
        <Tabs.Screen name="repetitie" options={{ href: null }} />
        <Tabs.Screen name="nieuws" options={{ href: null }} />
        <Tabs.Screen name="huiswerk" options={{ href: null }} />
        <Tabs.Screen name="meldingen" options={{ href: null }} />
        <Tabs.Screen name="instellingen" options={{ href: null }} />
      </Tabs>
      <MenuModal 
        visible={showMenuModal} 
        onClose={() => setShowMenuModal(false)}
      />
      <AdminModal visible={showAdminModal} onClose={() => setShowAdminModal(false)} />
    </>
  );
}

const localStyles = StyleSheet.create({
  menuButton: {
    marginLeft: 16,
    padding: 8,
  },
  userNameContainer: {
    marginRight: 16,
    padding: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  headerUserName: {
    fontSize: 16,
    fontWeight: "800" as const,
    letterSpacing: 1,
    color: Colors.light.text,
  },
  settingsButton: {
    marginRight: 16,
    padding: 8,
  },
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
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  createSection: {
    marginHorizontal: 20,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700' as const,
  },
  roleButtonTextActive: {
    color: Colors.light.text,
  },
  createButton: {
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
  createButtonText: {
    color: Colors.light.text,
    fontWeight: '700' as const,
    fontSize: 16,
  },
  usersSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  usersSectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  userRole: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  userActions: {
    flexDirection: 'row',
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
    fontWeight: '700' as const,
    fontSize: 13,
  },
  actionButtonTextActive: {
    color: Colors.light.text,
  },
  menuModalContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  logoutMenuItem: {
    borderColor: Colors.light.error,
    borderWidth: 2,
  },
  logoutIconContainer: {
    backgroundColor: `${Colors.light.error}15`,
  },
  logoutText: {
    color: Colors.light.error,
  },
});

export function MenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable 
      onPress={onPress} 
      style={localStyles.menuButton}
      testID="menu-button"
    >
      <Menu color={Colors.light.primary} size={24} strokeWidth={2.5} />
    </Pressable>
  );
}

export { MenuModal };
