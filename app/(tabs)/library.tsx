import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity, ActivityIndicator, Alert, Platform, RefreshControl, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Folder, Video, Image as ImageIcon, ChevronRight, ArrowLeft, X, Plus, Upload, Trash2, CheckCircle2, RefreshCw, Edit2, Eye, EyeOff } from "lucide-react-native";
import { Stack } from "expo-router";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";
import { supabase, supabaseUrl, supabaseAnonKey } from "@/lib/supabase";
import VideoPlayerModal from '@/components/VideoPlayerModal';
import AudioPlayerModal from '@/components/AudioPlayerModal';
import ImageViewerModal from '@/components/ImageViewerModal';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAppState } from "@/providers/AppState";
import { useUploadProgress } from "@/providers/UploadProgressProvider";

type FolderItem = {
  name: string;
  path: string;
  type: 'folder';
  visibleToAll?: boolean;
  visibleToUserIds?: string[];
  hiddenBy?: string;
};

type FileItem = {
  name: string;
  path: string;
  type: 'file';
  size: number;
  mimeType: string;
  url: string;
  visibleToAll?: boolean;
  visibleToUserIds?: string[];
  hiddenBy?: string;
};

type LibraryItem = FolderItem | FileItem;

type LoadItemsOptions = {
  forceSync?: boolean;
};

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const {
    t,
    syncAllData,
    refreshStorageUsage: refreshStorageUsageFromApp,
    createFolder,
    currentUser,
  } = useAppState();
  const { startUpload, updateProgress, completeUpload, cancelUpload } = useUploadProgress();
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

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState('');
  const [currentAudioTitle, setCurrentAudioTitle] = useState('');
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameItem, setRenameItem] = useState<LibraryItem | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [visibilityItem, setVisibilityItem] = useState<LibraryItem | null>(null);
  const [visibilityToAll, setVisibilityToAll] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string; username: string; isCrownAdmin: boolean }[]>([]);
  const [showVisibilityDetailModal, setShowVisibilityDetailModal] = useState(false);
  const [visibilityDetailItem, setVisibilityDetailItem] = useState<LibraryItem | null>(null);
  const isAdmin = currentUser?.role === 'admin';
  const itemsCacheRef = useRef<Map<string, LibraryItem[]>>(new Map());
  const hasSyncedRef = useRef(false);
  const latestPathRef = useRef(currentPath);

  const loadItems = useCallback(async (options?: LoadItemsOptions) => {
    const forceSync = options?.forceSync ?? false;
    const pathForRequest = currentPath;
    const cacheKey = pathForRequest || "";
    const cachedItems = itemsCacheRef.current.get(cacheKey);
    const canUseCache = Boolean(cachedItems) && !forceSync;

    console.log('[LIBRARY] Loading items for path:', pathForRequest || 'root', 'forceSync:', forceSync);

    if (canUseCache && cachedItems) {
      setItems(cachedItems);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      setErrorMessage(null);

      if (!hasSyncedRef.current || forceSync) {
        console.log('[LIBRARY] Syncing data...');
        await syncAllData();
        hasSyncedRef.current = true;
        console.log('[LIBRARY] Sync completed');
      }

      const bucketPath = pathForRequest || undefined;
      console.log('[LIBRARY] Fetching storage contents for path:', bucketPath ?? '/');

      const { data: storageEntries, error: storageError } = await supabase.storage
        .from('media-library')
        .list(bucketPath, {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (storageError) {
        console.error('[LIBRARY] Storage error:', storageError);
        throw storageError;
      }

      const parsedItems: LibraryItem[] = [];

      storageEntries?.forEach((entry) => {
        if (!entry) {
          return;
        }

        const entryPath = pathForRequest ? `${pathForRequest}/${entry.name}` : entry.name;
        const isFolder = !entry.metadata;

        if (isFolder) {
          parsedItems.push({
            name: entry.name,
            path: entryPath,
            type: 'folder',
          });
          return;
        }

        if (entry.name === '.keep' || entry.name === '.emptyFolderPlaceholder') {
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('media-library')
          .getPublicUrl(entryPath);

        parsedItems.push({
          name: entry.name,
          path: entryPath,
          type: 'file',
          size: entry.metadata?.size ?? 0,
          mimeType: entry.metadata?.mimetype ?? 'application/octet-stream',
          url: publicUrlData.publicUrl,
        });
      });

      parsedItems.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'folder' ? -1 : 1;
      });

      const filteredParsedItems = parsedItems.filter(item => {
        if (item.type === 'folder' && (item.name === 'assignments' || item.path === 'assignments')) {
          return false;
        }
        return true;
      });

      console.log('[LIBRARY] Parsed storage items:', filteredParsedItems.length);

      // Load visibility info from database
      const folderPaths = filteredParsedItems.filter(i => i.type === 'folder').map(i => i.path);
      const filePaths = filteredParsedItems.filter(i => i.type === 'file').map(i => i.path);

      let folderVisibility: Record<string, { visibleToAll: boolean; visibleToUserIds: string[]; uploadedBy?: string }> = {};
      let fileVisibility: Record<string, { visibleToAll: boolean; visibleToUserIds: string[]; uploadedBy?: string }> = {};

      if (folderPaths.length > 0) {
        const { data: folderData } = await supabase
          .from('media_folders')
          .select('folder_path, visible_to_all, visible_to_user_ids, created_by')
          .in('folder_path', folderPaths);
        
        if (folderData) {
          folderData.forEach((f: any) => {
            folderVisibility[f.folder_path] = {
              visibleToAll: f.visible_to_all ?? true,
              visibleToUserIds: f.visible_to_user_ids || [],
              uploadedBy: f.created_by,
            };
          });
        }
      }

      if (filePaths.length > 0) {
        const { data: fileData } = await supabase
          .from('media_library')
          .select('path, visible_to_all, visible_to_user_ids, uploaded_by')
          .in('path', filePaths);
        
        if (fileData) {
          fileData.forEach((f: any) => {
            fileVisibility[f.path] = {
              visibleToAll: f.visible_to_all ?? true,
              visibleToUserIds: f.visible_to_user_ids || [],
              uploadedBy: f.uploaded_by,
            };
          });
        }
      }

      // Attach visibility info and filter based on current user
      const itemsWithVisibility = filteredParsedItems.map(item => {
        if (item.type === 'folder') {
          const vis = folderVisibility[item.path];
          return {
            ...item,
            visibleToAll: vis?.visibleToAll ?? true,
            visibleToUserIds: vis?.visibleToUserIds ?? [],
            hiddenBy: vis?.uploadedBy,
          };
        } else {
          const vis = fileVisibility[item.path];
          return {
            ...item,
            visibleToAll: vis?.visibleToAll ?? true,
            visibleToUserIds: vis?.visibleToUserIds ?? [],
            hiddenBy: vis?.uploadedBy,
          };
        }
      });

      // Filter items based on visibility and current user
      const filteredItems = isAdmin 
        ? itemsWithVisibility 
        : itemsWithVisibility.filter(item => {
            if (item.visibleToAll) {
              return true;
            }
            return item.visibleToUserIds?.includes(currentUser?.id ?? '');
          });

      console.log('[LIBRARY] Filtered items:', filteredItems.length);
      itemsCacheRef.current.set(cacheKey, filteredItems);

      if (latestPathRef.current === pathForRequest) {
        setItems(filteredItems);
      }
    } catch (error: any) {
      console.error('[LIBRARY] Load error:', error);
      setErrorMessage(`Fout bij laden: ${error.message || 'Onbekende fout'}`);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      if (latestPathRef.current === pathForRequest) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [currentPath, syncAllData, isAdmin, currentUser?.id]);

  const loadStorageUsage = useCallback(async () => {
    try {
      await refreshStorageUsageFromApp();
    } catch (error) {
      console.error('[LIBRARY] Storage usage error:', error);
    }
  }, [refreshStorageUsageFromApp]);

  useEffect(() => {
    latestPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    loadStorageUsage();
  }, [loadStorageUsage]);



  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, is_crown_admin')
          .order('username', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setAllUsers(data.map((u: any) => ({
            id: u.id,
            username: u.username,
            isCrownAdmin: u.is_crown_admin,
          })));
        }
      } catch (error) {
        console.error('[LIBRARY] Load users error:', error);
      }
    };
    
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleBack = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    itemsCacheRef.current.clear();
    await Promise.all([loadItems({ forceSync: true }), loadStorageUsage()]);
  }, [loadItems, loadStorageUsage]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    try {
      const newFolderPath = currentPath ? `${currentPath}/${folderName.trim()}` : folderName.trim();
      
      console.log('[FOLDER] Creating folder:', newFolderPath);

      await createFolder(newFolderPath);

      console.log('[FOLDER] Created successfully');
      
      setShowFolderModal(false);
      setFolderName("");
      itemsCacheRef.current.clear();
      await loadItems({ forceSync: true });
    } catch (error: any) {
      console.error('[FOLDER] Create error:', error);
      const message = error?.message || 'Onbekende fout';
      setErrorMessage(`Folder aanmaken mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleUploadMedia = () => {
    setShowActionSheet(false);
    
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*,audio/*,application/pdf,.doc,.docx';
      input.multiple = false;
      
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        console.log('[UPLOAD WEB] Selected file:', file.name, file.type, file.size);
        await uploadFileWeb(file);
      };
      
      input.click();
    } else {
      Alert.alert(
        'Media Type',
        'Selecteer het type media dat je wilt uploaden',
        [
          { text: 'Video', onPress: () => handleMediaSelection('video') },
          { text: 'Foto', onPress: () => handleMediaSelection('photo') },
          { text: 'Audio', onPress: () => handleMediaSelection('audio') },
          { text: 'Document', onPress: () => handleMediaSelection('document') },
          { text: 'Annuleren', style: 'cancel' }
        ]
      );
    }
  };

  const uploadFileWeb = async (file: File) => {
    let uploadId: string | null = null;
    
    try {
      setIsUploading(true);
      setErrorMessage(null);

      if (file.size > 400 * 1024 * 1024) {
        setIsUploading(false);
        setErrorMessage('Bestand is te groot. Maximum toegestane grootte is 400MB.');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }

      console.log('[UPLOAD WEB] Starting upload...', file.name);
      
      uploadId = startUpload(file.name);
      updateProgress(uploadId, 10);

      const arrayBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);
      
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folder = currentPath.trim().replace(/^\/+|\/+$/g, '');
      const storagePath = folder ? `${folder}/${timestamp}_${safeName}` : `${timestamp}_${safeName}`;

      console.log('[UPLOAD WEB] Uploading to Supabase Storage:', storagePath);
      updateProgress(uploadId, 30);

      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(storagePath, fileBytes, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error('[UPLOAD WEB] Storage error:', uploadError);
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      updateProgress(uploadId, 70);

      let fileType = 'other';
      if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('audio/')) fileType = 'audio';

      const { error: dbError } = await supabase
        .from('media_library')
        .insert({
          name: file.name,
          path: storagePath,
          folder_path: folder,
          file_type: fileType,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
          uploaded_by: currentUser?.id || null,
          visible_to_all: true,
          visible_to_user_ids: [],
        });

      if (dbError) {
        console.error('[UPLOAD WEB] DB error, cleaning up storage:', dbError);
        await supabase.storage.from('media-library').remove([storagePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      updateProgress(uploadId, 100);
      completeUpload(uploadId);
      
      setIsUploading(false);
      setErrorMessage('Upload succesvol!');
      setTimeout(() => setErrorMessage(null), 3000);
      itemsCacheRef.current.clear();
      await Promise.all([loadItems({ forceSync: true }), loadStorageUsage()]);
    } catch (error: any) {
      console.error('[UPLOAD WEB] Error:', error);
      if (uploadId) {
        cancelUpload(uploadId);
      }
      setIsUploading(false);
      const message = error?.message || 'Onbekende fout';
      setErrorMessage(`Upload mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleMediaSelection = async (type: 'video' | 'photo' | 'audio' | 'document') => {
    try {
      setErrorMessage(null);

      if (type === 'video' || type === 'photo') {
        console.log('[UPLOAD NATIVE] Requesting permissions...');
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
          setErrorMessage('Je moet toegang geven tot je media bibliotheek');
          setTimeout(() => setErrorMessage(null), 5000);
          return;
        }

        console.log('[UPLOAD NATIVE] Opening picker for:', type);
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: false,
        });

        if (result.canceled) {
          console.log('[UPLOAD NATIVE] Canceled');
          return;
        }

        const asset = result.assets[0];
        console.log('[UPLOAD NATIVE] Selected:', asset.uri, asset.fileSize);

        if (asset.fileSize && asset.fileSize > 400 * 1024 * 1024) {
          Alert.alert(
            'Bestand te groot',
            'Bestanden moeten kleiner zijn dan 400MB. Probeer het bestand te comprimeren voordat je het uploadt.',
            [{ text: 'OK' }]
          );
          return;
        }

        await uploadFileNative(asset.uri, asset.fileName || (type === 'video' ? 'video.mp4' : 'image.jpg'), asset.mimeType);
      } else if (type === 'audio') {
        console.log('[UPLOAD NATIVE] Opening audio picker...');
        const result = await DocumentPicker.getDocumentAsync({
          type: 'audio/*',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          console.log('[UPLOAD NATIVE] Canceled');
          return;
        }

        const file = result.assets[0];
        console.log('[UPLOAD NATIVE] Audio selected:', file.name, file.mimeType, file.size);

        await uploadFileNative(file.uri, file.name, file.mimeType || 'audio/mpeg');
      } else {
        console.log('[UPLOAD NATIVE] Opening document picker...');
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          console.log('[UPLOAD NATIVE] Canceled');
          return;
        }

        const file = result.assets[0];
        console.log('[UPLOAD NATIVE] Document selected:', file.name, file.mimeType, file.size);

        await uploadFileNative(file.uri, file.name, file.mimeType || 'application/octet-stream');
      }
    } catch (error: any) {
      console.error('[UPLOAD NATIVE] Error:', error);
      const message = error?.message || 'Onbekende fout';
      setErrorMessage(`Upload mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const uploadFileNative = async (uri: string, fileName: string, mimeType: string | undefined) => {
    let uploadId: string | null = null;

    try {
      setIsUploading(true);
      setErrorMessage(null);

      uploadId = startUpload(fileName);
      updateProgress(uploadId, 10);

      const timestamp = Date.now();
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folder = currentPath.trim().replace(/^\/+|\/+$/g, '');
      const storagePath = folder ? `${folder}/${timestamp}_${safeName}` : `${timestamp}_${safeName}`;

      const form = new FormData();
      form.append('file', {
        uri,
        name: safeName,
        type: mimeType || 'application/octet-stream',
      } as any);

      const uploadUrl = `${supabaseUrl}/storage/v1/object/media-library/${encodeURIComponent(storagePath)}`;
      updateProgress(uploadId, 30);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'x-upsert': 'false',
        },
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Upload error: ${res.status} ${res.statusText} ${txt}`);
      }

      updateProgress(uploadId, 70);

      let fileType: 'video' | 'image' | 'audio' | 'other' = 'other';
      if (mimeType?.startsWith('video/')) fileType = 'video';
      else if (mimeType?.startsWith('image/')) fileType = 'image';
      else if (mimeType?.startsWith('audio/')) fileType = 'audio';

      const file_size = 0;

      const { error: dbError } = await supabase
        .from('media_library')
        .insert({
          name: fileName,
          path: storagePath,
          folder_path: folder,
          file_type: fileType,
          file_size,
          mime_type: mimeType || 'application/octet-stream',
          storage_path: storagePath,
          uploaded_by: currentUser?.id || null,
          visible_to_all: true,
          visible_to_user_ids: [],
        });

      if (dbError) {
        await supabase.storage.from('media-library').remove([storagePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      updateProgress(uploadId, 100);
      completeUpload(uploadId);

      setIsUploading(false);
      setErrorMessage('Upload succesvol!');
      setTimeout(() => setErrorMessage(null), 3000);
      itemsCacheRef.current.clear();
      await Promise.all([loadItems({ forceSync: true }), loadStorageUsage()]);
    } catch (error: any) {
      if (uploadId) cancelUpload(uploadId);
      setIsUploading(false);
      const message = error?.message || 'Onbekende fout';
      setErrorMessage(`Upload mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  }, []);

  const handleLongPress = (item: LibraryItem) => {
    if (!isAdmin) {
      return;
    }
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedItems(new Set([item.path]));
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
      } else if (item.type === 'file') {
        if (item.mimeType.startsWith('video/')) {
          setCurrentVideoUrl(item.url);
          setVideoPlayerVisible(true);
        } else if (item.mimeType.startsWith('audio/')) {
          setCurrentAudioUrl(item.url);
          setCurrentAudioTitle(item.name);
          setAudioPlayerVisible(true);
        } else if (item.mimeType.startsWith('image/')) {
          setCurrentImageUrl(item.url);
          setImageViewerVisible(true);
        } else {
          if (Platform.OS === 'web') {
            window.open(item.url, '_blank');
          }
        }
      }
    }
  };

  const handleRenameSelected = () => {
    if (selectedItems.size !== 1) return;
    
    const itemPath = Array.from(selectedItems)[0];
    const item = items.find(i => i.path === itemPath);
    if (!item) return;

    setRenameItem(item);
    setNewFileName(item.name);
    setShowRenameModal(true);
  };

  const handleVisibilitySelected = async () => {
    if (selectedItems.size !== 1) return;
    
    const itemPath = Array.from(selectedItems)[0];
    const item = items.find(i => i.path === itemPath);
    if (!item) return;

    setVisibilityItem(item);
    
    try {
      if (item.type === 'folder') {
        const { data, error } = await supabase
          .from('media_folders')
          .select('visible_to_all, visible_to_user_ids')
          .eq('folder_path', item.path)
          .maybeSingle();
        
        if (!error && data) {
          setVisibilityToAll((data as any).visible_to_all ?? true);
          setSelectedUserIds(new Set((data as any).visible_to_user_ids || []));
        } else {
          setVisibilityToAll(true);
          setSelectedUserIds(new Set());
        }
      } else {
        const { data, error } = await supabase
          .from('media_library')
          .select('visible_to_all, visible_to_user_ids')
          .eq('path', item.path)
          .maybeSingle();
        
        if (!error && data) {
          setVisibilityToAll((data as any).visible_to_all ?? true);
          setSelectedUserIds(new Set((data as any).visible_to_user_ids || []));
        } else {
          setVisibilityToAll(true);
          setSelectedUserIds(new Set());
        }
      }
    } catch (error: any) {
      console.error('[VISIBILITY] Load error:', error?.message || error);
      setVisibilityToAll(true);
      setSelectedUserIds(new Set());
    }
    
    setShowVisibilityModal(true);
  };

  const handleUpdateVisibility = async () => {
    if (!visibilityItem) return;

    try {
      setIsUpdatingVisibility(true);
      setErrorMessage(null);

      console.log('[VISIBILITY] Updating...', visibilityItem.path);

      const updateData = {
        visible_to_all: visibilityToAll,
        visible_to_user_ids: visibilityToAll ? [] : Array.from(selectedUserIds),
      };

      if (visibilityItem.type === 'folder') {
        const { data: existing } = await supabase
          .from('media_folders')
          .select('id')
          .eq('folder_path', visibilityItem.path)
          .maybeSingle();

        if (existing) {
          const { error } = await (supabase as any)
            .from('media_folders')
            .update(updateData)
            .eq('folder_path', visibilityItem.path);

          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from('media_folders')
            .insert({
              name: visibilityItem.name,
              folder_path: visibilityItem.path,
              parent_path: currentPath || null,
              ...updateData,
            });

          if (error) throw error;
        }
      } else {
        const { data: existing } = await supabase
          .from('media_library')
          .select('id')
          .eq('path', visibilityItem.path)
          .maybeSingle();

        if (existing) {
          const { error } = await (supabase as any)
            .from('media_library')
            .update(updateData)
            .eq('path', visibilityItem.path);

          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from('media_library')
            .insert({
              name: visibilityItem.name,
              path: visibilityItem.path,
              folder_path: currentPath || '',
              file_type: visibilityItem.mimeType.startsWith('video/') ? 'video' : visibilityItem.mimeType.startsWith('image/') ? 'image' : visibilityItem.mimeType.startsWith('audio/') ? 'audio' : 'other',
              file_size: visibilityItem.size,
              mime_type: visibilityItem.mimeType,
              storage_path: visibilityItem.path,
              ...updateData,
            });

          if (error) throw error;
        }
      }

      console.log('[VISIBILITY] Success!');

      setShowVisibilityModal(false);
      setVisibilityItem(null);
      setVisibilityToAll(true);
      setSelectedUserIds(new Set());
      setSelectionMode(false);
      setSelectedItems(new Set());
      
      itemsCacheRef.current.clear();
      await loadItems({ forceSync: true });
      
      setErrorMessage('Zichtbaarheid bijgewerkt!');
      setTimeout(() => setErrorMessage(null), 3000);
    } catch (error: any) {
      console.error('[VISIBILITY] Error:', error?.message || error);
      const message = error?.message || JSON.stringify(error) || 'Onbekende fout';
      setErrorMessage(`Bijwerken mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleToggleUserVisibility = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleRename = async () => {
    if (!renameItem || !newFileName.trim() || newFileName === renameItem.name) return;

    try {
      setIsRenaming(true);
      setErrorMessage(null);

      console.log('[RENAME] Starting rename...', renameItem.path, '->', newFileName);

      const pathParts = renameItem.path.split('/');
      pathParts[pathParts.length - 1] = newFileName.trim();
      const newPath = pathParts.join('/');

      // Copy the file to new location
      const { error: copyError } = await supabase.storage
        .from('media-library')
        .copy(renameItem.path, newPath);

      if (copyError) {
        console.error('[RENAME] Copy error:', copyError);
        throw copyError;
      }

      // Delete the old file
      const { error: deleteError } = await supabase.storage
        .from('media-library')
        .remove([renameItem.path]);

      if (deleteError) {
        console.error('[RENAME] Delete error:', deleteError);
        // Try to clean up the copied file
        await supabase.storage.from('media-library').remove([newPath]);
        throw deleteError;
      }

      console.log('[RENAME] Success!');

      setShowRenameModal(false);
      setRenameItem(null);
      setNewFileName('');
      setSelectionMode(false);
      setSelectedItems(new Set());
      
      setErrorMessage('Bestand hernoemd!');
      setTimeout(() => setErrorMessage(null), 3000);
      
      itemsCacheRef.current.clear();
      await loadItems({ forceSync: true });
    } catch (error: any) {
      console.error('[RENAME] Error:', error);
      const message = error?.message || 'Onbekende fout';
      setErrorMessage(`Hernoemen mislukt: ${message}`);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsRenaming(false);
    }
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
        itemsCacheRef.current.clear();
        await Promise.all([loadItems({ forceSync: true }), loadStorageUsage()]);
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
      <View style={styles.container} testID="library-screen">
        <LinearGradient 
          colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
          style={styles.headerBg} 
          locations={[0, 0.3, 1]}
        />
        
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.appName}>OneBand</Text>
              <Text style={styles.title}>{t.library.title}</Text>
              {breadcrumbText ? (
                <Text style={styles.breadcrumb}>{breadcrumbText}</Text>
              ) : null}
            </View>
            <View style={styles.headerActions}>
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
                <Pressable 
                  style={({ pressed }) => [
                    styles.card,
                    isSelected && styles.cardSelected,
                    pressed && !selectionMode ? styles.cardPressed : null,
                  ]}
                  onPress={() => handleItemPress(item)}
                  onLongPress={() => handleLongPress(item)}
                  delayLongPress={250}
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
                  {!selectionMode && !item.visibleToAll && isAdmin && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setVisibilityDetailItem(item);
                        setShowVisibilityDetailModal(true);
                      }}
                      style={styles.visibilityIndicatorButton}
                      testID={`visibility-indicator-${item.path}`}
                    >
                      <EyeOff color={Colors.light.muted} size={18} strokeWidth={2.5} />
                    </Pressable>
                  )}
                  {!selectionMode && <ChevronRight color={Colors.light.muted} size={20} />}
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



        <Modal
          visible={showRenameModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowRenameModal(false);
            setRenameItem(null);
            setNewFileName('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Bestand hernoemen</Text>
                <Pressable onPress={() => {
                  setShowRenameModal(false);
                  setRenameItem(null);
                  setNewFileName('');
                }} testID="close-rename-modal">
                  <X color={Colors.light.muted} size={24} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nieuwe naam</Text>
                <TextInput
                  style={styles.input}
                  value={newFileName}
                  onChangeText={setNewFileName}
                  placeholder="Voer nieuwe naam in"
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
                    setRenameItem(null);
                    setNewFileName('');
                  }}
                  testID="cancel-rename-button"
                >
                  <Text style={styles.cancelButtonText}>{t.library.cancel}</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.actionButton, styles.createButton, (!newFileName.trim() || newFileName === renameItem?.name || isRenaming) && styles.disabledButton]}
                  onPress={handleRename}
                  disabled={!newFileName.trim() || newFileName === renameItem?.name || isRenaming}
                  testID="confirm-rename-button"
                >
                  <LinearGradient
                    colors={(newFileName.trim() && newFileName !== renameItem?.name && !isRenaming) ? [Colors.light.primary, Colors.light.primaryDark] : [Colors.light.surfaceLight, Colors.light.surfaceLight]}
                    style={styles.createButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isRenaming ? (
                      <ActivityIndicator size="small" color={Colors.light.text} />
                    ) : (
                      <Text style={[styles.createButtonText, (!newFileName.trim() || newFileName === renameItem?.name) && styles.disabledButtonText]}>Hernoemen</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showVisibilityModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowVisibilityModal(false);
            setVisibilityItem(null);
            setVisibilityToAll(true);
            setSelectedUserIds(new Set());
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Zichtbaarheid</Text>
                <Pressable onPress={() => {
                  setShowVisibilityModal(false);
                  setVisibilityItem(null);
                  setVisibilityToAll(true);
                  setSelectedUserIds(new Set());
                }} testID="close-visibility-modal">
                  <X color={Colors.light.muted} size={24} />
                </Pressable>
              </View>

              <View style={styles.visibilityContainer}>
                <Pressable
                  style={[styles.visibilityOption, visibilityToAll && styles.visibilityOptionActive]}
                  onPress={() => setVisibilityToAll(true)}
                  testID="visibility-all"
                >
                  <View style={styles.visibilityRadio}>
                    {visibilityToAll && <View style={styles.visibilityRadioActive} />}
                  </View>
                  <Text style={[styles.visibilityOptionText, visibilityToAll && styles.visibilityOptionTextActive]}>
                    Zichtbaar voor iedereen
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.visibilityOption, !visibilityToAll && styles.visibilityOptionActive]}
                  onPress={() => setVisibilityToAll(false)}
                  testID="visibility-specific"
                >
                  <View style={styles.visibilityRadio}>
                    {!visibilityToAll && <View style={styles.visibilityRadioActive} />}
                  </View>
                  <Text style={[styles.visibilityOptionText, !visibilityToAll && styles.visibilityOptionTextActive]}>
                    Zichtbaar voor specifieke leden
                  </Text>
                </Pressable>

                {!visibilityToAll && (
                  <ScrollView style={styles.usersList}>
                    {allUsers
                      .filter(u => !u.isCrownAdmin)
                      .map(user => (
                        <Pressable
                          key={user.id}
                          style={[styles.userItem, selectedUserIds.has(user.id) && styles.userItemSelected]}
                          onPress={() => handleToggleUserVisibility(user.id)}
                          testID={`user-${user.id}`}
                        >
                          <View style={styles.userCheckbox}>
                            {selectedUserIds.has(user.id) && <CheckCircle2 color={Colors.light.primary} size={20} strokeWidth={2.5} />}
                          </View>
                          <Text style={[styles.userItemText, selectedUserIds.has(user.id) && styles.userItemTextSelected]}>
                            {user.username}
                          </Text>
                        </Pressable>
                      ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setShowVisibilityModal(false);
                    setVisibilityItem(null);
                    setVisibilityToAll(true);
                    setSelectedUserIds(new Set());
                  }}
                  testID="cancel-visibility-button"
                >
                  <Text style={styles.cancelButtonText}>Annuleren</Text>
                </Pressable>
                
                <Pressable
                  style={[styles.actionButton, styles.createButton, isUpdatingVisibility && styles.disabledButton]}
                  onPress={handleUpdateVisibility}
                  disabled={isUpdatingVisibility}
                  testID="confirm-visibility-button"
                >
                  <LinearGradient
                    colors={!isUpdatingVisibility ? [Colors.light.primary, Colors.light.primaryDark] : [Colors.light.surfaceLight, Colors.light.surfaceLight]}
                    style={styles.createButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isUpdatingVisibility ? (
                      <ActivityIndicator size="small" color={Colors.light.text} />
                    ) : (
                      <Text style={styles.createButtonText}>Opslaan</Text>
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
                    {t.library.uploadMedia}
                  </Text>
                  <Text style={styles.actionSheetSubtitle}>
                    {t.library.uploadDescription}
                  </Text>
                </View>
                {!isUploading && <ChevronRight color={Colors.light.muted} size={20} />}
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
                <>
                  <Pressable 
                    style={[styles.toolbarActionButton, isRenaming && styles.toolbarButtonDisabled]}
                    onPress={handleRenameSelected}
                    disabled={isRenaming}
                    testID="rename-selected-button"
                  >
                    <Edit2 color={Colors.light.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.toolbarButtonText}>{t.library.rename || 'Hernoemen'}</Text>
                  </Pressable>
                  
                  <Pressable 
                    style={styles.toolbarActionButton}
                    onPress={handleVisibilitySelected}
                    testID="visibility-selected-button"
                  >
                    <Eye color={Colors.light.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.toolbarButtonText}>Zichtbaarheid</Text>
                  </Pressable>
                </>
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
        ) : isAdmin ? (
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

        <VideoPlayerModal
          visible={videoPlayerVisible}
          videoUrl={currentVideoUrl}
          onClose={() => {
            setVideoPlayerVisible(false);
            setCurrentVideoUrl('');
          }}
        />

        <AudioPlayerModal
          visible={audioPlayerVisible}
          audioUri={currentAudioUrl}
          audioTitle={currentAudioTitle}
          onClose={() => {
            setAudioPlayerVisible(false);
            setCurrentAudioUrl('');
            setCurrentAudioTitle('');
          }}
        />

        <ImageViewerModal
          visible={imageViewerVisible}
          imageUrl={currentImageUrl}
          onClose={() => {
            setImageViewerVisible(false);
            setCurrentImageUrl('');
          }}
        />

        <Modal
          visible={showVisibilityDetailModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowVisibilityDetailModal(false);
            setVisibilityDetailItem(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Zichtbaarheidsdetails</Text>
                <Pressable onPress={() => {
                  setShowVisibilityDetailModal(false);
                  setVisibilityDetailItem(null);
                }} testID="close-visibility-detail-modal">
                  <X color={Colors.light.muted} size={24} />
                </Pressable>
              </View>

              <View style={styles.visibilityDetailContainer}>
                <Text style={styles.visibilityDetailLabel}>Item:</Text>
                <Text style={styles.visibilityDetailValue}>{visibilityDetailItem?.name}</Text>

                <Text style={[styles.visibilityDetailLabel, { marginTop: 16 }]}>Type:</Text>
                <Text style={styles.visibilityDetailValue}>
                  {visibilityDetailItem?.type === 'folder' ? 'Map' : 'Bestand'}
                </Text>

                {visibilityDetailItem?.hiddenBy && (
                  <>
                    <Text style={[styles.visibilityDetailLabel, { marginTop: 16 }]}>Ingesteld door:</Text>
                    <Text style={styles.visibilityDetailValue}>
                      {allUsers.find(u => u.id === visibilityDetailItem.hiddenBy)?.username || 'Onbekend'}
                    </Text>
                  </>
                )}

                <Text style={[styles.visibilityDetailLabel, { marginTop: 16 }]}>Zichtbaar voor:</Text>
                {visibilityDetailItem?.visibleToAll ? (
                  <Text style={styles.visibilityDetailValue}>Iedereen</Text>
                ) : (
                  <ScrollView style={styles.visibilityDetailUsersList}>
                    {visibilityDetailItem?.visibleToUserIds && visibilityDetailItem.visibleToUserIds.length > 0 ? (
                      visibilityDetailItem.visibleToUserIds.map(userId => {
                        const user = allUsers.find(u => u.id === userId);
                        return (
                          <View key={userId} style={styles.visibilityDetailUserItem}>
                            <Text style={styles.visibilityDetailUserText}>
                              {user?.username || 'Onbekende gebruiker'}
                            </Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.visibilityDetailValue}>Niemand (alleen admins)</Text>
                    )}
                  </ScrollView>
                )}

                {!visibilityDetailItem?.visibleToAll && (
                  <>
                    <Text style={[styles.visibilityDetailLabel, { marginTop: 16 }]}>Verborgen voor:</Text>
                    <ScrollView style={styles.visibilityDetailUsersList}>
                      {allUsers
                        .filter(u => !u.isCrownAdmin && !visibilityDetailItem?.visibleToUserIds?.includes(u.id))
                        .map(user => (
                          <View key={user.id} style={styles.visibilityDetailUserItem}>
                            <Text style={styles.visibilityDetailUserText}>
                              {user.username}
                            </Text>
                          </View>
                        ))}
                    </ScrollView>
                  </>
                )}
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.actionButton, styles.cancelButton, { flex: 1 }]}
                  onPress={() => {
                    setShowVisibilityDetailModal(false);
                    setVisibilityDetailItem(null);
                  }}
                  testID="close-visibility-detail-button"
                >
                  <Text style={styles.cancelButtonText}>Sluiten</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <MenuModal visible={showMenuModal} onClose={() => setShowMenuModal(false)} />
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
  cardPressed: {
    transform: [{ scale: 0.98 }],
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    backgroundColor: Colors.light.surface,
  },
  editButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  editButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  editButtonTextActive: {
    color: Colors.light.text,
  },
  toolbarText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  visibilityContainer: {
    gap: 12,
    marginBottom: 24,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  visibilityOptionActive: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}15`,
  },
  visibilityRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.muted,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityRadioActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },
  visibilityOptionText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  visibilityOptionTextActive: {
    fontWeight: '700' as const,
  },
  usersList: {
    maxHeight: 300,
    marginTop: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userItemSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}15`,
  },
  userCheckbox: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userItemText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  userItemTextSelected: {
    fontWeight: '700' as const,
  },
  visibilityIndicatorButton: {
    padding: 8,
    marginRight: 4,
  },
  visibilityDetailContainer: {
    marginBottom: 24,
  },
  visibilityDetailLabel: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  visibilityDetailValue: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  visibilityDetailUsersList: {
    maxHeight: 200,
  },
  visibilityDetailUserItem: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  visibilityDetailUserText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
