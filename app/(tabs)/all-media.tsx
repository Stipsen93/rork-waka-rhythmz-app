import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View, Pressable, RefreshControl } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState, MediaLibraryItem } from "@/providers/AppState";
import { Video, Image as ImageIcon, Music, ArrowLeft, Trash2, Check, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AudioPlayerModal from "@/components/AudioPlayerModal";
import VideoPlayerModal from "@/components/VideoPlayerModal";
import ImageViewerModal from "@/components/ImageViewerModal";
import { supabase } from "@/lib/supabase";

export default function AllMediaScreen() {
  const { mediaLibrary, syncAllData, currentUser, clearRecentMediaList, hideRecentMediaItems } = useAppState();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [audioModalVisible, setAudioModalVisible] = useState<boolean>(false);
  const [selectedAudio, setSelectedAudio] = useState<{ uri: string; title: string } | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState<boolean>(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set<string>());
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const isAdmin = currentUser?.role === "admin";

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
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return mediaLibrary
      .slice()
      .filter((m) => {
        const ts = new Date(m.created_at).getTime();
        return Number.isFinite(ts) && ts >= oneWeekAgo;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  }, [mediaLibrary]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set<string>());
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set<string>(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const confirmClearAll = useCallback(() => {
    if (!isAdmin) {
      return;
    }

    Alert.alert(
      "Recente media wissen",
      "Weet je zeker dat je de lijst met recente media wilt wissen?",
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Wissen",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🧹 [RECENT_MEDIA_LIST] Admin clear all");
              await clearRecentMediaList();
            } catch (error) {
              console.error("❌ [RECENT_MEDIA_LIST] clearRecentMediaList error:", error);
              Alert.alert("Fout", "Wissen is mislukt. Probeer opnieuw.");
            }
          },
        },
      ]
    );
  }, [clearRecentMediaList, isAdmin]);

  const confirmDeleteSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      return;
    }

    Alert.alert(
      "Verwijderen",
      `Weet je zeker dat je ${ids.length} item(s) uit de lijst wilt verwijderen?`,
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: async () => {
            setIsBulkDeleting(true);
            try {
              console.log("🧹 [RECENT_MEDIA_LIST] Hiding selected items:", ids);
              await hideRecentMediaItems(ids);
              exitSelectionMode();
            } catch (error) {
              console.error("❌ [RECENT_MEDIA_LIST] hideRecentMediaItems error:", error);
              Alert.alert("Fout", "Verwijderen is mislukt. Probeer opnieuw.");
            } finally {
              setIsBulkDeleting(false);
            }
          },
        },
      ]
    );
  }, [exitSelectionMode, hideRecentMediaItems, selectedIds]);

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

  const handleMediaPress = useCallback((item: MediaLibraryItem) => {
    if (selectionMode) {
      toggleSelected(item.id);
      return;
    }

    const storagePath = (item.storage_path ?? "").trim();
    if (!storagePath) {
      console.warn("⚠️ [RECENT_MEDIA_LIST] Missing storage_path for item", { id: item.id, item });
      Alert.alert("Fout", "Dit bestand kan niet worden geopend (pad ontbreekt).");
      return;
    }

    const { data } = supabase.storage.from('media-library').getPublicUrl(storagePath);
    const publicUrl = data?.publicUrl;

    if (!publicUrl) {
      console.warn("⚠️ [RECENT_MEDIA_LIST] Missing publicUrl for item", { id: item.id, storagePath, data });
      Alert.alert("Fout", "Dit bestand kan niet worden geopend (URL ontbreekt).");
      return;
    }

    console.log("▶️ [RECENT_MEDIA_LIST] Opening media", { id: item.id, type: item.file_type, publicUrl });

    if (item.file_type === 'audio') {
      setSelectedAudio({ uri: publicUrl, title: getDisplayName(item) });
      setAudioModalVisible(true);
      return;
    }

    if (item.file_type === 'video') {
      setSelectedVideoUrl(publicUrl);
      setVideoModalVisible(true);
      return;
    }

    if (item.file_type === 'image') {
      setSelectedImageUrl(publicUrl);
      setImageModalVisible(true);
      return;
    }

    Alert.alert("Niet ondersteund", "Dit bestandstype kan niet worden geopend.");
  }, [getDisplayName, selectionMode, toggleSelected]);

  const handleMediaLongPress = useCallback((item: MediaLibraryItem) => {
    console.log("⏱️ [RECENT_MEDIA_LIST] Long press:", item.id);
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set<string>([item.id]));
      return;
    }
    toggleSelected(item.id);
  }, [selectionMode, toggleSelected]);

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="all-media-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.3, 1]}
      />
      
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (selectionMode) {
              exitSelectionMode();
              return;
            }
            router.back();
          }}
          style={styles.backButton}
          testID="recent-media-back"
        >
          <ArrowLeft color={Colors.light.primary} size={24} strokeWidth={2.5} />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.appName}>Waka Rythmz</Text>
          <Text style={styles.title}>Recente Media</Text>
          <Text style={styles.subtitle}>
            {selectionMode ? `${selectedIds.size} geselecteerd` : `${recentMedia.length} items`}
          </Text>
        </View>

        {isAdmin && !selectionMode && (
          <Pressable
            onPress={confirmClearAll}
            style={styles.headerIconButton}
            testID="recent-media-clear-all"
          >
            <Trash2 color={Colors.light.text} size={22} strokeWidth={2.5} />
          </Pressable>
        )}

        {selectionMode && (
          <View style={styles.selectionHeaderActions}>
            <Pressable
              onPress={exitSelectionMode}
              style={[styles.headerIconButton, styles.headerIconButtonSecondary]}
              testID="recent-media-exit-selection"
            >
              <X color={Colors.light.text} size={22} strokeWidth={2.5} />
            </Pressable>

            <Pressable
              onPress={confirmDeleteSelected}
              disabled={selectedIds.size === 0 || isBulkDeleting}
              style={[
                styles.headerIconButton,
                selectedIds.size === 0 || isBulkDeleting ? styles.headerIconButtonDisabled : styles.headerIconButtonDanger,
              ]}
              testID="recent-media-delete-selected"
            >
              <Trash2 color={Colors.light.text} size={22} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}
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
          const isSelected = selectedIds.has(item.id);

          return (
            <Pressable
              style={[styles.card, selectionMode && styles.cardSelectable, isSelected && styles.cardSelected]}
              testID={`recent-media-${item.id}`}
              onPress={() => handleMediaPress(item)}
              onLongPress={() => handleMediaLongPress(item)}
              delayLongPress={250}
            >
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

              {selectionMode ? (
                <View style={[styles.selectPill, isSelected ? styles.selectPillSelected : styles.selectPillUnselected]}>
                  {isSelected ? (
                    <Check color={Colors.light.text} size={16} strokeWidth={3} />
                  ) : (
                    <View style={styles.selectDot} />
                  )}
                </View>
              ) : item.file_type === "audio" ? (
                <View style={styles.playBadge}>
                  <Text style={styles.playBadgeText}>▶</Text>
                </View>
              ) : null}
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

      {selectedVideoUrl && (
        <VideoPlayerModal
          visible={videoModalVisible}
          videoUrl={selectedVideoUrl}
          onClose={() => {
            setVideoModalVisible(false);
            setSelectedVideoUrl(null);
          }}
        />
      )}

      {selectedImageUrl && (
        <ImageViewerModal
          visible={imageModalVisible}
          imageUrl={selectedImageUrl}
          onClose={() => {
            setImageModalVisible(false);
            setSelectedImageUrl(null);
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
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  headerIconButtonSecondary: {
    backgroundColor: Colors.light.surface,
  },
  headerIconButtonDanger: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  headerIconButtonDisabled: {
    opacity: 0.5,
  },
  selectionHeaderActions: {
    flexDirection: "row",
    gap: 10,
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
  cardSelectable: {
    borderColor: Colors.light.primary,
  },
  cardSelected: {
    borderColor: Colors.light.primary,
    shadowOpacity: 0.18,
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
  selectPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  selectPillSelected: {
    backgroundColor: Colors.light.primary,
  },
  selectPillUnselected: {
    backgroundColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  selectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.muted,
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
