import React, { useState, useMemo, useRef, useEffect } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, PanResponder, GestureResponderEvent, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Folder, Video, Image as ImageIcon, ChevronRight, ArrowLeft, X, HardDrive, Plus, Upload, Trash2, CheckCircle2, Edit3, Play, Pause, Download, Gauge, Maximize, RefreshCw } from "lucide-react-native";
import { Stack } from "expo-router";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { supabase } from "@/lib/supabase";
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';
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
  const { t } = appState;
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        if (!folderMap.has(firstFolder)) {
          folderMap.set(firstFolder, 0);
        }
      } else if (currentPath && folderPath.startsWith(currentPath + '/')) {
        const remaining = folderPath.substring(currentPath.length + 1);
        if (remaining.includes('/')) {
          const nextFolder = remaining.split('/')[0];
          const fullPath = currentPath + '/' + nextFolder;
          if (!folderMap.has(fullPath)) {
            folderMap.set(fullPath, 0);
          }
        }
      } else if (currentPath === '' && !folderPath.includes('/')) {
        if (!folderMap.has(folderPath)) {
          folderMap.set(folderPath, 0);
        }
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
    const existingMedia = appState.getMediaInFolder(currentPath)
      .filter(m => m.name !== '.emptyFolderPlaceholder')
      .map(m => ({
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
      console.log('[CLIENT] File URI:', file.uri);
      console.log('[CLIENT] File type:', file.mimeType);
      console.log('[CLIENT] File size:', file.size);
      
      let base64Data = '';
      try {
        console.log('[CLIENT] Fetching file from URI...');
        const response = await fetch(file.uri);
        console.log('[CLIENT] Fetch response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Fetch mislukt met status: ${response.status}`);
        }
        
        console.log('[CLIENT] Converting to blob...');
        const blob = await response.blob();
        console.log('[CLIENT] Blob created, size:', blob.size, 'type:', blob.type);
        
        if (blob.size === 0) {
          throw new Error('Bestand is leeg of kon niet worden gelezen');
        }
        
        console.log('[CLIENT] Reading blob as base64...');
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onloadend = () => {
            console.log('[CLIENT] FileReader loadend event fired');
            console.log('[CLIENT] FileReader result type:', typeof reader.result);
            console.log('[CLIENT] FileReader result value:', reader.result ? 'has value' : 'empty');
            
            if (!reader.result || typeof reader.result !== 'string') {
              reject(new Error('FileReader resultaat is leeg of ongeldig'));
              return;
            }
            
            const result = reader.result as string;
            if (result.length === 0) {
              reject(new Error('FileReader resultaat string is leeg'));
              return;
            }
            
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            console.log('[CLIENT] File read successfully, base64 length:', base64.length);
            
            if (base64.length === 0) {
              reject(new Error('Base64 conversie resulteerde in lege string'));
              return;
            }
            
            resolve(base64);
          };
          
          reader.onerror = () => {
            console.error('[CLIENT] FileReader error:', reader.error);
            reject(new Error(`FileReader fout: ${reader.error?.message || 'Onbekende fout'}`));
          };
          
          reader.onabort = () => {
            console.error('[CLIENT] FileReader aborted');
            reject(new Error('Bestand lezen geannuleerd'));
          };
          
          console.log('[CLIENT] Starting FileReader.readAsDataURL...');
          console.log('[CLIENT] Blob size before reading:', blob.size);
          console.log('[CLIENT] Blob type before reading:', blob.type);
          
          if (blob.size === 0) {
            reject(new Error('Blob is leeg (0 bytes)'));
            return;
          }
          
          reader.readAsDataURL(blob);
        });
        
        console.log('[CLIENT] File reading completed successfully');
      } catch (error: any) {
        console.error('[CLIENT] Error reading file:', error);
        console.error('[CLIENT] Error details:', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack,
        });
        
        setUploadingFiles((prev) => {
          const next = new Map(prev);
          next.delete(file.name);
          return next;
        });
        setIsUploading(false);
        
        const errorMsg = error?.message || 'Onbekende fout';
        throw new Error(`Kon bestand niet lezen: ${errorMsg}`);
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

  const handleLongPress = (itemId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedItems(new Set([itemId]));
    }
  };

  const handleItemPress = (itemId: string, isFolder: boolean, folderPath?: string) => {
    if (selectionMode) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      setSelectedItems(newSelected);
      
      if (newSelected.size === 0) {
        setSelectionMode(false);
      }
    } else {
      if (isFolder && folderPath) {
        setCurrentPath(folderPath);
      }
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const handleDeleteSelected = async () => {
    console.log('🗑️ [DELETE] Delete button pressed');
    console.log('🗑️ [DELETE] Selected items count:', selectedItems.size);
    console.log('🗑️ [DELETE] Selected items:', Array.from(selectedItems));
    
    if (selectedItems.size === 0) {
      console.log('🗑️ [DELETE] No items selected, returning');
      return;
    }
    
    if (isDeleting) {
      console.log('🗑️ [DELETE] Already deleting, returning');
      return;
    }
    
    const confirmDelete = async () => {
      console.log('🗑️ [DELETE] User confirmed deletion');
      setIsDeleting(true);
      
      try {
        const itemsToDelete = Array.from(selectedItems);
        console.log('🗑️ [DELETE] Processing items:', itemsToDelete);
        
        const mediaToDelete = itemsToDelete.filter(id => id.startsWith('media-'));
        const foldersToDelete = itemsToDelete.filter(id => id.startsWith('folder-'));
        
        console.log('🗑️ [DELETE] Media items:', mediaToDelete.length, mediaToDelete);
        console.log('🗑️ [DELETE] Folder items:', foldersToDelete.length, foldersToDelete);
        
        if (mediaToDelete.length > 0) {
          const ids = mediaToDelete.map(id => id.replace('media-', ''));
          console.log('🗑️ [DELETE] Extracted media IDs:', ids);
          console.log('🗑️ [DELETE] Calling appState.deleteMedia...');
          await appState.deleteMedia(ids);
          console.log('🗑️ [DELETE] ✅ deleteMedia completed successfully');
        }
        
        if (foldersToDelete.length > 0) {
          console.log('🗑️ [DELETE] Processing folders...');
          for (const folderId of foldersToDelete) {
            const path = folderId.replace('folder-', '');
            const folder = folders.find(f => f.path === path);
            if (folder) {
              console.log('🗑️ [DELETE] Deleting folder:', folder.path);
              await appState.deleteFolder(folder.path);
              console.log('🗑️ [DELETE] ✅ deleteFolder completed');
            }
          }
        }
        
        console.log('🗑️ [DELETE] Refreshing storage usage...');
        await appState.refreshStorageUsage();
        console.log('🗑️ [DELETE] ✅ Storage refreshed');
        
        setSelectionMode(false);
        setSelectedItems(new Set());
        console.log('🗑️ [DELETE] ✅ All done!');
      } catch (error: any) {
        console.error('🗑️ [DELETE] ❌ Error:', error);
        console.error('🗑️ [DELETE] ❌ Error message:', error?.message);
        console.error('🗑️ [DELETE] ❌ Error stack:', error?.stack);
        const message = error?.message || 'Onbekende fout bij verwijderen';
        setErrorMessage(`Verwijderen mislukt: ${message}`);
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setIsDeleting(false);
        console.log('🗑️ [DELETE] Finished (finally block)');
      }
    };
    
    if (Platform.OS === 'web') {
      if (confirm(`Weet je zeker dat je ${selectedItems.size} ${selectedItems.size === 1 ? 'item' : 'items'} wilt verwijderen?`)) {
        await confirmDelete();
      } else {
        console.log('🗑️ [DELETE] User cancelled');
      }
    } else {
      Alert.alert(
        'Items verwijderen',
        `Weet je zeker dat je ${selectedItems.size} ${selectedItems.size === 1 ? 'item' : 'items'} wilt verwijderen?`,
        [
          { 
            text: 'Annuleren', 
            style: 'cancel', 
            onPress: () => console.log('🗑️ [DELETE] User cancelled') 
          },
          { 
            text: 'Verwijderen', 
            style: 'destructive',
            onPress: confirmDelete
          },
        ]
      );
    }
  };

  const handleRenameSelected = () => {
    if (selectedItems.size !== 1) return;
    
    const itemId = Array.from(selectedItems)[0];
    setRenamingItemId(itemId);
    
    if (itemId.startsWith('media-')) {
      const id = itemId.replace('media-', '');
      const item = mediaItems.find(m => m.id === id);
      if (item) {
        const nameWithoutExt = item.name.includes('.') 
          ? item.name.substring(0, item.name.lastIndexOf('.'))
          : item.name;
        setRenameValue(nameWithoutExt);
      }
    } else if (itemId.startsWith('folder-')) {
      const path = itemId.replace('folder-', '');
      const folder = folders.find(f => f.path === path);
      if (folder) {
        setRenameValue(folder.name);
      }
    }
    
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async () => {
    if (!renameValue.trim() || !renamingItemId || isRenaming) return;
    
    setIsRenaming(true);
    try {
      if (renamingItemId.startsWith('media-')) {
        const id = renamingItemId.replace('media-', '');
        const item = mediaItems.find(m => m.id === id);
        if (item) {
          const ext = item.name.includes('.') ? item.name.substring(item.name.lastIndexOf('.')) : '';
          const newName = renameValue.trim() + ext;
          await appState.renameMedia(id, newName);
        }
      } else if (renamingItemId.startsWith('folder-')) {
        const oldPath = renamingItemId.replace('folder-', '');
        const folder = folders.find(f => f.path === oldPath);
        if (folder) {
          const pathParts = oldPath.split('/');
          pathParts[pathParts.length - 1] = renameValue.trim();
          const newPath = pathParts.join('/');
          await appState.renameFolder(oldPath, newPath);
        }
      }
      
      setShowRenameModal(false);
      setRenameValue('');
      setRenamingItemId(null);
      setSelectionMode(false);
      setSelectedItems(new Set());
    } catch (error: any) {
      console.error('Rename error:', error);
      const message = error?.message || 'Onbekende fout bij hernoemen';
      setErrorMessage(`Hernoemen mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRefreshData = async () => {
    if (isRefreshing) return;
    
    console.log('🔄 [LIBRARY] Manual refresh triggered');
    setIsRefreshing(true);
    try {
      await appState.syncAllData();
      console.log('✅ [LIBRARY] Manual refresh completed');
    } catch (error) {
      console.error('❌ [LIBRARY] Manual refresh error:', error);
      setErrorMessage('Fout bij vernieuwen van data');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
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
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.appName}>WAKA RHYTHMZ</Text>
              <Text style={styles.title}>{t.library.title}</Text>
              {breadcrumbText ? (
                <Text style={styles.breadcrumb}>{breadcrumbText}</Text>
              ) : null}
            </View>
            <Pressable 
              onPress={handleRefreshData}
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
                  {(appState.storageUsage.usageGB || 0).toFixed(2)} GB {t.library.used}
                </Text>
                <Text style={styles.storageTextSecondary}>
                  {t.library.of} {appState.storageUsage.maxGB || 0} GB
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

        <FlatList
          data={items}
          keyExtractor={(item, index) => 
            item.kind === "folder" ? `folder-${item.folder.path}` : `media-${item.media.id}`
          }
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => {
            if (item.kind === "folder") {
              const itemId = `folder-${item.folder.path}`;
              const isSelected = selectedItems.has(itemId);
              
              return (
                <TouchableOpacity 
                  style={[styles.card, item.folder.isCreating && styles.cardCreating, isSelected && styles.cardSelected]} 
                  onPress={() => !item.folder.isCreating && handleItemPress(itemId, true, item.folder.path)}
                  onLongPress={() => !item.folder.isCreating && handleLongPress(itemId)}
                  disabled={item.folder.isCreating}
                  testID={`folder-${item.folder.path}`}
                >
                  {selectionMode && (
                    <View style={styles.selectionIndicator}>
                      {isSelected && <CheckCircle2 color={Colors.light.primary} size={24} strokeWidth={2.5} />}
                      {!isSelected && <View style={styles.selectionCircle} />}
                    </View>
                  )}
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
                      {item.folder.isCreating ? t.library.creating : `${item.folder.itemCount} ${t.library.items}`}
                    </Text>
                  </View>
                  {!item.folder.isCreating && !selectionMode && <ChevronRight color={Colors.light.muted} size={20} />}
                </TouchableOpacity>
              );
            }
            
            const Icon = item.media.file_type === 'video' ? Video : ImageIcon;
            const itemId = `media-${item.media.id}`;
            const isSelected = selectedItems.has(itemId);
            
            return (
              <TouchableOpacity 
                style={[styles.card, item.media.isUploading && styles.cardUploading, isSelected && styles.cardSelected]} 
                onPress={() => {
                  if (!item.media.isUploading) {
                    if (selectionMode) {
                      handleItemPress(itemId, false);
                    } else {
                      handleOpenMedia(item.media);
                    }
                  }
                }}
                onLongPress={() => !item.media.isUploading && handleLongPress(itemId)}
                disabled={item.media.isUploading}
                testID={`media-${item.media.id}`}
              >
                {selectionMode && (
                  <View style={styles.selectionIndicator}>
                    {isSelected && <CheckCircle2 color={Colors.light.primary} size={24} strokeWidth={2.5} />}
                    {!isSelected && <View style={styles.selectionCircle} />}
                  </View>
                )}
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
                      ? t.library.uploading
                      : `${item.media.file_type.toUpperCase()} • ${(item.media.file_size / (1024 * 1024)).toFixed(1)} MB`}
                  </Text>
                  {item.media.isUploading && item.media.uploadProgress !== undefined && (
                    <View style={styles.progressBar}>
                      <View style={[styles.progressBarFill, { width: `${item.media.uploadProgress}%` }]} />
                    </View>
                  )}
                </View>
                {!item.media.isUploading && !selectionMode && (
                  <View style={styles.playBadge}>
                    <Text style={styles.playBadgeText}>▶</Text>
                  </View>
                )}
              </TouchableOpacity>
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
          visible={showRenameModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowRenameModal(false);
            setRenameValue("");
            setRenamingItemId(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.library.rename}</Text>
                <Pressable onPress={() => {
                  setShowRenameModal(false);
                  setRenameValue("");
                  setRenamingItemId(null);
                }} testID="close-rename-modal">
                  <X color={Colors.light.muted} size={24} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t.library.newName}</Text>
                <TextInput
                  style={styles.input}
                  value={renameValue}
                  onChangeText={setRenameValue}
                  placeholder={t.library.enterNewName}
                  placeholderTextColor={Colors.light.muted}
                  autoFocus
                  testID="rename-input"
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setShowRenameModal(false);
                    setRenameValue("");
                    setRenamingItemId(null);
                  }}
                  testID="cancel-rename-button"
                >
                  <Text style={styles.cancelButtonText}>{t.library.cancel}</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.actionButton, styles.createButton, (!renameValue.trim() || isRenaming) && styles.disabledButton]}
                  onPress={handleRenameConfirm}
                  disabled={!renameValue.trim() || isRenaming}
                  testID="confirm-rename-button"
                >
                  <LinearGradient
                    colors={renameValue.trim() && !isRenaming ? [Colors.light.primary, Colors.light.primaryDark] : [Colors.light.surfaceLight, Colors.light.surfaceLight]}
                    style={styles.createButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isRenaming ? (
                      <ActivityIndicator size="small" color={Colors.light.text} />
                    ) : (
                      <Text style={[styles.createButtonText, !renameValue.trim() && styles.disabledButtonText]}>{t.library.rename}</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
              {selectedItems.size === 1 && (
                <Pressable 
                  style={styles.toolbarActionButton}
                  onPress={handleRenameSelected}
                  testID="rename-selected-button"
                >
                  <Edit3 color={Colors.light.primary} size={20} strokeWidth={2.5} />
                  <Text style={styles.toolbarButtonTextRename}>{t.library.rename}</Text>
                </Pressable>
              )}
              
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

function MediaPlayerModal({ media, visible, onClose }: { media: MediaItem; visible: boolean; onClose: () => void }) {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<ExpoVideo>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<View>(null);
  const progressBarWidthRef = useRef<number>(0);
  const progressBarXRef = useRef<number>(0);

  useEffect(() => {
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
      setIsPlaying(true);
      setShowControls(false);
    }
  }, [visible, media.storage_path]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleVideoPress = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
        
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleToggleSlowMotion = async () => {
    if (!videoRef.current) return;
    
    try {
      const newRate = playbackRate === 1 ? 0.5 : 1;
      await videoRef.current.setRateAsync(newRate, true);
      setPlaybackRate(newRate);
    } catch (error) {
      console.error('Error toggling slow motion:', error);
    }
  };

  const handleDownload = async () => {
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = mediaUrl;
        link.download = media.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      if (Platform.OS === 'web') {
        const videoElement = (videoRef.current as any)?._nativeRef?.current;
        if (videoElement) {
          if (!document.fullscreenElement) {
            await videoElement.requestFullscreen();
            setIsFullscreen(true);
            if (screen.orientation && screen.orientation.lock) {
              try {
                await screen.orientation.lock('landscape');
              } catch (e) {
                console.log('Screen orientation lock not supported:', e);
              }
            }
          } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
            if (screen.orientation && screen.orientation.unlock) {
              screen.orientation.unlock();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      if (!isSeeking) {
        setPositionMillis(status.positionMillis || 0);
        setDurationMillis(status.durationMillis || 0);
      }
    }
  };

  const handleSeek = async (progress: number) => {
    if (!videoRef.current || !durationMillis || durationMillis <= 0) return;
    
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    if (!isFinite(clampedProgress)) {
      console.error('Invalid progress value:', progress);
      return;
    }
    
    const targetPosition = Math.floor(clampedProgress * durationMillis);
    
    if (!isFinite(targetPosition) || targetPosition < 0) {
      console.error('Invalid target position:', targetPosition);
      return;
    }
    
    setIsSeeking(true);
    setPositionMillis(targetPosition);
    
    try {
      await videoRef.current.setPositionAsync(targetPosition);
    } catch (error) {
      console.error('Error seeking:', error);
    } finally {
      setIsSeeking(false);
    }
  };

  const handleProgressBarPress = (e: any) => {
    e.stopPropagation();
    
    if (Platform.OS === 'web') {
      if (progressBarRef.current) {
        const rect = (progressBarRef.current as any).getBoundingClientRect?.();
        if (rect) {
          const clickX = e.nativeEvent.pageX || e.nativeEvent.clientX;
          const relativeX = clickX - rect.left;
          const progress = relativeX / rect.width;
          const clampedProgress = Math.max(0, Math.min(1, progress));
          
          if (isFinite(clampedProgress)) {
            handleSeek(clampedProgress);
          }
        }
      }
    } else {
      const nativeEvent = e.nativeEvent;
      const locationX = nativeEvent.locationX;
      
      if (progressBarWidthRef.current > 0 && typeof locationX === 'number') {
        const progress = locationX / progressBarWidthRef.current;
        if (isFinite(progress)) {
          handleSeek(progress);
        }
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (event) => {
        setIsDragging(true);
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        
        if (Platform.OS === 'web') {
          if (progressBarRef.current) {
            const rect = (progressBarRef.current as any).getBoundingClientRect?.();
            if (rect) {
              const clickX = event.nativeEvent.pageX || event.nativeEvent.clientX;
              const relativeX = clickX - rect.left;
              const progress = relativeX / rect.width;
              const clampedProgress = Math.max(0, Math.min(1, progress));
              
              if (isFinite(clampedProgress) && durationMillis > 0) {
                const targetPosition = Math.floor(clampedProgress * durationMillis);
                setPositionMillis(targetPosition);
              }
            }
          }
        } else {
          const locationX = event.nativeEvent.locationX;
          if (progressBarWidthRef.current > 0 && typeof locationX === 'number') {
            const progress = locationX / progressBarWidthRef.current;
            const clampedProgress = Math.max(0, Math.min(1, progress));
            
            if (isFinite(clampedProgress) && durationMillis > 0) {
              const targetPosition = Math.floor(clampedProgress * durationMillis);
              setPositionMillis(targetPosition);
            }
          }
        }
      },
      
      onPanResponderMove: (event, gestureState) => {
        if (Platform.OS === 'web') {
          if (progressBarRef.current) {
            const rect = (progressBarRef.current as any).getBoundingClientRect?.();
            if (rect) {
              const moveX = event.nativeEvent.pageX || event.nativeEvent.clientX;
              const relativeX = moveX - rect.left;
              const progress = relativeX / rect.width;
              const clampedProgress = Math.max(0, Math.min(1, progress));
              
              if (isFinite(clampedProgress) && durationMillis > 0) {
                const targetPosition = Math.floor(clampedProgress * durationMillis);
                setPositionMillis(targetPosition);
              }
            }
          }
        } else {
          if (progressBarWidthRef.current > 0 && progressBarXRef.current !== undefined) {
            const relativeX = gestureState.moveX - progressBarXRef.current;
            const progress = relativeX / progressBarWidthRef.current;
            const clampedProgress = Math.max(0, Math.min(1, progress));
            
            if (isFinite(clampedProgress) && durationMillis > 0) {
              const targetPosition = Math.floor(clampedProgress * durationMillis);
              setPositionMillis(targetPosition);
            }
          }
        }
      },
      
      onPanResponderRelease: (event, gestureState) => {
        if (Platform.OS === 'web') {
          if (progressBarRef.current) {
            const rect = (progressBarRef.current as any).getBoundingClientRect?.();
            if (rect) {
              const moveX = event.nativeEvent.pageX || event.nativeEvent.clientX;
              const relativeX = moveX - rect.left;
              const progress = relativeX / rect.width;
              const clampedProgress = Math.max(0, Math.min(1, progress));
              
              if (isFinite(clampedProgress)) {
                handleSeek(clampedProgress);
              }
            }
          }
        } else {
          if (progressBarWidthRef.current > 0 && progressBarXRef.current !== undefined) {
            const relativeX = gestureState.moveX - progressBarXRef.current;
            const progress = relativeX / progressBarWidthRef.current;
            const clampedProgress = Math.max(0, Math.min(1, progress));
            
            if (isFinite(clampedProgress)) {
              handleSeek(clampedProgress);
            }
          }
        }
        
        setIsDragging(false);
        
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      },
      
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
            <View style={styles.headerActions}>
              {media.file_type === 'video' && (
                <Pressable onPress={handleDownload} style={styles.downloadButton}>
                  <Download color={Colors.light.text} size={24} strokeWidth={2.5} />
                </Pressable>
              )}
              <Pressable onPress={onClose} testID="close-player-modal">
                <X color={Colors.light.muted} size={24} />
              </Pressable>
            </View>
          </View>

          {isLoadingUrl ? (
            <View style={styles.playerLoading}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : (
            <View style={styles.playerContainer}>
              {media.file_type === 'video' ? (
                <Pressable 
                  style={styles.videoWrapper}
                  onPress={handleVideoPress}
                >
                  <ExpoVideo
                    ref={videoRef}
                    source={{ uri: mediaUrl }}
                    style={styles.video}
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                  />
                  {showControls && (
                    <View style={styles.controlsOverlay}>
                      <View style={styles.controlsTop}>
                        <Pressable 
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleFullscreen();
                          }}
                          style={styles.fullscreenButton}
                        >
                          <Maximize color={Colors.light.text} size={24} strokeWidth={2.5} />
                        </Pressable>
                      </View>
                      <View style={styles.controlsCenter}>
                        <View style={styles.centerButtonsRow}>
                          <Pressable 
                            onPress={(e) => {
                              e.stopPropagation();
                              handlePlayPause();
                            }}
                          >
                            <LinearGradient
                              colors={[Colors.light.primary, '#B91C1C']}
                              style={styles.playPauseButton}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              {isPlaying ? (
                                <Pause color={Colors.light.text} size={40} strokeWidth={2.5} fill={Colors.light.text} />
                              ) : (
                                <Play color={Colors.light.text} size={40} strokeWidth={2.5} fill={Colors.light.text} />
                              )}
                            </LinearGradient>
                          </Pressable>
                          <Pressable 
                            onPress={(e) => {
                              e.stopPropagation();
                              handleToggleSlowMotion();
                            }}
                          >
                            <LinearGradient
                              colors={playbackRate === 0.5 ? [Colors.light.primary, '#B91C1C'] : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.2)']}
                              style={styles.slowMotionButton}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <Gauge color={Colors.light.text} size={32} strokeWidth={2.5} />
                            </LinearGradient>
                          </Pressable>
                        </View>
                      </View>
                      <View style={styles.controlsBottom}>
                        <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
                        <View 
                          style={styles.progressBarContainer}
                          ref={progressBarRef}
                          onLayout={(event) => {
                            const layout = event.nativeEvent.layout;
                            progressBarWidthRef.current = layout.width;
                            progressBarXRef.current = layout.x;
                          }}
                        >
                          <Pressable
                            style={styles.progressBarHitbox}
                            onPress={handleProgressBarPress}
                          >
                            <View style={styles.progressBarTrack}>
                              <LinearGradient
                                colors={[Colors.light.primary, '#B91C1C']}
                                style={[styles.progressBarFilled, { width: `${durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0}%` }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                              />
                            </View>
                          </Pressable>
                          <View 
                            style={[styles.progressThumb, { left: `${durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0}%` }]}
                            {...panResponder.panHandlers}
                          />
                        </View>
                        <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
                      </View>
                    </View>
                  )}
                </Pressable>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  downloadButton: {
    padding: 4,
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
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerLoading: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.light.darkGray,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.darkGray,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  controlsTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fullscreenButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  controlsBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  slowMotionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative' as const,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFilled: {
    height: '100%',
    borderRadius: 2,
  },
  progressBarHitbox: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  progressThumb: {
    position: 'absolute' as const,
    top: '50%',
    marginTop: -8,
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '700' as const,
    minWidth: 45,
    textAlign: 'center',
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
  toolbarButtonTextRename: {
    color: Colors.light.primary,
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
