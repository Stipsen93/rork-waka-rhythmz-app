import React from "react";
import { FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "@/providers/AppState";
import { Calendar, Video, Image as ImageIcon, Music, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function AllAssignmentsScreen() {
  const { assignments } = useAppState();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const getMediaIcon = (mediaType?: 'video' | 'image' | 'audio') => {
    if (!mediaType) return null;
    
    switch (mediaType) {
      case "video":
        return Video;
      case "image":
        return ImageIcon;
      case "audio":
        return Music;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="all-assignments-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.3, 1]}
      />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/(tabs)/assignments")} style={styles.backButton}>
          <ArrowLeft color={Colors.light.primary} size={24} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.appName}>OneBand</Text>
          <Text style={styles.title}>Huiswerkopdrachten</Text>
          <Text style={styles.subtitle}>{assignments.length} opdrachten</Text>
        </View>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => {
          const MediaIcon = getMediaIcon(item.mediaType);
          
          return (
            <Pressable style={styles.widget} testID={`assignment-${item.id}`}>
              <View style={styles.widgetHeader}>
                {MediaIcon && (
                  <View style={styles.mediaIconContainer}>
                    <MediaIcon color={Colors.light.text} size={22} strokeWidth={2.5} />
                  </View>
                )}
                <Text style={styles.widgetTitle}>{item.title}</Text>
              </View>
              
              <View style={styles.widgetContent}>
                <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
                
                {item.dueDate && (
                  <View style={styles.deadlineContainer}>
                    <Calendar color={Colors.light.muted} size={16} strokeWidth={2} />
                    <Text style={styles.deadlineText}>
                      Deadline: {new Date(item.dueDate).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                )}
                
                {item.submissions.length > 0 && (
                  <View style={styles.submissionBadge}>
                    <Text style={styles.submissionText}>
                      {item.submissions.length} inzending{item.submissions.length !== 1 ? 'en' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Geen huiswerkopdrachten beschikbaar</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background 
  },
  headerBg: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 240,
    opacity: 0.4,
  },
  header: { 
    paddingTop: 32, 
    paddingHorizontal: 20, 
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  backButton: {
    paddingTop: 8,
  },
  headerTextContainer: {
    flex: 1,
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
    gap: 16 
  },
  widget: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  mediaIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  widgetTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "700" as const,
    flex: 1,
  },
  widgetContent: {
    gap: 12,
  },
  description: {
    color: Colors.light.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500" as const,
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.darkGray,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  deadlineText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  submissionBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  submissionText: {
    color: Colors.light.text,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: Colors.light.muted,
    fontSize: 16,
    fontStyle: "italic" as const,
  },
});
