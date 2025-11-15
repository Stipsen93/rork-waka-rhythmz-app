import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator, Alert, Platform, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Folder, Video, Image as ImageIcon, ChevronRight, ArrowLeft, X, HardDrive, Plus, Upload, Trash2, CheckCircle2, RefreshCw } from "lucide-react-native";
import { Stack } from "expo-router";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { supabase } from "@/lib/supabase";
import { Image } from 'expo-image';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import * as DocumentPicker from 'expo-document-picker';
import { useAppState } from "@/providers/AppState";

type StorageFile = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
};

type FolderItem = {
  name: string;
  path: string;
  type: 'folder';
};

type FileItem = {
  name: string;
  path: string;
  type: 'file';
  size: number;
  mimeType: string;
  url: string;
};

type LibraryItem = FolderItem | FileItem;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const appState = useAppState();
  const { t } = appState;
  const [currentPath, setCurrentPath] = useState<string>("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [storageUsage, setStorageUsage] = useState<{ used: number; total: number } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

  const loadItems = useCallback(async () => {
    try {
      console.log('[LIBRARY] Loading items for path:', currentPath || 'root');
      
      const prefix = currentPath ? `${currentPath}/` : '';
      
      const { data: files, error } = await supabase.storage
        .from('media-library')
        .list(prefix, {
          limit: 1000,
          offset: 0,
        });

      if (error) {
        console.error('[LIBRARY] Error loading items:', error);
        throw error;
      }

      console.log('[LIBRARY] Raw files:', files?.length || 0);

      const parsedItems: LibraryItem[] = [];
      const seenFolders = new Set<string>();

      if (files) {
        for (const file of files) {
          // Skip .keep and .emptyFolderPlaceholder files
          if (file.name === '.keep' || file.name === '.emptyFolderPlaceholder') {
            continue;
          }

          const fullPath = prefix + file.name;

          // If it has metadata, it's a file
          if (file.metadata) {
            const { data } = supabase.storage
              .from('media-library')
              .getPublicUrl(fullPath);

            parsedItems.push({
              name: file.name,
              path: fullPath,
              type: 'file',
              size: file.metadata.size || 0,
              mimeType: file.metadata.mimetype || 'application/octet-stream',
              url: data.publicUrl,
            });
          } else {
            // It's a folder
            if (!seenFolders.has(file.name)) {
              seenFolders.add(file.name);
              parsedItems.push({
                name: file.name,
                path: fullPath,
                type: 'folder',
              });
            }
          }
        }
      }

      // Sort: folders first, then files
      parsedItems.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'folder' ? -1 : 1;
      });

      console.log('[LIBRARY] Parsed items:', parsedItems.length);
      setItems(parsedItems);
    } catch (error: any) {
      console.error('[LIBRARY] Load error:', error);
      setErrorMessage(`Fout bij laden: ${error.message || 'Onbekende fout'}`);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPath]);

  const loadStorageUsage = useCallback(async () => {
    try {
      // Get all files to calculate usage
      const { data: files, error } = await supabase.storage
        .from('media-library')
        .list('', {
          limit: 10000,
          offset: 0,
        });

      if (error) throw error;

      let totalBytes = 0;
      const calculateSize = async (prefix: string = '') => {
        const { data: items, error } = await supabase.storage
          .from('media-library')
          .list(prefix, {
            limit: 1000,
            offset: 0,
          });

        if (error || !items) return;

        for (const item of items) {
          if (item.metadata) {
            totalBytes += item.metadata.size || 0;
          } else {
            // It's a folder, recurse
            await calculateSize(prefix ? `${prefix}/${item.name}` : item.name);
          }
        }
      };

      await calculateSize('');

      const usedGB = totalBytes / (1024 * 1024 * 1024);
      const totalGB = 100; // Supabase free tier is 100GB

      setStorageUsage({ used: usedGB, total: totalGB });
    } catch (error) {
      console.error('[LIBRARY] Storage usage error:', error);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadStorageUsage();
  }, [loadItems, loadStorageUsage]);

  const handleBack = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadItems(), loadStorageUsage()]);
  }, [loadItems, loadStorageUsage]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    try {
      const newFolderPath = currentPath ? `${currentPath}/${folderName.trim()}` : folderName.trim();
      
      console.log('[FOLDER] Creating folder:', newFolderPath);

      // Upload a .keep file to create the folder
      const keepPath = `${newFolderPath}/.keep`;
      
      // Create empty content - use ArrayBuffer for cross-platform compatibility
      const emptyContent = new Uint8Array(0);
      
      const { error } = await supabase.storage
        .from('media-library')
        .upload(keepPath, emptyContent, {
          contentType: 'application/octet-stream',
          upsert: false,
        });

      if (error) {
        console.error('[FOLDER] Error:', error);
        throw error;
      }

      console.log('[FOLDER] Created successfully');
      
      setShowFolderModal(false);
      setFolderName("");
      await loadItems();
    } catch (error: any) {
      console.error('[FOLDER] Create error:', error);
      const message = error?.message || 'Onbekende fout';
      setErrorMessage(`Folder aanmaken mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleUploadMedia = async () => {
    setShowActionSheet(false);
    setErrorMessage(null);

    try {
      console.log('[UPLOAD] Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*', 'image/*', 'audio/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('[UPLOAD] Canceled');
        return;
      }

      const file = result.assets[0];
      console.log('[UPLOAD] File selected:', file.name, file.mimeType, file.size);

      setIsUploading(true);

      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = currentPath 
        ? `${currentPath}/${timestamp}_${sanitizedName}`
        : `${timestamp}_${sanitizedName}`;

      console.log('[UPLOAD] Storage path:', storagePath);

      // Read file
      const response = await fetch(file.uri);
      const blob = await response.blob();

      console.log('[UPLOAD] Uploading to Supabase Storage...');
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(storagePath, blob, {
          contentType: file.mimeType || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error('[UPLOAD] Error:', uploadError);
        throw uploadError;
      }

      console.log('[UPLOAD] Success!');
      
      setIsUploading(false);
      await Promise.all([loadItems(), loadStorageUsage()]);
    } catch (error: any) {
      console.error('[UPLOAD] Error:', error);
      setIsUploading(false);
      const message = error?.message || 'Onbekende fout';
      setErrorMessage(`Upload mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleLongPress = (itemPath: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedItems(new Set([itemPath]));
    }
  };

  const handleItemPress = (item: LibraryItem) => {
    if (selectionMode) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.path)) {
        newSelected.delete(item.path);
      } else {
        newSelected.add(item.path);
      }
      setSelectedItems(newSelected);
      
      if (newSelected.size === 0) {
        setSelectionMode(false);
      }
    } else {
      if (item.type === 'folder') {
        setCurrentPath(item.path);
      } else if (item.type === 'file' && item.mimeType.startsWith('video/')) {
        // Open video player
        setCurrentVideoUrl(item.url);
        setVideoPlayerVisible(true);
      } else {
        // Open file in new tab
        if (Platform.OS === 'web') {
          window.open(item.url, '_blank');
        }
      }
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0 || isDeleting) return;

    const confirmDelete = async () => {
      setIsDeleting(true);
      
      try {
        const pathsToDelete: string[] = [];
        
        for (const path of Array.from(selectedItems)) {
          const item = items.find(i => i.path === path);
          if (!item) continue;

          if (item.type === 'folder') {
            // Delete all files in folder
            const { data: folderFiles, error } = await supabase.storage
              .from('media-library')
              .list(path, {
                limit: 1000,
                offset: 0,
              });

            if (error) throw error;

            if (folderFiles) {
              for (const file of folderFiles) {
                pathsToDelete.push(`${path}/${file.name}`);
              }
            }
          } else {
            pathsToDelete.push(path);
          }
        }

        console.log('[DELETE] Deleting paths:', pathsToDelete);

        if (pathsToDelete.length > 0) {
          const { error } = await supabase.storage
            .from('media-library')
            .remove(pathsToDelete);

          if (error) throw error;
        }

        console.log('[DELETE] Success!');
        
        setSelectionMode(false);
        setSelectedItems(new Set());
        await Promise.all([loadItems(), loadStorageUsage()]);
      } catch (error: any) {
        console.error('[DELETE] Error:', error);
        const message = error?.message || 'Onbekende fout';
        setErrorMessage(`Verwijderen mislukt: ${message}`);
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Weet je zeker dat je ${selectedItems.size} ${selectedItems.size === 1 ? 'item' : 'items'} wilt verwijderen?`)) {
        await confirmDelete();
      }
    } else {
      Alert.alert(
        'Items verwijderen',
        `Weet je zeker dat je ${selectedItems.size} ${selectedItems.size === 1 ? 'item' : 'items'} wilt verwijderen?`,
        [
          { text: 'Annuleren', style: 'cancel' },
          { text: 'Verwijderen', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const breadcrumbText = useMemo(() => {
    if (!currentPath) return '';
    return currentPath.split('/').join(' > ');
  }, [currentPath]);

  const storagePercentage = useMemo(() => {
    if (!storageUsage) return 0;
    return (storageUsage.used / storageUsage.total) * 100;
  }, [storageUsage]);

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
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.appName}>WAKA RHYTHMZ</Text>
              <Text style={styles.title}>{t.library.title}</Text>
              {breadcrumbText ? (
                <Text style={styles.breadcrumb}>{breadcrumbText}</Text>
              ) : null}
            </View>
            <Pressable 
              onPress={handleRefresh}
              style={[styles.refreshButton, isRefreshing && styles.refreshButtonActive]}
              disabled={isRefreshing}
              testID="refresh-library-button"
            >
              <RefreshCw 
                color={Colors.light.primary} 
                size={22} 
                strokeWidth={2.5}
                style={isRefreshing && styles.refreshIcon}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <HardDrive color={Colors.light.primary} size={22} strokeWidth={2.5} />
            <Text style={styles.storageTitle}>{t.library.storage}</Text>
          </View>
          {!storageUsage ? (
            <View style={styles.storageLoading}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
            </View>
          ) : (
            <View style={styles.storageMeter}>
              <View style={styles.storageBar}>
                <LinearGradient
                  colors={
                    storagePercentage > 90
                      ? ['#DC2626', '#991B1B']
                      : storagePercentage > 75
                      ? ['#F59E0B', '#D97706']
                      : [Colors.light.primary, Colors.light.primaryDark]
                  }
                  style={[
                    styles.storageBarFill,
                    { width: `${Math.min(storagePercentage, 100)}%` }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <View style={styles.storageTextRow}>
                <Text style={styles.storageText}>
                  {storageUsage.used.toFixed(2)} GB {t.library.used}
                </Text>
                <Text style={styles.storageTextSecondary}>
                  {t.library.of} {storageUsage.total} GB
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
            <Text style={styles.backText}>{t.library.back}</Text>
          </Pressable>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.path}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.light.primary}
                colors={[Colors.light.primary]}
              />
            }
            renderItem={({ item }) => {
              const isSelected = selectedItems.has(item.path);
              
              return (
                <TouchableOpacity 
                  style={[styles.card, isSelected && styles.cardSelected]} 
                  onPress={() => handleItemPress(item)}
                  onLongPress={() => handleLongPress(item.path)}
                  testID={`item-${item.path}`}
                >
                  {selectionMode && (
                    <View style={styles.selectionIndicator}>
                      {isSelected && <CheckCircle2 color={Colors.light.primary} size={24} strokeWidth={2.5} />}
                      {!isSelected && <View style={styles.selectionCircle} />}
                    </View>
                  )}
                  <View style={[styles.iconContainer, item.type === 'file' && styles.mediaIcon]}>
                    {item.type === 'folder' ? (
                      <Folder color={Colors.light.primary} size={28} strokeWidth={2} />
                    ) : item.mimeType.startsWith('video/') ? (
                      <Video color={Colors.light.text} size={24} strokeWidth={2} />
                    ) : (
                      <ImageIcon color={Colors.light.text} size={24} strokeWidth={2} />
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardMeta}>
                      {item.type === 'folder' 
                        ? 'Map' 
                        : `${(item.size / (1024 * 1024)).toFixed(1)} MB`}
                    </Text>
                  </View>
                  {!selectionMode && <ChevronRight color={Colors.light.muted} size={20} />}
                </TouchableOpacity>
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
                <Text style={styles.modalTitle}>{t.library.newFolder}</Text>
                <Pressable onPress={() => {
                  setShowFolderModal(false);
                  setFolderName("");
                }} testID="close-folder-modal">
                  <X color={Colors.light.muted} size={24} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t.library.folderName}</Text>
                <TextInput
                  style={styles.input}
                  value={folderName}
                  onChangeText={setFolderName}
                  placeholder={t.library.enterFolderName}
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
                  <Text style={styles.cancelButtonText}>{t.library.cancel}</Text>
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
                    <Text style={[styles.createButtonText, !folderName.trim() && styles.disabledButtonText]}>{t.library.create}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <MenuModal 
          visible={showMenuModal} 
          onClose={() => setShowMenuModal(false)}
        />

        <VideoPlayerModal
          visible={videoPlayerVisible}
          videoUrl={currentVideoUrl}
          onClose={() => {
            setVideoPlayerVisible(false);
            setCurrentVideoUrl('');
          }}
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
                  <Text style={styles.actionSheetTitle}>{t.library.newFolder}</Text>
                  <Text style={styles.actionSheetSubtitle}>{t.library.create}</Text>
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
                    {isUploading ? t.library.uploading : t.library.uploadMedia}
                  </Text>
                  <Text style={styles.actionSheetSubtitle}>
                    {t.library.uploadDescription}
                  </Text>
                </View>
                <ChevronRight color={Colors.light.muted} size={20} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {selectionMode ? (
          <View style={[styles.selectionToolbar, { bottom: insets.bottom + 20 }]}>
            <View style={styles.toolbarTopRow}>
              <Pressable 
                style={styles.toolbarCancelButton}
                onPress={handleCancelSelection}
                testID="cancel-selection-button"
              >
                <X color={Colors.light.text} size={20} strokeWidth={2.5} />
                <Text style={styles.toolbarButtonText}>{t.library.cancel}</Text>
              </Pressable>
              
              <Text style={styles.toolbarText}>
                {selectedItems.size} {selectedItems.size === 1 ? t.library.item : t.library.items} {t.library.selected}
              </Text>
            </View>
            
            <View style={styles.toolbarBottomRow}>
              <Pressable 
                style={[styles.toolbarActionButton, isDeleting && styles.toolbarButtonDisabled]}
                onPress={handleDeleteSelected}
                disabled={isDeleting || selectedItems.size === 0}
                testID="delete-selected-button"
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={Colors.light.text} />
                ) : (
                  <>
                    <Trash2 color="#DC2626" size={20} strokeWidth={2.5} />
                    <Text style={styles.toolbarButtonTextDelete}>{t.library.delete}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : appState.currentUser?.role === 'admin' ? (
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
        ) : null}
      </View>
    </>
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
  cardSelected: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
    backgroundColor: `${Colors.light.primary}15`,
  },
  selectionIndicator: {
    marginRight: 12,
    width: 24,
    height: 24,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.muted,
  },
  selectionToolbar: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    gap: 12,
  },
  toolbarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarBottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toolbarCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
  toolbarButtonText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  toolbarButtonTextDelete: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  toolbarText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonActive: {
    backgroundColor: Colors.light.darkGray,
  },
  refreshIcon: {
    opacity: 0.5,
  },
});
