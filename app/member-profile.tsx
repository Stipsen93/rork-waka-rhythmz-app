import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { User, Mail, Phone, MapPin, Calendar, X, Crown } from "lucide-react-native";
import { useAppState } from "@/providers/AppState";

export default function MemberProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { users } = useAppState();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const member = users.find(u => u.id === userId);

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

            {member.age && (
              <View style={styles.infoCard}>
                <View style={styles.infoIconWrapper}>
                  <Calendar color={Colors.light.primary} size={20} strokeWidth={2.5} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Geboortedatum</Text>
                  <Text style={styles.infoValue}>{member.age}</Text>
                </View>
              </View>
            )}

            {member.email && (
              <View style={styles.infoCard}>
                <View style={styles.infoIconWrapper}>
                  <Mail color={Colors.light.primary} size={20} strokeWidth={2.5} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>E-mail</Text>
                  <Text style={styles.infoValue}>{member.email}</Text>
                </View>
              </View>
            )}

            {member.phone && (
              <View style={styles.infoCard}>
                <View style={styles.infoIconWrapper}>
                  <Phone color={Colors.light.primary} size={20} strokeWidth={2.5} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Telefoon</Text>
                  <Text style={styles.infoValue}>{member.phone}</Text>
                </View>
              </View>
            )}

            {member.address && (
              <View style={styles.infoCard}>
                <View style={styles.infoIconWrapper}>
                  <MapPin color={Colors.light.primary} size={20} strokeWidth={2.5} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Adres</Text>
                  <Text style={styles.infoValue}>{member.address}</Text>
                </View>
              </View>
            )}

            {!member.age && !member.email && !member.phone && !member.address && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Geen persoonlijke informatie beschikbaar</Text>
              </View>
            )}
          </View>
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
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.light.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.light.muted,
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.muted,
    fontWeight: "500" as const,
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
});
