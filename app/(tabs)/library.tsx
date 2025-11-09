import React, { useState, useMemo } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Folder, Video, Image as ImageIcon, ChevronRight, ArrowLeft, X, HardDrive } from "lucide-react-native";
import { Stack } from "expo-router";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';

type MediaItem = {
  id: string;
  name: string;
  path: string;
  folder_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
};

type FolderItem = {
  name: string;
  path: string;
  itemCount: number;
};

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [currentPath, setCurrentPath] = useState<string>("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const mediaQuery = trpc.media.getMediaList.useQuery({ folderPath: currentPath });
  const foldersQuery = trpc.media.getFolders.useQuery();
  const storageQuery = trpc.media.getStorageUsage.useQuery();

  const folders = useMemo<FolderItem[]>(() => {
    if (!foldersQuery.data) return [];
    
    const folderMap = new Map<string, number>();
    
    foldersQuery.data.forEach((folderPath) => {
      if (currentPath && !folderPath.startsWith(currentPath + '/')) {
        return;
      }
      
      if (currentPath === '' && folderPath.includes('/')) {
        const firstFolder = folderPath.split('/')[0];
        folderMap.set(firstFolder, (folderMap.get(firstFolder) || 0) + 1);
      } else if (currentPath && folderPath.startsWith(currentPath + '/')) {
        const remaining = folderPath.substring(currentPath.length + 1);
        if (remaining.includes('/')) {
          const nextFolder = remaining.split('/')[0];
          const fullPath = currentPath + '/' + nextFolder;
          folderMap.set(fullPath, (folderMap.get(fullPath) || 0) + 1);
        }
      } else if (currentPath === '' && !folderPath.includes('/')) {
        folderMap.set(folderPath, 0);
      }
    });
    
    const mediaData = mediaQuery.data as MediaItem[] | undefined;
    
    mediaData?.forEach((item) => {
      if (item.folder_path.startsWith(currentPath)) {
        const remaining = item.folder_path.substring(currentPath ? currentPath.length + 1 : 0);
        const parts = remaining.split('/').filter(Boolean);
        
        if (parts.length > 0) {
          const nextFolder = currentPath ? currentPath + '/' + parts[0] : parts[0];
          folderMap.set(nextFolder, (folderMap.get(nextFolder) || 0) + 1);
        }
      }
    });
    
    return Array.from(folderMap.entries()).map(([path, count]) => ({
      name: path.split('/').pop() || path,
      path,
      itemCount: count,
    }));
  }, [foldersQuery.data, mediaQuery.data, currentPath]);

  const mediaItems = useMemo<MediaItem[]>(() => {
    const mediaData = mediaQuery.data as MediaItem[] | undefined;
    return mediaData?.filter((item) => item.folder_path === currentPath) || [];
  }, [mediaQuery.data, currentPath]);

  const breadcrumbText = useMemo(() => {
    if (!currentPath) return '';
    return currentPath.split('/').join(' > ');
  }, [currentPath]);

  const handleBack = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleOpenMedia = (media: MediaItem) => {
    setSelectedMedia(media);
    setShowVideoPlayer(true);
  };

  type Item = { kind: "folder"; folder: FolderItem } | { kind: "media"; media: MediaItem };
  const items: Item[] = [
    ...folders.map((f) => ({ kind: "folder" as const, folder: f })),
    ...mediaItems.map((m) => ({ kind: "media" as const, media: m })),
  ];

  const isLoading = mediaQuery.isLoading || foldersQuery.isLoading;

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: "WAKA RHYTHMZ",
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
      <View style={styles.container} testID="library-screen">
        <LinearGradient 
          colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
          style={styles.headerBg} 
          locations={[0, 0.3, 1]}
        />
        
        <View style={styles.header}>
          <Text style={styles.appName}>WAKA RHYTHMZ</Text>
          <Text style={styles.title}>Bibliotheek</Text>
          {breadcrumbText && (
            <Text style={styles.breadcrumb}>{breadcrumbText}</Text>
          )}
        </View>

        {storageQuery.data && storageQuery.data.usageGB !== undefined && (
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <HardDrive color={Colors.light.primary} size={20} strokeWidth={2.5} />
              <Text style={styles.storageTitle}>Opslag</Text>
            </View>
            <View style={styles.storageMeter}>
              <View style={styles.storageBar}>
                <LinearGradient
                  colors={
                    storageQuery.data.percentage > 90
                      ? ['#DC2626', '#991B1B']
                      : storageQuery.data.percentage > 75
                      ? ['#F59E0B', '#D97706']
                      : [Colors.light.primary, Colors.light.primaryDark]
                  }
                  style={[
                    styles.storageBarFill,
                    { width: `${Math.min(storageQuery.data.percentage || 0, 100)}%` as any }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.storageText}>
                {storageQuery.data.usageGB || 0} GB / {storageQuery.data.maxGB || 100} GB ({storageQuery.data.percentage || 0}%)
              </Text>
            </View>
          </View>
        )}

        {currentPath && (
          <Pressable 
            onPress={handleBack} 
            style={styles.backButton} 
            testID="breadcrumb-back"
          >
            <ArrowLeft color={Colors.light.primary} size={20} strokeWidth={2.5} />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, index) => 
              item.kind === "folder" ? `folder-${item.folder.path}` : `media-${item.media.id}`
            }
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
            renderItem={({ item }) => {
              if (item.kind === "folder") {
                return (
                  <TouchableOpacity 
                    style={styles.card} 
                    onPress={() => setCurrentPath(item.folder.path)}
                    testID={`folder-${item.folder.path}`}
                  >
                    <View style={styles.iconContainer}>
                      <Folder color={Colors.light.primary} size={28} strokeWidth={2} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{item.folder.name}</Text>
                      <Text style={styles.cardMeta}>{item.folder.itemCount} items</Text>
                    </View>
                    <ChevronRight color={Colors.light.muted} size={20} />
                  </TouchableOpacity>
                );
              }
              
              const Icon = item.media.file_type === 'video' ? Video : ImageIcon;
              return (
                <Pressable 
                  style={styles.card} 
                  onPress={() => handleOpenMedia(item.media)} 
                  testID={`media-${item.media.id}`}
                >
                  <View style={[styles.iconContainer, styles.mediaIcon]}>
                    <Icon color={Colors.light.text} size={24} strokeWidth={2} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.media.name}</Text>
                    <Text style={styles.cardMeta}>
                      {item.media.file_type.toUpperCase()} • {(item.media.file_size / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                  </View>
                  <View style={styles.playBadge}>
                    <Text style={styles.playBadgeText}>▶</Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}

        <Modal
          visible={showFolderModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowFolderModal(false);
            setFolderName("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nieuwe Map</Text>
                <Pressable onPress={() => {
                  setShowFolderModal(false);
                  setFolderName("");
                }} testID="close-folder-modal">
                  <X color={Colors.light.muted} size={24} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mapnaam</Text>
                <TextInput
                  style={styles.input}
                  value={folderName}
                  onChangeText={setFolderName}
                  placeholder="Voer mapnaam in"
                  placeholderTextColor={Colors.light.muted}
                  autoFocus
                  testID="folder-name-input"
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setShowFolderModal(false);
                    setFolderName("");
                  }}
                  testID="cancel-folder-button"
                >
                  <Text style={styles.cancelButtonText}>Annuleren</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.actionButton, styles.createButton, !folderName.trim() && styles.disabledButton]}
                  onPress={() => {
                    if (folderName.trim()) {
                      setShowFolderModal(false);
                      setFolderName("");
                    }
                  }}
                  disabled={!folderName.trim()}
                  testID="create-folder-button"
                >
                  <LinearGradient
                    colors={folderName.trim() ? [Colors.light.primary, Colors.light.primaryDark] : [Colors.light.surfaceLight, Colors.light.surfaceLight]}
                    style={styles.createButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.createButtonText, !folderName.trim() && styles.disabledButtonText]}>Aanmaken</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {showVideoPlayer && selectedMedia && (
          <MediaPlayerModal
            media={selectedMedia}
            visible={showVideoPlayer}
            onClose={() => {
              setShowVideoPlayer(false);
              setSelectedMedia(null);
            }}
          />
        )}

        <MenuModal 
          visible={showMenuModal} 
          onClose={() => setShowMenuModal(false)}
        />
      </View>
    </>
  );
}

