import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useState } from "react";
import { User, Lock, Calendar, MapPin, Phone, Mail, LogOut } from "lucide-react-native";
import { useAppState } from "@/providers/AppState";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, changePassword } = useAppState();
  const router = useRouter();
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  
  const [name, setName] = useState<string>(currentUser?.username || "");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [age, setAge] = useState<string>("25");
  const [address, setAddress] = useState<string>("Hoofdstraat 123");
  const [phone, setPhone] = useState<string>("+31 6 12345678");
  const [email, setEmail] = useState<string>("jan@example.com");
  
  const [isEditingPassword, setIsEditingPassword] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  const handleSavePassword = () => {
    if (!currentUser) return;
    
    if (currentPassword !== currentUser.password) {
      Alert.alert("Fout", "Huidig wachtwoord is onjuist");
      return;
    }
    
    if (newPassword === confirmPassword && newPassword.length >= 6) {
      changePassword(currentUser.id, newPassword);
      Alert.alert("Gelukt", "Wachtwoord is succesvol gewijzigd");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
    }
  };

  const handleSaveProfile = () => {
    if (isEditingProfile) {
      Alert.alert("Gelukt", "Profiel opgeslagen");
      setIsEditingProfile(false);
    } else {
      setIsEditingProfile(true);
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Uitloggen",
      "Weet je zeker dat je wilt uitloggen?",
      [
        { text: "Annuleren", style: "cancel" },
        { 
          text: "Uitloggen", 
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login");
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
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>Beheer je persoonlijke gegevens</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Persoonlijke informatie</Text>
            
            <View style={[styles.inputContainer, !isEditingProfile && styles.inputContainerDisabled]}>
              <View style={[styles.inputIconWrapper, !isEditingProfile && styles.inputIconWrapperDisabled]}>
                <User size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Naam</Text>
                <TextInput
                  style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Voer je naam in"
                  placeholderTextColor={Colors.light.mutedLight}
                  editable={isEditingProfile}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, !isEditingProfile && styles.inputContainerDisabled]}>
              <View style={[styles.inputIconWrapper, !isEditingProfile && styles.inputIconWrapperDisabled]}>
                <Calendar size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Leeftijd</Text>
                <TextInput
                  style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                  value={age}
                  onChangeText={setAge}
                  placeholder="Voer je leeftijd in"
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.light.mutedLight}
                  editable={isEditingProfile}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, !isEditingProfile && styles.inputContainerDisabled]}>
              <View style={[styles.inputIconWrapper, !isEditingProfile && styles.inputIconWrapperDisabled]}>
                <MapPin size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Adres</Text>
                <TextInput
                  style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Voer je adres in"
                  placeholderTextColor={Colors.light.mutedLight}
                  editable={isEditingProfile}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, !isEditingProfile && styles.inputContainerDisabled]}>
              <View style={[styles.inputIconWrapper, !isEditingProfile && styles.inputIconWrapperDisabled]}>
                <Phone size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Telefoonnummer</Text>
                <TextInput
                  style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Voer je telefoonnummer in"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.light.mutedLight}
                  editable={isEditingProfile}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, !isEditingProfile && styles.inputContainerDisabled]}>
              <View style={[styles.inputIconWrapper, !isEditingProfile && styles.inputIconWrapperDisabled]}>
                <Mail size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Voer je email in"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.light.mutedLight}
                  editable={isEditingProfile}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>
                {isEditingProfile ? "Profiel opslaan" : "Profiel bewerken"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lock size={20} color={Colors.light.text} />
              <Text style={styles.sectionTitle}>Wachtwoord</Text>
            </View>
            
            {!isEditingPassword ? (
              <TouchableOpacity 
                style={styles.changePasswordButton}
                onPress={() => setIsEditingPassword(true)}
              >
                <Text style={styles.changePasswordButtonText}>Wachtwoord wijzigen</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.passwordInputContainer}>
                  <Text style={styles.inputLabel}>Huidig wachtwoord</Text>
                  <TextInput
                    style={styles.passwordInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Voer huidig wachtwoord in"
                    secureTextEntry
                    placeholderTextColor={Colors.light.mutedLight}
                  />
                </View>

                <View style={styles.passwordInputContainer}>
                  <Text style={styles.inputLabel}>Nieuw wachtwoord</Text>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Voer nieuw wachtwoord in"
                    secureTextEntry
                    placeholderTextColor={Colors.light.mutedLight}
                  />
                </View>

                <View style={styles.passwordInputContainer}>
                  <Text style={styles.inputLabel}>Bevestig nieuw wachtwoord</Text>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Bevestig nieuw wachtwoord"
                    secureTextEntry
                    placeholderTextColor={Colors.light.mutedLight}
                  />
                </View>

                {newPassword !== confirmPassword && confirmPassword.length > 0 && (
                  <Text style={styles.errorText}>Wachtwoorden komen niet overeen</Text>
                )}

                {newPassword.length > 0 && newPassword.length < 6 && (
                  <Text style={styles.errorText}>Wachtwoord moet minimaal 6 tekens bevatten</Text>
                )}

                <View style={styles.passwordButtonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Annuleren</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.savePasswordButton,
                      (newPassword !== confirmPassword || newPassword.length < 6) && styles.savePasswordButtonDisabled
                    ]}
                    onPress={handleSavePassword}
                    disabled={newPassword !== confirmPassword || newPassword.length < 6}
                  >
                    <Text style={styles.savePasswordButtonText}>Opslaan</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color={Colors.light.error} />
              <Text style={styles.logoutButtonText}>Uitloggen</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      <MenuModal 
        visible={showMenuModal} 
        onClose={() => setShowMenuModal(false)}
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainerDisabled: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  inputIconWrapper: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  inputIconWrapperDisabled: {
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
  inputDisabled: {
    color: Colors.light.muted,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  changePasswordButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.primary,
  },
  passwordInputContainer: {
    marginBottom: 12,
  },
  passwordInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.error,
    marginTop: 4,
    marginBottom: 8,
  },
  passwordButtonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  savePasswordButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  savePasswordButtonDisabled: {
    opacity: 0.5,
  },
  savePasswordButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.light.error,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.error,
  },
});
