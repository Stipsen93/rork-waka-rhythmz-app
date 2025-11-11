import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Pressable, Modal } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useState } from "react";
import { User, Lock, LogOut, Trash2, Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useAppState } from "@/providers/AppState";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, logout, changePassword, updateUserProfile, softDeleteAccount } = useAppState();
  const router = useRouter();
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  const [name, setName] = useState<string>(currentUser?.username || "");
  const [birthDate, setBirthDate] = useState<string>(currentUser?.age || "");
  const [address, setAddress] = useState<string>(currentUser?.address || "");
  const [phone, setPhone] = useState<string>(currentUser?.phone || "");
  const [email, setEmail] = useState<string>(currentUser?.email || "");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  
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

  const handleSaveProfile = async () => {
    if (isEditingProfile) {
      if (currentUser) {
        try {
          await updateUserProfile(currentUser.id, {
            username: name,
            age: birthDate || null,
            address: address || null,
            phone: phone || null,
            email: email || null,
          });
          Alert.alert("Gelukt", "Profiel opgeslagen");
        } catch (error) {
          console.error('Profile save error:', error);
          Alert.alert("Fout", "Kon profiel niet opslaan");
        }
      }
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Account verwijderen",
      "Weet je zeker dat je je account wilt verwijderen? Je kunt niet meer inloggen totdat een admin je account heractiveert.",
      [
        { text: "Annuleren", style: "cancel" },
        { 
          text: "Verwijderen", 
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Laatste bevestiging",
              "Dit is je laatste kans. Weet je zeker dat je je account wilt verwijderen?",
              [
                { text: "Annuleren", style: "cancel" },
                { 
                  text: "Ja, verwijderen", 
                  style: "destructive",
                  onPress: async () => {
                    if (currentUser) {
                      await softDeleteAccount(currentUser.id);
                      logout();
                      router.replace("/login");
                      Alert.alert("Account verwijderd", "Je account is verwijderd. Neem contact op met een admin om je account te heractiveren.");
                    }
                  }
                },
              ]
            );
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

            <Pressable 
              style={[styles.inputContainer, !isEditingProfile && styles.inputContainerDisabled]}
              onPress={() => isEditingProfile && setShowDatePicker(true)}
              disabled={!isEditingProfile}
            >
              <View style={[styles.inputIconWrapper, !isEditingProfile && styles.inputIconWrapperDisabled]}>
                <Calendar size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Geboortedatum</Text>
                <Text style={[styles.input, !isEditingProfile && styles.inputDisabled, styles.inputText]}>
                  {birthDate || 'Selecteer geboortedatum'}
                </Text>
              </View>
            </Pressable>

            <View style={[styles.inputContainer, !isEditingProfile && styles.inputContainerDisabled]}>
              <View style={[styles.inputIconWrapper, !isEditingProfile && styles.inputIconWrapperDisabled]}>
                <User size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Adres</Text>
                <TextInput
                  style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder=""
                  placeholderTextColor={Colors.light.mutedLight}
                  editable={isEditingProfile}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, !isEditingProfile && styles.inputContainerDisabled]}>
              <View style={[styles.inputIconWrapper, !isEditingProfile && styles.inputIconWrapperDisabled]}>
                <User size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nummer</Text>
                <TextInput
                  style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder=""
                  placeholderTextColor={Colors.light.mutedLight}
                  editable={isEditingProfile}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={[styles.inputContainer, !isEditingProfile && styles.inputContainerDisabled]}>
              <View style={[styles.inputIconWrapper, !isEditingProfile && styles.inputIconWrapperDisabled]}>
                <User size={20} color={Colors.light.muted} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>E-mail</Text>
                <TextInput
                  style={[styles.input, !isEditingProfile && styles.inputDisabled]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder=""
                  placeholderTextColor={Colors.light.mutedLight}
                  editable={isEditingProfile}
                  keyboardType="email-address"
                  autoCapitalize="none"
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

          <View style={styles.section}>
            <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
              <Trash2 size={20} color="#fff" />
              <Text style={styles.deleteAccountButtonText}>Account verwijderen</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Selecteer geboortedatum</Text>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={styles.closeText}>Sluiten</Text>
              </Pressable>
            </View>
            <DatePickerContent
              selectedDate={birthDate}
              onDateSelect={(date) => {
                setBirthDate(date);
                setShowDatePicker(false);
              }}
            />
          </View>
        </View>
      </Modal>

      <MenuModal 
        visible={showMenuModal} 
        onClose={() => setShowMenuModal(false)}
      />
    </>
  );
}

const DatePickerContent = ({ selectedDate, onDateSelect }: { selectedDate: string; onDateSelect: (date: string) => void }) => {
  const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
  const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
  
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return selectedDate ? parseDate(selectedDate) : new Date();
  });
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    
    const days: { date: number; isCurrentMonth: boolean; fullDate: string }[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay.getDate(),
        isCurrentMonth: false,
        fullDate: formatDate(prevMonthDay),
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = new Date(year, month, i);
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: formatDate(fullDate),
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: formatDate(nextMonthDay),
      });
    }
    
    return days;
  };
  
  const days = getDaysInMonth(currentMonth);
  
  return (
    <View style={styles.datePickerContent}>
      <View style={styles.monthNavigation}>
        <Pressable 
          style={styles.monthButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        >
          <ChevronLeft color={Colors.light.text} size={24} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.monthText}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <Pressable 
          style={styles.monthButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
        >
          <ChevronRight color={Colors.light.text} size={24} strokeWidth={2.5} />
        </Pressable>
      </View>
      
      <View style={styles.weekDays}>
        {DAYS.map((day) => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.daysGrid}>
        {days.map((day, index) => (
          <Pressable
            key={`${day.fullDate}-${index}`}
            style={styles.dayButton}
            onPress={() => day.isCurrentMonth && onDateSelect(day.fullDate)}
            disabled={!day.isCurrentMonth}
          >
            <View style={[
              styles.dayCircle,
              !day.isCurrentMonth && styles.dayCircleInactive,
              selectedDate === day.fullDate && styles.dayCircleSelected,
            ]}>
              <Text style={[
                styles.dayText,
                !day.isCurrentMonth && styles.dayTextInactive,
                selectedDate === day.fullDate && styles.dayTextSelected,
              ]}>
                {day.date}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
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
  deleteAccountButton: {
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
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  inputText: {
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  datePickerContent: {
    gap: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    width: 40,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
  },
  dayCircle: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleInactive: {
    opacity: 0.3,
  },
  dayCircleSelected: {
    backgroundColor: Colors.light.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  dayTextInactive: {
    color: Colors.light.muted,
  },
  dayTextSelected: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
});
