import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useState } from "react";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { useAppState } from "@/providers/AppState";
import { translations } from "@/constants/translations";
import { ChevronRight } from "lucide-react-native";

export default function InstellingenScreen() {
  const insets = useSafeAreaInsets();
  const [showMenuModal, setShowMenuModal] = useState<boolean>(false);
  const { language, setLanguage } = useAppState();
  const t = translations[language];

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
});
