import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { User, Lock, Music, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAppState } from "@/providers/AppState";
import { trpc } from "@/lib/trpc";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetUsername, setResetUsername] = useState<string>("");
  const [resetSubmitted, setResetSubmitted] = useState<boolean>(false);
  const { login } = useAppState();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();

  useEffect(() => {
    loadLastUsername();
  }, []);

  const loadLastUsername = async () => {
    try {
      const lastUsername = await AsyncStorage.getItem('lastLoggedInUsername');
      if (lastUsername) {
        setResetUsername(lastUsername);
      }
    } catch (error) {
      console.log('Error loading last username:', error);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Fout", "Voer gebruikersnaam en wachtwoord in");
      return;
    }

    const success = login(username.trim(), password);
    if (success) {
      await AsyncStorage.setItem('lastLoggedInUsername', username.trim());
      router.replace("/(tabs)/assignments");
    } else {
      Alert.alert("Inloggen mislukt", "Gebruikersnaam of wachtwoord is onjuist");
    }
  };

  const handleForgotPassword = () => {
    setResetSubmitted(false);
    setShowForgotPassword(true);
  };

  const handleSubmitReset = async () => {
    if (!resetUsername.trim()) {
      Alert.alert("Fout", "Voer je gebruikersnaam in");
      return;
    }

    try {
      const lastUsername = await AsyncStorage.getItem('lastLoggedInUsername');
      await requestResetMutation.mutateAsync({
        username: resetUsername.trim(),
        deviceLastLogin: lastUsername || undefined,
      });
      setResetSubmitted(true);
    } catch (error) {
      Alert.alert("Fout", "Er is iets misgegaan. Probeer het opnieuw.");
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setResetSubmitted(false);
    setResetUsername("");
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#1a1a1a", "#2d2d2d", Colors.light.background]}
        style={styles.gradient}
        locations={[0, 0.5, 1]}
      />
      
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Music color={Colors.light.primary} size={48} strokeWidth={2.5} />
          </View>
          <Text style={styles.appName}>WAKA RHYTHMZ</Text>
          <Text style={styles.appTagline}>Drumband Management</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <View style={styles.inputIconWrapper}>
              <User color={Colors.light.muted} size={20} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Gebruikersnaam"
              placeholderTextColor={Colors.light.mutedLight}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              testID="login-username"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIconWrapper}>
              <Lock color={Colors.light.muted} size={20} strokeWidth={2} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Wachtwoord"
              placeholderTextColor={Colors.light.mutedLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              testID="login-password"
            />
          </View>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            testID="login-button"
          >
            <LinearGradient
              colors={[Colors.light.primary, Colors.light.primaryDark]}
              style={styles.loginButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.loginButtonText}>Inloggen</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotPasswordButton} 
            onPress={handleForgotPassword}
            testID="forgot-password-button"
          >
            <Text style={styles.forgotPasswordText}>Wachtwoord vergeten?</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showForgotPassword}
          transparent
          animationType="fade"
          onRequestClose={handleCloseForgotPassword}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Wachtwoord vergeten?</Text>
                  <TouchableOpacity 
                    onPress={handleCloseForgotPassword}
                    style={styles.modalCloseButton}
                  >
                    <X color={Colors.light.muted} size={24} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {!resetSubmitted ? (
                  <>
                    <Text style={styles.modalDescription}>
                      Voer je gebruikersnaam in en de admin zal je een nieuw wachtwoord geven.
                    </Text>

                    <View style={styles.modalInputGroup}>
                      <View style={styles.modalInputIconWrapper}>
                        <User color={Colors.light.muted} size={20} strokeWidth={2} />
                      </View>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Gebruikersnaam"
                        placeholderTextColor={Colors.light.mutedLight}
                        value={resetUsername}
                        onChangeText={setResetUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        testID="reset-username"
                      />
                    </View>

                    <TouchableOpacity 
                      style={[styles.modalButton, { opacity: resetUsername ? 1 : 0.5 }]} 
                      onPress={handleSubmitReset}
                      disabled={!resetUsername || requestResetMutation.isPending}
                      testID="submit-reset-button"
                    >
                      <Text style={styles.modalButtonText}>
                        {requestResetMutation.isPending ? "Versturen..." : "Versturen"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.successContainer}>
                      <Text style={styles.successText}>
                        De admin zal je een nieuw wachtwoord geven.
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.modalButton} 
                      onPress={handleCloseForgotPassword}
                      testID="close-success-button"
                    >
                      <Text style={styles.modalButtonText}>Sluiten</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Waka Rhythmz</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: "900" as const,
    color: "#2196F3",
    letterSpacing: 2,
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.muted,
    letterSpacing: 0.5,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
  },
  inputIconWrapper: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  input: {
    flex: 1,
    paddingRight: 16,
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
    height: 56,
  },
  loginButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonGradient: {
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.muted,
    fontWeight: "500" as const,
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 15,
    color: Colors.light.muted,
    marginBottom: 20,
    lineHeight: 22,
  },
  modalInputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.darkGray,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    overflow: "hidden",
  },
  modalInputIconWrapper: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  modalInput: {
    flex: 1,
    paddingRight: 16,
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.light.text,
    height: 56,
  },
  modalButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  successContainer: {
    backgroundColor: `${Colors.light.primary}15`,
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
  },
  successText: {
    fontSize: 15,
    color: Colors.light.text,
    textAlign: "center" as const,
    lineHeight: 22,
  },
});