function MediaPlayerModal({ media, visible, onClose }: { media: MediaItem; visible: boolean; onClose: () => void }) {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);

  React.useEffect(() => {
    const getUrl = async () => {
      setIsLoadingUrl(true);
      const { data } = supabase.storage
        .from('media-library')
        .getPublicUrl(media.storage_path);
      
      setMediaUrl(data.publicUrl);
      setIsLoadingUrl(false);
    };
    
    if (visible) {
      getUrl();
    }
  }, [visible, media.storage_path]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.playerModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{media.name}</Text>
            <Pressable onPress={onClose} testID="close-player-modal">
              <X color={Colors.light.muted} size={24} />
            </Pressable>
          </View>

          {isLoadingUrl ? (
            <View style={styles.playerLoading}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : (
            <View style={styles.playerContainer}>
              {media.file_type === 'video' ? (
                <ExpoVideo
                  source={{ uri: mediaUrl }}
                  style={styles.video}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                />
              ) : (
                <Image
                  source={{ uri: mediaUrl }}
                  style={styles.image}
                  contentFit="contain"
                />
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
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
    paddingBottom: 16
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
  breadcrumb: { 
    color: Colors.light.muted, 
    marginTop: 8, 
    fontSize: 13,
    fontWeight: "500" as const,
  },
  storageCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  storageTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  storageMeter: {
    gap: 8,
  },
  storageBar: {
    height: 8,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  storageText: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  backButton: { 
    marginHorizontal: 20, 
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  backText: { 
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: Colors.light.darkGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  mediaIcon: {
    backgroundColor: Colors.light.primary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  playerModalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 600,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '800' as const,
    flex: 1,
    marginRight: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: Colors.light.darkGray,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  createButton: {
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: Colors.light.muted,
  },
  playerContainer: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerLoading: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerPlaceholder: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  playerUrl: {
    color: Colors.light.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: Colors.light.darkGray,
  },
});
