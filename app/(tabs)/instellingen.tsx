import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useState } from "react";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { useAppState } from "@/providers/AppState";
import { translations } from "@/constants/translations";
import { ChevronRight, Fingerprint } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";

export default function InstellingenScreen() {
  const insets = useSafeAreaInsets();
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const { language, setLanguage, biometricEnabled, setBiometricEnabled } = useAppState();
  const t = translations[language];

  const handleBiometricToggle = async (value: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert(t.common.error, 'Biometrische authenticatie is niet beschikbaar op web');
      return;
    }

    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert(t.common.error, 'Dit apparaat ondersteunt geen biometrische authenticatie');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert(t.common.error, 'Geen biometrische data gevonden. Stel eerst vingerafdruk of gezichtsherkenning in op je apparaat');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifieer je identiteit',
      });

      if (result.success) {
        await setBiometricEnabled(true);
      }
    } else {
      await setBiometricEnabled(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: "OneBand",
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{t.settings.title}</Text>
          <Text style={styles.subtitle}>{t.settings.subtitle}</Text>
          
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{t.settings.language}</Text>
            <Text style={styles.sectionDescription}>{t.settings.languageDescription}</Text>
            
            <View style={styles.languageOptions}>
              <TouchableOpacity 
                style={[
                  styles.languageButton, 
                  language === 'nl' && styles.languageButtonActive
                ]}
                onPress={() => setLanguage('nl')}
              >
                <Text style={[
                  styles.languageButtonText,
                  language === 'nl' && styles.languageButtonTextActive
                ]}>
                  🇳🇱 {t.settings.dutch}
                </Text>
                {language === 'nl' && <ChevronRight size={20} color={Colors.light.tint} />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.languageButton, 
                  language === 'en' && styles.languageButtonActive
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[
                  styles.languageButtonText,
                  language === 'en' && styles.languageButtonTextActive
                ]}>
                  🇬🇧 {t.settings.english}
                </Text>
                {language === 'en' && <ChevronRight size={20} color={Colors.light.tint} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{t.settings.security}</Text>
            <Text style={styles.sectionDescription}>{t.settings.biometricDescription}</Text>
            
            <View style={styles.biometricOption}>
              <View style={styles.biometricInfo}>
                <View style={styles.biometricIconContainer}>
                  <Fingerprint size={24} color={Colors.light.tint} strokeWidth={2} />
                </View>
                <View style={styles.biometricTextContainer}>
                  <Text style={styles.biometricTitle}>{t.settings.biometricLogin}</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: Colors.light.mutedLight, true: Colors.light.tint }}
                thumbColor="#fff"
              />
            </View>
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
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    marginBottom: 32,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 16,
  },
  languageOptions: {
    gap: 12,
  },
  languageButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  languageButtonActive: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tint + "10",
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  languageButtonTextActive: {
    color: Colors.light.tint,
  },
  biometricOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  biometricInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    gap: 12,
  },
  biometricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint + "20",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  biometricTextContainer: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
});
