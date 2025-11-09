import React, { useState, useMemo } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Folder, Video, Image as ImageIcon, ChevronRight, ArrowLeft, X, HardDrive, Plus, Upload } from "lucide-react-native";
import { Stack } from "expo-router";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { supabase } from "@/lib/supabase";
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import { useAppState } from "@/providers/AppState";

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
  isUploading?: boolean;
  uploadProgress?: number;
};

type FolderItem = {
  name: string;
  path: string;
  itemCount: number;
  isCreating?: boolean;
};

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const appState = useAppState();
  const [currentPath, setCurrentPath] = useState<string>("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, MediaItem>>(new Map());
  const [creatingFolders, setCreatingFolders] = useState<Map<string, FolderItem>>(new Map());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const folders = useMemo<FolderItem[]>(() => {
    const creatingFoldersList = Array.from(creatingFolders.values());
    const allFolderPaths = appState.getFolders();
    
    const folderMap = new Map<string, number>();
    
    allFolderPaths.forEach((folderPath) => {
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
    
    const mediaInFolders = appState.mediaLibrary;
    
    mediaInFolders.forEach((item) => {
      if (item.folder_path.startsWith(currentPath)) {
        const remaining = item.folder_path.substring(currentPath ? currentPath.length + 1 : 0);
        const parts = remaining.split('/').filter(Boolean);
        
        if (parts.length > 0) {
          const nextFolder = currentPath ? currentPath + '/' + parts[0] : parts[0];
          folderMap.set(nextFolder, (folderMap.get(nextFolder) || 0) + 1);
        }
      }
    });
    
    const existingFolders = Array.from(folderMap.entries()).map(([path, count]) => ({
      name: path.split('/').pop() || path,
      path,
      itemCount: count,
    }));
    
    return [...creatingFoldersList, ...existingFolders];
  }, [appState.mediaLibrary, currentPath, creatingFolders, appState]);

  const mediaItems = useMemo<MediaItem[]>(() => {
    const uploadingList = Array.from(uploadingFiles.values()).filter(
      (item) => item.folder_path === currentPath
    );
    const existingMedia = appState.getMediaInFolder(currentPath).map(m => ({
      id: m.id,
      name: m.name,
      path: m.path,
      folder_path: m.folder_path,
      file_type: m.file_type,
      file_size: m.file_size,
      mime_type: m.mime_type,
      storage_path: m.storage_path,
      created_at: m.created_at,
    }));
    return [...uploadingList, ...existingMedia];
  }, [appState, currentPath, uploadingFiles]);

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

  const handleUploadMedia = async () => {
    setShowActionSheet(false);
    setErrorMessage(null);
    
    try {
      console.log('[CLIENT] Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*', 'image/*', 'audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('[CLIENT] User canceled document picker');
        return;
      }

      const file = result.assets[0];
      console.log('[CLIENT] File selected:', file.name, file.mimeType, file.size);

      let fileType = 'other';
      if (file.mimeType?.startsWith('video/')) fileType = 'video';
      else if (file.mimeType?.startsWith('image/')) fileType = 'image';
      else if (file.mimeType?.startsWith('audio/')) fileType = 'audio';

      const tempId = `temp_${Date.now()}_${file.name}`;
      const uploadingItem: MediaItem = {
        id: tempId,
        name: file.name,
        path: '',
        folder_path: currentPath,
        file_type: fileType,
        file_size: file.size || 0,
        mime_type: file.mimeType || 'application/octet-stream',
        storage_path: '',
        created_at: new Date().toISOString(),
        isUploading: true,
        uploadProgress: 20,
      };

      console.log('[CLIENT] Adding to uploading list...');
      setUploadingFiles((prev) => {
        const next = new Map(prev);
        next.set(file.name, uploadingItem);
        return next;
      });
      setIsUploading(true);

      console.log('[CLIENT] Reading file data...');
      let base64Data = '';
      try {
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`Fetch failed: ${response.status}`);
        }
        const blob = await response.blob();
        
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            console.log('[CLIENT] File read successfully, base64 length:', base64.length);
            resolve(base64);
          };
          reader.onerror = () => {
            console.error('[CLIENT] FileReader error:', reader.error);
            reject(new Error('FileReader error'));
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('[CLIENT] Error reading file:', error);
        setUploadingFiles((prev) => {
          const next = new Map(prev);
          next.delete(file.name);
          return next;
        });
        setIsUploading(false);
        throw new Error('Kon bestand niet lezen. Controleer bestandsrechten.');
      }

      setUploadingFiles((prev) => {
        const next = new Map(prev);
        const item = next.get(file.name);
        if (item) {
          next.set(file.name, { ...item, uploadProgress: 60 });
        }
        return next;
      });

      console.log('[CLIENT] Uploading to Supabase via AppState...');
      await appState.uploadMedia({
        name: file.name,
        folderPath: currentPath,
        fileType,
        fileSize: file.size || 0,
        mimeType: file.mimeType || 'application/octet-stream',
        base64Data,
      });
      
      setUploadingFiles((prev) => {
        const next = new Map(prev);
        next.delete(file.name);
        return next;
      });
      setIsUploading(false);
      
      await appState.refreshStorageUsage();
      
      console.log('[CLIENT] Upload successful!');
    } catch (error: any) {
      console.error('[CLIENT] Upload error:', error);
      setIsUploading(false);
      const message = error?.message || error?.toString() || 'Onbekende fout opgetreden';
      setErrorMessage(`Upload fout: ${message}`);
      setTimeout(() => setErrorMessage(null), 8000);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    
    const newFolderPath = currentPath ? `${currentPath}/${folderName.trim()}` : folderName.trim();
    const tempFolder: FolderItem = {
      name: folderName.trim(),
      path: newFolderPath,
      itemCount: 0,
      isCreating: true,
    };
    
    setCreatingFolders((prev) => {
      const next = new Map(prev);
      next.set(newFolderPath, tempFolder);
      return next;
    });
    
    setShowFolderModal(false);
    setFolderName("");
    
    try {
      await appState.createFolder(newFolderPath);
      setCreatingFolders((prev) => {
        const next = new Map(prev);
        next.delete(newFolderPath);
        return next;
      });
    } catch (error: any) {
      console.error('Create folder error:', error);
      setCreatingFolders((prev) => {
        const next = new Map(prev);
        next.delete(newFolderPath);
        return next;
      });
      const message = error?.message || 'Onbekende fout bij folder aanmaken';
      setErrorMessage(`Folder aanmaken mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  type Item = { kind: "folder"; folder: FolderItem } | { kind: "media"; media: MediaItem };
  const items: Item[] = [
    ...folders.map((f) => ({ kind: "folder" as const, folder: f })),
    ...mediaItems.map((m) => ({ kind: "media" as const, media: m })),
  ];

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
          {breadcrumbText ? (
            <Text style={styles.breadcrumb}>{breadcrumbText}</Text>
          ) : null}
        </View>

        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <HardDrive color={Colors.light.primary} size={22} strokeWidth={2.5} />
            <Text style={styles.storageTitle}>Opslag</Text>
          </View>
          {!appState.storageUsage ? (
            <View style={styles.storageLoading}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
            </View>
          ) : (
            <View style={styles.storageMeter}>
              <View style={styles.storageBar}>
                <LinearGradient
                  colors={
                    (appState.storageUsage.percentage || 0) > 90
                      ? ['#DC2626', '#991B1B']
                      : (appState.storageUsage.percentage || 0) > 75
                      ? ['#F59E0B', '#D97706']
                      : [Colors.light.primary, Colors.light.primaryDark]
                  }
                  style={[
                    styles.storageBarFill,
                    { width: `${Math.min(appState.storageUsage.percentage || 0, 100)}%` }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <View style={styles.storageTextRow}>
                <Text style={styles.storageText}>
                  {(appState.storageUsage.usageGB || 0).toFixed(2)} GB gebruikt
                </Text>
                <Text style={styles.storageTextSecondary}>
                  van {appState.storageUsage.maxGB || 0} GB
                </Text>
              </View>
            </View>
          )}
        </View>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => setErrorMessage(null)} style={styles.errorClose}>
              <X color={Colors.light.text} size={16} strokeWidth={2.5} />
            </Pressable>
          </View>
        ) : null}

        {currentPath ? (
          <Pressable 
            onPress={handleBack} 
            style={styles.backButton} 
            testID="breadcrumb-back"
          >
            <ArrowLeft color={Colors.light.primary} size={20} strokeWidth={2.5} />
            <Text style={styles.backText}>Terug</Text>
          </Pressable>
        ) : null}

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
                  style={[styles.card, item.folder.isCreating && styles.cardCreating]} 
                  onPress={() => !item.folder.isCreating && setCurrentPath(item.folder.path)}
                  disabled={item.folder.isCreating}
                  testID={`folder-${item.folder.path}`}
                >
                  <View style={styles.iconContainer}>
                    {item.folder.isCreating ? (
                      <ActivityIndicator size="small" color={Colors.light.primary} />
                    ) : (
                      <Folder color={Colors.light.primary} size={28} strokeWidth={2} />
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.folder.name}</Text>
                    <Text style={styles.cardMeta}>
                      {item.folder.isCreating ? 'Aanmaken...' : `${item.folder.itemCount} items`}
                    </Text>
                  </View>
                  {!item.folder.isCreating && <ChevronRight color={Colors.light.muted} size={20} />}
                </TouchableOpacity>
              );
            }
            
            const Icon = item.media.file_type === 'video' ? Video : ImageIcon;
            return (
              <Pressable 
                style={[styles.card, item.media.isUploading && styles.cardUploading]} 
                onPress={() => !item.media.isUploading && handleOpenMedia(item.media)}
                disabled={item.media.isUploading}
                testID={`media-${item.media.id}`}
              >
                <View style={[styles.iconContainer, styles.mediaIcon]}>
                  {item.media.isUploading ? (
                    <ActivityIndicator size="small" color={Colors.light.text} />
                  ) : (
                    <Icon color={Colors.light.text} size={24} strokeWidth={2} />
                  )}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.media.name}</Text>
                  <Text style={styles.cardMeta}>
                    {item.media.isUploading
                      ? 'Uploaden...'
                      : `${item.media.file_type.toUpperCase()} • ${(item.media.file_size / (1024 * 1024)).toFixed(1)} MB`}
                  </Text>
                  {item.media.isUploading && item.media.uploadProgress !== undefined && (
                    <View style={styles.progressBar}>
                      <View style={[styles.progressBarFill, { width: `${item.media.uploadProgress}%` }]} />
                    </View>
                  )}
                </View>
                {!item.media.isUploading && (
                  <View style={styles.playBadge}>
                    <Text style={styles.playBadgeText}>▶</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />

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
                  onPress={handleCreateFolder}
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

        <Modal
          visible={showActionSheet}
          transparent
          animationType="fade"
          onRequestClose={() => setShowActionSheet(false)}
        >
          <Pressable 
            style={styles.actionSheetOverlay} 
            onPress={() => setShowActionSheet(false)}
          >
            <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.actionSheetHandle} />
              
              <TouchableOpacity
                style={styles.actionSheetOption}
                onPress={() => {
                  setShowActionSheet(false);
                  setShowFolderModal(true);
                }}
                testID="create-folder-option"
              >
                <View style={styles.actionSheetIconContainer}>
                  <Folder color={Colors.light.primary} size={24} strokeWidth={2.5} />
                </View>
                <View style={styles.actionSheetTextContainer}>
                  <Text style={styles.actionSheetTitle}>Nieuwe Map</Text>
                  <Text style={styles.actionSheetSubtitle}>Maak een nieuwe map aan</Text>
                </View>
                <ChevronRight color={Colors.light.muted} size={20} />
              </TouchableOpacity>

              <View style={styles.actionSheetDivider} />

              <TouchableOpacity
                style={styles.actionSheetOption}
                onPress={handleUploadMedia}
                disabled={isUploading}
                testID="upload-media-option"
              >
                <View style={styles.actionSheetIconContainer}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color={Colors.light.primary} />
                  ) : (
                    <Upload color={Colors.light.primary} size={24} strokeWidth={2.5} />
                  )}
                </View>
                <View style={styles.actionSheetTextContainer}>
                  <Text style={styles.actionSheetTitle}>
                    {isUploading ? 'Uploaden...' : 'Media Uploaden'}
                  </Text>
                  <Text style={styles.actionSheetSubtitle}>
                    Video, foto of audio uploaden
                  </Text>
                </View>
                <ChevronRight color={Colors.light.muted} size={20} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <Pressable 
          style={[styles.fab, { bottom: insets.bottom + 20 }]} 
          onPress={() => setShowActionSheet(true)}
          testID="add-library-fab"
        >
          <LinearGradient
            colors={[Colors.light.primary, '#B91C1C']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus color={Colors.light.text} size={28} strokeWidth={3} />
          </LinearGradient>
        </Pressable>
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
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  storageTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storageTextSecondary: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  storageLoading: {
    paddingVertical: 8,
    alignItems: 'flex-start',
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
  fab: {
    position: "absolute",
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 16,
    marginBottom: 12,
  },
  actionSheetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionSheetTextContainer: {
    flex: 1,
  },
  actionSheetTitle: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  actionSheetSubtitle: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: Colors.light.surfaceLight,
    marginVertical: 4,
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
    marginRight: 12,
  },
  errorClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCreating: {
    opacity: 0.7,
  },
  cardUploading: {
    opacity: 0.8,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
});
