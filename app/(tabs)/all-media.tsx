import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View, Pressable, RefreshControl } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState, MediaLibraryItem } from "@/providers/AppState";
import { Video, Image as ImageIcon, Music, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AudioPlayerModal from "@/components/AudioPlayerModal";
import { supabase } from "@/lib/supabase";

export default function AllMediaScreen() {
  const { mediaLibrary, syncAllData } = useAppState();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [audioModalVisible, setAudioModalVisible] = useState<boolean>(false);
  const [selectedAudio, setSelectedAudio] = useState<{ uri: string; title: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const getDisplayName = useCallback((item: MediaLibraryItem): string => {
    const raw = (item.name ?? "").trim();
    if (raw.length > 0 && raw !== "undefined" && raw !== "null") {
      return raw;
    }

    const p = (item.path ?? "").trim() || (item.storage_path ?? "").trim();
    const last = p.split("/").filter(Boolean).pop() ?? "Media";
    const decoded = (() => {
      try {
        return decodeURIComponent(last);
      } catch {
        return last;
      }
    })();
    return decoded;
  }, []);

  const recentMedia = useMemo(() => {
    return mediaLibrary
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  }, [mediaLibrary]);

  const onRefresh = useCallback(async () => {
    console.log("🔄 [RECENT_MEDIA_LIST] Pull-to-refresh starting...");
    setIsRefreshing(true);
    try {
      await syncAllData();
      console.log("✅ [RECENT_MEDIA_LIST] Pull-to-refresh done");
    } catch (error) {
      console.error("❌ [RECENT_MEDIA_LIST] Pull-to-refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [syncAllData]);

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return Video;
      case "image":
        return ImageIcon;
      case "audio":
        return Music;
      default:
        return Music;
    }
  };

  const handleMediaPress = (item: MediaLibraryItem) => {
    if (item.file_type === 'audio') {
      const { data } = supabase.storage
        .from('media-library')
        .getPublicUrl(item.storage_path);
      setSelectedAudio({ uri: data.publicUrl, title: item.name });
      setAudioModalVisible(true);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="all-media-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.3, 1]}
      />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} testID="recent-media-back">
          <ArrowLeft color={Colors.light.primary} size={24} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.appName}>Waka Rythmz</Text>
          <Text style={styles.title}>Recente Media</Text>
          <Text style={styles.subtitle}>{recentMedia.length} items</Text>
        </View>

      </View>

      <FlatList
        data={recentMedia}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        renderItem={({ item }) => {
          const Icon = getIcon(item.file_type);
          const displayName = getDisplayName(item);

          return (
            <Pressable style={styles.card} testID={`recent-media-${item.id}`} onPress={() => handleMediaPress(item)}>
              <View style={styles.iconContainer}>
                <Icon color={Colors.light.text} size={24} strokeWidth={2} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {displayName}
                </Text>
                <Text style={styles.cardMeta}>{item.file_type.toUpperCase()}</Text>
                <Text style={styles.folderPath} numberOfLines={1}>
                  {item.folder_path || "Root"}
                </Text>
              </View>
              {item.file_type === "audio" && (
                <View style={styles.playBadge}>
                  <Text style={styles.playBadgeText}>▶</Text>
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Geen recente media gevonden</Text>
          </View>
        }
      />

      {selectedAudio && (
        <AudioPlayerModal
          visible={audioModalVisible}
          audioUri={selectedAudio.uri}
          audioTitle={selectedAudio.title}
          onClose={() => {
            setAudioModalVisible(false);
            setSelectedAudio(null);
          }}
        />
      )}
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
    gap: 12 
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: { 
    color: Colors.light.text, 
    fontSize: 17, 
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  cardMeta: { 
    color: Colors.light.muted, 
    fontSize: 13,
    fontWeight: "500" as const,
    marginBottom: 4,
  },
  folderPath: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: "600" as const,
  },
  playBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  playBadgeText: {
    color: Colors.light.text,
    fontSize: 12,
    marginLeft: 2,
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
