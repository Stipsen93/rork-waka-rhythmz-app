import { Tabs, useRouter } from "expo-router";
import { CalendarDays, FolderOpen, LayoutDashboard, Menu, Trash2, ChevronRight, X, User as UserIcon, Users, CalendarCheck, Newspaper, BookOpen, Bell } from "lucide-react-native";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";

function MenuModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
            <Text style={localStyles.menuItemText}>Account</Text>
            <ChevronRight color={Colors.light.muted} size={20} />
          </TouchableOpacity>

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
            <Text style={localStyles.menuItemText}>Leden</Text>
            <ChevronRight color={Colors.light.muted} size={20} />
          </TouchableOpacity>

          {profile?.role === "admin" && (
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
              <Text style={localStyles.menuItemText}>Repetitie</Text>
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
            <Text style={localStyles.menuItemText}>Huiswerk</Text>
            <ChevronRight color={Colors.light.muted} size={20} />
          </TouchableOpacity>

          {profile?.role === "admin" && (
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
              <Text style={localStyles.menuItemText}>Nieuws</Text>
              <ChevronRight color={Colors.light.muted} size={20} />
            </TouchableOpacity>
          )}

          {profile?.role === "admin" && (
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
              <Text style={localStyles.menuItemText}>Meldingen</Text>
              <ChevronRight color={Colors.light.muted} size={20} />
            </TouchableOpacity>
          )}

          {profile?.role === "admin" && (
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
              <Text style={localStyles.menuItemText}>Verwijderd</Text>
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
              <Menu color={Colors.light.primary} size={22} strokeWidth={2.5} />
            </View>
            <Text style={localStyles.menuItemText}>Instellingen</Text>
            <ChevronRight color={Colors.light.muted} size={20} />
          </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function TabLayout() {
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
          headerTitle: "WAKA RHYTHMZ",
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: "800" as const,
            letterSpacing: 1,
          },
        }}
      >
        <Tabs.Screen
          name="library"
          options={{
            title: "Bibliotheek",
            tabBarIcon: ({ color, focused }) => <FolderOpen color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />,
          }}
        />
        <Tabs.Screen
          name="assignments"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, focused }) => <LayoutDashboard color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Agenda",
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
    </>
  );
}

const localStyles = StyleSheet.create({
  menuButton: {
    marginLeft: 16,
    padding: 8,
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
