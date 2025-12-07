import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { User, Lock, Music, Fingerprint } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAppState } from "@/providers/AppState";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { biometricEnabled, login } = useAppState();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showBiometricButton, setShowBiometricButton] = useState<boolean>(false);

  const checkAndShowBiometric = useCallback(async () => {
    if (Platform.OS === 'web' || !biometricEnabled) {
      return;
    }
    
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled && biometricEnabled) {
      setShowBiometricButton(true);
      const lastUsername = await AsyncStorage.getItem('last_username');
      if (lastUsername) {
        setUsername(lastUsername);
      }
    }
  }, [biometricEnabled]);

  useEffect(() => {
    checkAndShowBiometric();
  }, [checkAndShowBiometric]);

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login met biometrie',
      });

      if (result.success) {
        const lastUsername = await AsyncStorage.getItem('last_username');
        const lastPassword = await AsyncStorage.getItem('last_password');
        
        if (lastUsername && lastPassword) {
          const success = await login(lastUsername, lastPassword);
          if (success) {
            router.replace("/(tabs)/assignments");
          } else {
            Alert.alert("Inloggen mislukt", "Opgeslagen inloggegevens zijn niet meer geldig");
          }
        } else {
          Alert.alert("Fout", "Geen opgeslagen inloggegevens gevonden");
        }
      }
    } catch (error) {
      console.error('Biometric error:', error);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Fout", "Voer gebruikersnaam en wachtwoord in");
      return;
    }

    const success = await login(username.trim(), password);
    if (success) {
      if (biometricEnabled && Platform.OS !== 'web') {
        await AsyncStorage.setItem('last_username', username.trim());
        await AsyncStorage.setItem('last_password', password);
      }
      router.replace("/(tabs)/assignments");
    } else {
      Alert.alert("Inloggen mislukt", "Gebruikersnaam of wachtwoord is onjuist");
    }
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
          <Text style={styles.appName}>OneBand</Text>
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

          {showBiometricButton && (
            <TouchableOpacity 
              style={styles.biometricButton} 
              onPress={handleBiometricLogin}
            >
              <Fingerprint color={Colors.light.tint} size={28} strokeWidth={2} />
              <Text style={styles.biometricButtonText}>Login met biometrie</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 OneBand</Text>
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
  biometricButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 16,
    gap: 12,
  },
  biometricButtonText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
