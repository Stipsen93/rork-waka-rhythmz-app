import React from "react";
import { FlatList, StyleSheet, Text, View, Pressable } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState, MediaItem, CategoryNode } from "@/providers/AppState";
import { Video, Image as ImageIcon, Music, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

interface MediaWithFolder {
  media: MediaItem;
  folderPath: string;
}

export default function AllMediaScreen() {
  const { library } = useAppState();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const getAllMediaWithFolders = (): MediaWithFolder[] => {
    const result: MediaWithFolder[] = [];
    
    const traverse = (nodes: CategoryNode[], path: string[]) => {
      for (const node of nodes) {
        const currentPath = [...path, node.name];
        if (node.media) {
          for (const media of node.media) {
            result.push({
              media,
              folderPath: currentPath.join(" > "),
            });
          }
        }
        if (node.children) {
          traverse(node.children, currentPath);
        }
      }
    };
    
    traverse(library, []);
    return result;
  };

  const allMedia = getAllMediaWithFolders();

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return Video;
      case "image":
        return ImageIcon;
      default:
        return Music;
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
        <Pressable onPress={() => router.push("/(tabs)/assignments")} style={styles.backButton}>
          <ArrowLeft color={Colors.light.primary} size={24} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.appName}>WAKA RHYTHMZ</Text>
          <Text style={styles.title}>Alle Media</Text>
          <Text style={styles.subtitle}>{allMedia.length} items</Text>
        </View>
      </View>

      <FlatList
        data={allMedia}
        keyExtractor={(item) => item.media.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => {
          const Icon = getIcon(item.media.type);
          return (
            <Pressable style={styles.card} testID={`media-${item.media.id}`}>
              <View style={styles.iconContainer}>
                <Icon color={Colors.light.text} size={24} strokeWidth={2} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.media.title}</Text>
                <Text style={styles.cardMeta}>{item.media.type.toUpperCase()}</Text>
                <Text style={styles.folderPath} numberOfLines={1}>{item.folderPath}</Text>
              </View>
              <View style={styles.playBadge}>
                <Text style={styles.playBadgeText}>▶</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Geen media beschikbaar</Text>
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
