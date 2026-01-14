import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { User, Mail, Phone, MapPin, Calendar, X, Crown, Trash2 } from "lucide-react-native";
import { formatDateDisplay } from "@/constants/dateUtils";
import { useAppState } from "@/providers/AppState";

export default function MemberProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { users, currentUser, setCrownAdmin, softDeleteAccount } = useAppState();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const member = users.find(u => u.id === userId);

  const handleMakeCrownAdmin = () => {
    if (!member) return;
    
    Alert.alert(
      "Kroon admin aanwijzen",
      `Weet je zeker dat je ${member.username} kroon admin wilt maken? Je verliest hierdoor je kroon admin rechten.`,
      [
        { text: "Annuleren", style: "cancel" },
        { 
          text: "Bevestigen", 
          style: "destructive",
          onPress: async () => {
            await setCrownAdmin(member.id);
            Alert.alert("Gelukt", `${member.username} is nu de kroon admin`);
            router.back();
          }
        },
      ]
    );
  };

  const handleDeleteMember = () => {
    if (!member) return;
    
    Alert.alert(
      "Lid verwijderen",
      `Weet je zeker dat je ${member.username} wilt verwijderen? Dit lid kan niet meer inloggen totdat het account wordt geheractiveerd.`,
      [
        { text: "Annuleren", style: "cancel" },
        { 
          text: "Verwijderen", 
          style: "destructive",
          onPress: async () => {
            await softDeleteAccount(member.id);
            Alert.alert("Gelukt", `${member.username} is verwijderd`);
            router.back();
          }
        },
      ]
    );
  };

  if (!member) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Lid niet gevonden</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: "Profiel",
          headerStyle: { backgroundColor: Colors.light.background },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <X color={Colors.light.text} size={24} strokeWidth={2.5} />
            </Pressable>
          ),
        }} 
      />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.avatar, member.role === "admin" && styles.avatarAdmin]}>
              {member.role === "admin" ? (
                <User color={Colors.light.text} size={48} strokeWidth={2.5} />
              ) : (
                <User color={Colors.light.muted} size={48} strokeWidth={2.5} />
              )}
            </View>
            <View style={styles.nameRow}>
              {member.isCrownAdmin && (
                <Crown color="#FFD700" size={24} strokeWidth={2.5} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.name}>{member.username}</Text>
            </View>
            <Text style={styles.role}>{member.role.toUpperCase()}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Persoonlijke informatie</Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <User size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Naam</Text>
                <Text style={[styles.input, styles.inputText]}>{member.username || 'Niet ingevuld'}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Calendar size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Geboortedatum</Text>
                <Text style={[styles.input, styles.inputText]}>{formatDateDisplay(member.age) || 'Niet ingevuld'}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <MapPin size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Adres</Text>
                <Text style={[styles.input, styles.inputText]}>{member.address || 'Niet ingevuld'}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Phone size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nummer</Text>
                <Text style={[styles.input, styles.inputText]}>{member.phone || 'Niet ingevuld'}</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Mail size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>E-mail</Text>
                <Text style={[styles.input, styles.inputText]}>{member.email || 'Niet ingevuld'}</Text>
              </View>
            </View>
          </View>

          {currentUser?.isCrownAdmin && (
            <View style={styles.adminSection}>
              <Pressable style={styles.makeCrownAdminButton} onPress={handleMakeCrownAdmin}>
                <Crown color={Colors.light.primary} size={20} strokeWidth={2.5} />
                <Text style={styles.makeCrownAdminButtonText}>Maak kroon admin</Text>
              </Pressable>

              <Pressable style={styles.deleteMemberButton} onPress={handleDeleteMember}>
                <Trash2 color="#fff" size={20} strokeWidth={2.5} />
                <Text style={styles.deleteMemberButtonText}>Verwijder lid</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.darkGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: Colors.light.surface,
  },
  avatarAdmin: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  role: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.light.muted,
    letterSpacing: 1,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.error,
    textAlign: "center",
    marginTop: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
  },
  inputIconWrapper: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  inputWrapper: {
    flex: 1,
    paddingRight: 16,
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.light.muted,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
    padding: 0,
  },
  inputText: {
    paddingVertical: 8,
    color: Colors.light.muted,
  },
  adminSection: {
    marginTop: 24,
    gap: 12,
  },
  makeCrownAdminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  makeCrownAdminButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  deleteMemberButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#dc2626",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  deleteMemberButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
