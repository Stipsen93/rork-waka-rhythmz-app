import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View, Pressable, ScrollView, Platform } from "react-native";
import Colors from "@/constants/colors";
import { Role } from "@/providers/AppState";
import { useProfiles } from "@/hooks/useProfiles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserPlus, Shield, User, RotateCcw } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";



export default function AdminScreen() {
  const { profiles, isLoading, createUser, updateRole, resetPassword } = useProfiles();
  const [email, setEmail] = useState<string>("");
  const [role, setRoleLocal] = useState<Role>("member");
  const insets = useSafeAreaInsets();

  const handleCreateUser = async () => {
    if (!email.trim()) return;
    
    try {
      const result = await createUser({ email: email.trim(), role });
      Alert.alert("Account Aangemaakt", `Email: ${result.email}\nWachtwoord: ${result.password}\n\nBewaar dit wachtwoord!`);
      setEmail("");
    } catch (error) {
      Alert.alert("Fout", "Kon account niet aanmaken");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: Role) => {
    try {
      await updateRole({ userId, role: newRole });
    } catch (error) {
      Alert.alert("Fout", "Kon rol niet wijzigen");
    }
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
            try {
              const result = await resetPassword(userId);
              Alert.alert(
                "Wachtwoord Gereset",
                `Nieuw wachtwoord voor ${userName}:\n${result.password}\n\nBewaar dit wachtwoord!`
              );
            } catch (error) {
              Alert.alert("Fout", "Kon wachtwoord niet resetten");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="admin-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.25, 1]}
      />
      
      <View style={styles.header}>
        <Text style={styles.appName}>WAKA RHYTHMZ</Text>
        <Text style={styles.title}>Leden</Text>
        <Text style={styles.subtitle}>Beheer gebruikers & rechten</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.createSection}>
        <View style={styles.sectionHeader}>
          <UserPlus color={Colors.light.primary} size={22} strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>Nieuwe Gebruiker Aanmaken</Text>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Voer email in"
          placeholderTextColor={Colors.light.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="new-email"
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
          style={[styles.createButton, { opacity: email ? 1 : 0.5 }]} 
          disabled={!email}
          onPress={handleCreateUser}
          testID="create-user"
        >
          <UserPlus color={Colors.light.text} size={20} strokeWidth={2.5} />
          <Text style={styles.createButtonText}>Account Aanmaken</Text>
        </Pressable>
        </View>

        <View style={styles.usersSection}>
        <Text style={styles.usersSectionTitle}>
          Alle Gebruikers ({profiles.length})
        </Text>
        
        <FlatList
          data={profiles}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
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
                  <Text style={styles.userName}>{item.email}</Text>
                  <Text style={styles.userRole}>{item.role.toUpperCase()}</Text>
                  <Text style={styles.userPassword}>
                    {item.passwordChangedByUser ? "••••••••" : "Nog niet ingelogd"}
                  </Text>
                </View>
              </View>
              
              <View style={styles.userActions}>
                <Pressable
                  style={styles.resetButton}
                  onPress={() => handleResetPassword(item.id, item.email)}
                  testID={`reset-password-${item.id}`}
                >
                  <RotateCcw color={Colors.light.primary} size={18} strokeWidth={2.5} />
                </Pressable>
                <Pressable 
                  style={[styles.actionButton, item.role === "member" && styles.actionButtonActive]} 
                  onPress={() => handleUpdateRole(item.id, "member")} 
                  testID={`make-member-${item.id}`}
                >
                  <Text style={[styles.actionButtonText, item.role === "member" && styles.actionButtonTextActive]}>
                    Lid
                  </Text>
                </Pressable>
                <Pressable 
                  style={[styles.actionButton, item.role === "admin" && styles.actionButtonActive]} 
                  onPress={() => handleUpdateRole(item.id, "admin")} 
                  testID={`make-admin-${item.id}`}
                >
                  <Text style={[styles.actionButtonText, item.role === "admin" && styles.actionButtonTextActive]}>
                    Admin
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
        </View>
      </ScrollView>
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
    marginHorizontal: 20,
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
    gap: 24,
  },
  usersSection: {
    gap: 12,
  },
  usersSectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: "700" as const,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.darkGray,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
});
