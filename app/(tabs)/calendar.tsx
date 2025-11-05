import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/providers/AppState";
import { Calendar as CalendarIcon, MapPin, Users } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function CalendarScreen() {
  const { events } = useAppState();
  const insets = useSafeAreaInsets();
  
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.startsAt).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="calendar-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.25, 1]}
      />
      
      <View style={styles.header}>
        <Text style={styles.appName}>WAKA RHYTHMZ</Text>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>{events.length} komende evenementen</Text>
      </View>

      <FlatList
        data={Object.keys(groupedEvents)}
        keyExtractor={(date) => date}
        contentContainerStyle={styles.list}
        renderItem={({ item: date }) => (
          <View style={styles.dateSection}>
            <View style={styles.dateHeader}>
              <CalendarIcon color={Colors.light.primary} size={20} strokeWidth={2.5} />
              <Text style={styles.dateText}>{date}</Text>
            </View>
            
            {groupedEvents[date].map((event) => (
              <View key={event.id} style={styles.card}>
                <View style={styles.timeMarker} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{event.title}</Text>
                  {event.description && (
                    <Text style={styles.description}>{event.description}</Text>
                  )}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin color={Colors.light.muted} size={14} strokeWidth={2} />
                      <Text style={styles.metaText}>
                        {new Date(event.startsAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Users color={Colors.light.muted} size={14} strokeWidth={2} />
                      <Text style={styles.metaText}>Alle leden</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      />
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
    paddingBottom: 24 
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
  list: { 
    padding: 20, 
    paddingTop: 0,
    gap: 24 
  },
  dateSection: {
    gap: 12,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 4,
  },
  dateText: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: "700" as const,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 0,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    flexDirection: "row",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  timeMarker: {
    width: 4,
    backgroundColor: Colors.light.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: { 
    color: Colors.light.text, 
    fontSize: 18, 
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  description: {
    color: Colors.light.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: { 
    color: Colors.light.muted, 
    fontSize: 13,
    fontWeight: "600" as const,
  },
});
