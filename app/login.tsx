import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { User, Lock, Music } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Fout", "Voer email en wachtwoord in");
      return;
    }

    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    
    if (result.success) {
      router.replace("/(tabs)/assignments");
    } else {
      Alert.alert("Inloggen mislukt", result.error || "Email of wachtwoord is onjuist");
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
              placeholder="Email"
              placeholderTextColor={Colors.light.mutedLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="login-email"
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
        </View>

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
});
