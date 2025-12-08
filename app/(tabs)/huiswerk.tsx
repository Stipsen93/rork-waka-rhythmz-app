import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, Platform, TouchableOpacity, ActivityIndicator, FlatList, Image, Linking } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useAppState, Assignment } from "@/providers/AppState";
import { useState, useEffect, useMemo } from "react";
import { Plus, X, Calendar, Users, Video, Image as ImageIcon, Music, FileText, Trash2, CheckCircle2, Folder, Upload, ArrowLeft, ChevronRight, ChevronLeft, Check, Play } from "lucide-react-native";
import { MenuButton, MenuModal } from "@/app/(tabs)/_layout";

import * as DocumentPicker from 'expo-document-picker';
import { supabase } from "@/lib/supabase";

const DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function AddAssignmentModal({ visible, onClose, editingAssignment }: { visible: boolean; onClose: () => void; editingAssignment?: Assignment }) {
  const { addAssignment, updateAssignment, users, groups, uploadMedia } = useAppState();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState<string>(editingAssignment?.title ?? "");
  const [description, setDescription] = useState<string>(editingAssignment?.description ?? "");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(editingAssignment?.assignedUserIds ?? []);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>(editingAssignment?.dueDate ? new Date(editingAssignment.dueDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date());
  const [mediaUri, setMediaUri] = useState<string>(editingAssignment?.mediaUri ?? "");
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'audio' | undefined>(editingAssignment?.mediaType);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaExplorer, setShowMediaExplorer] = useState(false);
  const [explorerPath, setExplorerPath] = useState<string>("");
  const [requireMedia, setRequireMedia] = useState<boolean>(editingAssignment?.requireMedia ?? false);

  useEffect(() => {
    if (editingAssignment) {
      setTitle(editingAssignment.title);
      setDescription(editingAssignment.description);
      setSelectedUserIds(editingAssignment.assignedUserIds);
      setDueDate(editingAssignment.dueDate ? new Date(editingAssignment.dueDate) : new Date());
      setMediaUri(editingAssignment.mediaUri ?? "");
      setMediaType(editingAssignment.mediaType);
      setRequireMedia(editingAssignment.requireMedia);
    } else {
      resetForm();
    }
  }, [editingAssignment]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedUserIds([]);
    setSelectedGroupIds([]);
    setDueDate(new Date());
    setMediaUri("");
    setMediaType(undefined);
    setRequireMedia(false);
    setIsUploading(false);
    setShowMediaExplorer(false);
    setExplorerPath("");
  };

  const handleOpenMediaExplorer = () => {
    setShowMediaExplorer(true);
    setExplorerPath("");
  };

  const handleSelectMedia = (media: any) => {
    const { data } = supabase.storage
      .from('media-library')
      .getPublicUrl(media.storage_path);
    
    setMediaUri(data.publicUrl);
    
    if (media.mime_type?.startsWith('video/')) {
      setMediaType('video');
    } else if (media.mime_type?.startsWith('image/')) {
      setMediaType('image');
    } else if (media.mime_type?.startsWith('audio/')) {
      setMediaType('audio');
    }
    
    setShowMediaExplorer(false);
    setExplorerPath("");
  };

  const pickAndUploadMedia = async () => {
    try {
      setIsUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsUploading(false);
        return;
      }

      const file = result.assets[0];
      const fileType = file.mimeType?.startsWith('video/')
        ? 'video'
        : file.mimeType?.startsWith('image/')
          ? 'image'
          : file.mimeType?.startsWith('audio/')
            ? 'audio'
            : 'other';

      const response = await fetch(file.uri);
      const blob = await response.blob();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!reader.result) {
            reject(new Error('Leeg bestand'));
            return;
          }
          const resultString = reader.result as string;
          const base64 = resultString.includes(',') ? resultString.split(',')[1] : resultString;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error(`FileReader fout: ${reader.error?.message || 'Onbekende fout'}`));
        reader.readAsDataURL(blob);
      });

      console.log('[ASSIGNMENT UPLOAD] Uploading to assignment-submissions bucket...');
      
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `assignments/${fileName}`;
      
      const arrayBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, arrayBuffer, {
          contentType: file.mimeType || 'application/octet-stream',
          upsert: false,
        });
      
      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }
      
      const { data } = supabase.storage
        .from('assignment-submissions')
        .getPublicUrl(uploadData.path);

      setMediaUri(data.publicUrl);

      if (fileType === 'video') {
        setMediaType('video');
      } else if (fileType === 'image') {
        setMediaType('image');
      } else if (fileType === 'audio') {
        setMediaType('audio');
      } else {
        setMediaType(undefined);
      }

      Alert.alert("Succes", "Media is succesvol geüpload!");
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert("Fout", "Er is een fout opgetreden bij het uploaden van media");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Fout", "Voer een titel in voor de opdracht");
      return;
    }

    const allSelectedUserIds = [...selectedUserIds];
    selectedGroupIds.forEach(groupId => {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        group.memberIds.forEach(userId => {
          if (!allSelectedUserIds.includes(userId)) {
            allSelectedUserIds.push(userId);
          }
        });
      }
    });

    if (editingAssignment) {
      updateAssignment(editingAssignment.id, {
        title: title.trim(),
        description: description.trim(),
        assignedUserIds: allSelectedUserIds,
        dueDate: dueDate.toISOString(),
        mediaUri: mediaUri.trim() || undefined,
        mediaType,
        requireMedia,
      });
      Alert.alert("Succes", "Huiswerk opdracht is bijgewerkt!");
    } else {
      addAssignment({
        title: title.trim(),
        description: description.trim(),
        assignedUserIds: allSelectedUserIds,
        dueDate: dueDate.toISOString(),
        mediaUri: mediaUri.trim() || undefined,
        mediaType,
        requireMedia,
      });
      Alert.alert("Succes", "Huiswerk opdracht is toegevoegd!");
    }

    resetForm();
    onClose();
  };

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const selectAllUsers = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const toggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const selectAllGroups = () => {
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(groups.map(g => g.id));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={localStyles.modalOverlay}>
        <View style={[localStyles.modalContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <View style={localStyles.modalHeader}>
            <Text style={localStyles.modalTitle}>{editingAssignment ? "Opdracht Bewerken" : "Nieuwe Opdracht"}</Text>
            <Pressable onPress={onClose}>
              <X color={Colors.light.text} size={28} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView style={localStyles.modalScroll} contentContainerStyle={localStyles.modalScrollContent}>
            <Text style={localStyles.label}>Opdracht Naam</Text>
            <TextInput
              style={localStyles.input}
              placeholder="Bijv. Groove oefening week 3"
              placeholderTextColor={Colors.light.muted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={localStyles.label}>Omschrijving</Text>
            <TextInput
              style={[localStyles.input, localStyles.textArea]}
              placeholder="Beschrijf de opdracht..."
              placeholderTextColor={Colors.light.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <View style={localStyles.membersSection}>
              <View style={localStyles.membersSectionHeader}>
                <Text style={localStyles.label}>Selecteer Groepen</Text>
                <Pressable onPress={selectAllGroups} style={localStyles.selectAllButton}>
                  <Text style={localStyles.selectAllText}>
                    {selectedGroupIds.length === groups.length ? "Deselecteer Alles" : "Selecteer Alles"}
                  </Text>
                </Pressable>
              </View>
              <View style={localStyles.membersList}>
                {groups.map(group => (
                  <Pressable
                    key={group.id}
                    style={[localStyles.memberChip, selectedGroupIds.includes(group.id) && localStyles.memberChipSelected]}
                    onPress={() => toggleGroup(group.id)}
                  >
                    <Text style={[localStyles.memberChipText, selectedGroupIds.includes(group.id) && localStyles.memberChipTextSelected]}>
                      {group.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={localStyles.membersSection}>
              <View style={localStyles.membersSectionHeader}>
                <Text style={localStyles.label}>Selecteer Leden</Text>
                <Pressable onPress={selectAllUsers} style={localStyles.selectAllButton}>
                  <Text style={localStyles.selectAllText}>
                    {selectedUserIds.length === users.length ? "Deselecteer Alles" : "Selecteer Alles"}
                  </Text>
                </Pressable>
              </View>
              <View style={localStyles.membersList}>
                {users.map(user => (
                  <Pressable
                    key={user.id}
                    style={[localStyles.memberChip, selectedUserIds.includes(user.id) && localStyles.memberChipSelected]}
                    onPress={() => toggleUser(user.id)}
                  >
                    <Text style={[localStyles.memberChipText, selectedUserIds.includes(user.id) && localStyles.memberChipTextSelected]}>
                      {user.username}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Text style={localStyles.label}>Deadline Datum & Tijd</Text>
            <View style={localStyles.dateTimeContainer}>
              <Pressable
                style={localStyles.dateTimeButton}
                onPress={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowHourPicker(false);
                  if (!showDatePicker) {
                    setPickerMonth(dueDate);
                  }
                }}
              >
                <Calendar color={Colors.light.primary} size={20} />
                <Text style={localStyles.dateTimeText}>
                  {dueDate.toLocaleDateString("nl-NL", { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
              </Pressable>
              <Pressable
                style={localStyles.dateTimeButton}
                onPress={() => {
                  setShowHourPicker(!showHourPicker);
                  setShowDatePicker(false);
                }}
              >
                <Text style={localStyles.dateTimeText}>
                  {dueDate.toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <View style={localStyles.calendarPickerContainer}>
                <View style={localStyles.calendarPickerHeader}>
                  <TouchableOpacity 
                    onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}
                    style={localStyles.calendarPickerButton}
                  >
                    <ChevronLeft color={Colors.light.text} size={20} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text style={localStyles.calendarPickerMonth}>
                    {MONTHS[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}
                    style={localStyles.calendarPickerButton}
                  >
                    <ChevronRight color={Colors.light.text} size={20} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                <View style={localStyles.calendarPickerWeekDays}>
                  {DAYS.map((day) => (
                    <Text key={day} style={localStyles.calendarPickerWeekDay}>{day}</Text>
                  ))}
                </View>
                <View style={localStyles.calendarPickerGrid}>
                  {(() => {
                    const year = pickerMonth.getFullYear();
                    const month = pickerMonth.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    const startDayOfWeek = firstDay.getDay();
                    const daysInMonth = lastDay.getDate();
                    const days: { date: number; isCurrentMonth: boolean; fullDate: string }[] = [];
                    
                    for (let i = 0; i < startDayOfWeek; i++) {
                      const prevMonthDay = new Date(year, month, -startDayOfWeek + i + 1);
                      days.push({
                        date: prevMonthDay.getDate(),
                        isCurrentMonth: false,
                        fullDate: formatDateToLocal(prevMonthDay),
                      });
                    }
                    
                    for (let i = 1; i <= daysInMonth; i++) {
                      const fullDate = new Date(year, month, i);
                      days.push({
                        date: i,
                        isCurrentMonth: true,
                        fullDate: formatDateToLocal(fullDate),
                      });
                    }
                    
                    const remainingDays = 42 - days.length;
                    for (let i = 1; i <= remainingDays; i++) {
                      const nextMonthDay = new Date(year, month + 1, i);
                      days.push({
                        date: i,
                        isCurrentMonth: false,
                        fullDate: formatDateToLocal(nextMonthDay),
                      });
                    }
                    
                    return days;
                  })().map((day, index) => {
                    const selectedDate = formatDateToLocal(dueDate);
                    return (
                      <TouchableOpacity
                        key={`${day.fullDate}-${index}`}
                        style={localStyles.calendarPickerDay}
                        onPress={() => {
                          if (day.isCurrentMonth) {
                            const [year, month, dayNum] = day.fullDate.split('-').map(Number);
                            const newDate = new Date(dueDate);
                            newDate.setFullYear(year, month - 1, dayNum);
                            setDueDate(newDate);
                            setShowDatePicker(false);
                          }
                        }}
                        disabled={!day.isCurrentMonth}
                      >
                        <View style={[
                          localStyles.calendarPickerDayCircle,
                          !day.isCurrentMonth && localStyles.calendarPickerDayInactive,
                          selectedDate === day.fullDate && localStyles.calendarPickerDaySelected,
                        ]}>
                          <Text style={[
                            localStyles.calendarPickerDayText,
                            !day.isCurrentMonth && localStyles.calendarPickerDayTextInactive,
                            selectedDate === day.fullDate && localStyles.calendarPickerDayTextSelected,
                          ]}>
                            {day.date}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {showHourPicker && (
              <View style={localStyles.timePickerContainer}>
                <View style={localStyles.timePickerContent}>
                  <View style={localStyles.timePickerColumn}>
                    <Text style={localStyles.timePickerColumnLabel}>Uur</Text>
                    <ScrollView 
                      style={localStyles.timePickerScroll}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = String(i).padStart(2, '0');
                        const isSelected = String(dueDate.getHours()).padStart(2, '0') === hour;
                        return (
                          <TouchableOpacity
                            key={hour}
                            style={[
                              localStyles.timePickerItem,
                              isSelected && localStyles.timePickerItemSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(dueDate);
                              newDate.setHours(parseInt(hour));
                              setDueDate(newDate);
                            }}
                          >
                            <Text style={[
                              localStyles.timePickerItemText,
                              isSelected && localStyles.timePickerItemTextSelected
                            ]}>
                              {hour}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                  <Text style={localStyles.timePickerColon}>:</Text>
                  <View style={localStyles.timePickerColumn}>
                    <Text style={localStyles.timePickerColumnLabel}>Min</Text>
                    <ScrollView 
                      style={localStyles.timePickerScroll}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const minute = String(i * 5).padStart(2, '0');
                        const isSelected = String(Math.floor(dueDate.getMinutes() / 5) * 5).padStart(2, '0') === minute;
                        return (
                          <TouchableOpacity
                            key={minute}
                            style={[
                              localStyles.timePickerItem,
                              isSelected && localStyles.timePickerItemSelected
                            ]}
                            onPress={() => {
                              const newDate = new Date(dueDate);
                              newDate.setMinutes(parseInt(minute));
                              setDueDate(newDate);
                            }}
                          >
                            <Text style={[
                              localStyles.timePickerItemText,
                              isSelected && localStyles.timePickerItemTextSelected
                            ]}>
                              {minute}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
                <TouchableOpacity
                  style={localStyles.timePickerDoneButton}
                  onPress={() => setShowHourPicker(false)}
                >
                  <Text style={localStyles.timePickerDoneButtonText}>Klaar</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={localStyles.label}>Media (Optioneel)</Text>
            <View style={localStyles.mediaButtonsContainer}>
              <Pressable
                style={localStyles.mediaOptionButton}
                onPress={handleOpenMediaExplorer}
              >
                <Folder color={Colors.light.primary} size={20} />
                <Text style={localStyles.mediaOptionButtonText}>
                  Kies uit bibliotheek
                </Text>
              </Pressable>
              
              <Pressable
                style={localStyles.mediaOptionButton}
                onPress={pickAndUploadMedia}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                ) : (
                  <Upload color={Colors.light.primary} size={20} />
                )}
                <Text style={localStyles.mediaOptionButtonText}>
                  {isUploading ? "Uploaden..." : "Upload media"}
                </Text>
              </Pressable>
            </View>

            {mediaUri && (
              <View style={localStyles.uploadedMediaContainer}>
                <View style={localStyles.uploadedMediaInfo}>
                  {mediaType === 'video' && <Video color={Colors.light.primary} size={20} />}
                  {mediaType === 'image' && <ImageIcon color={Colors.light.primary} size={20} />}
                  {mediaType === 'audio' && <Music color={Colors.light.primary} size={20} />}
                  <Text style={localStyles.uploadedMediaText} numberOfLines={1}>
                    {mediaType === 'video' ? 'Video' : mediaType === 'image' ? 'Foto' : 'Audio'} bestand
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setMediaUri("");
                    setMediaType(undefined);
                  }}
                >
                  <X color={Colors.light.muted} size={20} />
                </Pressable>
              </View>
            )}

            <Pressable
              style={localStyles.checkboxRow}
              onPress={() => setRequireMedia(!requireMedia)}
            >
              <View style={[localStyles.checkbox, requireMedia && localStyles.checkboxChecked]}>
                {requireMedia && <Check color={Colors.light.text} size={16} strokeWidth={3} />}
              </View>
              <Text style={localStyles.checkboxLabel}>Media vereist</Text>
            </Pressable>

            <Pressable
              style={[localStyles.submitButton, { opacity: title ? 1 : 0.5 }]}
              disabled={!title}
              onPress={handleSubmit}
            >
              <Plus color={Colors.light.text} size={20} strokeWidth={2.5} />
              <Text style={localStyles.submitButtonText}>{editingAssignment ? "Opdracht Bijwerken" : "Opdracht Toevoegen"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>

      <MediaExplorerModal
        visible={showMediaExplorer}
        currentPath={explorerPath}
        onClose={() => {
          setShowMediaExplorer(false);
          setExplorerPath("");
        }}
        onNavigate={setExplorerPath}
        onSelectMedia={handleSelectMedia}
      />
    </Modal>
  );
}

function MediaExplorerModal({ 
  visible, 
  currentPath, 
  onClose, 
  onNavigate, 
  onSelectMedia 
}: { 
  visible: boolean; 
  currentPath: string; 
  onClose: () => void; 
  onNavigate: (path: string) => void;
  onSelectMedia: (media: any) => void;
}) {
  const { mediaLibrary, getFolders, getMediaInFolder } = useAppState();
  const insets = useSafeAreaInsets();

  const folders = useMemo(() => {
    const allFolderPaths = getFolders();
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
    
    mediaLibrary.forEach((item) => {
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
  }, [mediaLibrary, currentPath]);

  const mediaItems = useMemo(() => {
    return getMediaInFolder(currentPath)
      .filter(m => m.name !== '.emptyFolderPlaceholder')
      .filter(m => {
        const type = m.file_type;
        return type === 'video' || type === 'image' || type === 'audio';
      });
  }, [currentPath, getMediaInFolder]);

  const breadcrumbText = useMemo(() => {
    if (!currentPath) return 'Bibliotheek';
    return currentPath.split('/').join(' > ');
  }, [currentPath]);

  const handleBack = () => {
    const parts = currentPath.split('/');
    parts.pop();
    onNavigate(parts.join('/'));
  };

  type Item = { kind: "folder"; folder: { name: string; path: string; itemCount: number } } | { kind: "media"; media: any };
  const items: Item[] = [
    ...folders.map((f) => ({ kind: "folder" as const, folder: f })),
    ...mediaItems.map((m) => ({ kind: "media" as const, media: m })),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={explorerStyles.modalOverlay}>
        <View style={[explorerStyles.modalContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <View style={explorerStyles.modalHeader}>
            <Text style={explorerStyles.modalTitle}>Media Kiezen</Text>
            <Pressable onPress={onClose}>
              <X color={Colors.light.text} size={28} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={explorerStyles.breadcrumbContainer}>
            <Text style={explorerStyles.breadcrumbText}>{breadcrumbText}</Text>
          </View>

          {currentPath ? (
            <Pressable onPress={handleBack} style={explorerStyles.backButton}>
              <ArrowLeft color={Colors.light.primary} size={20} strokeWidth={2.5} />
              <Text style={explorerStyles.backText}>Terug</Text>
            </Pressable>
          ) : null}

          <FlatList
            data={items}
            keyExtractor={(item, index) => 
              item.kind === "folder" ? `folder-${item.folder.path}` : `media-${item.media.id}`
            }
            style={explorerStyles.list}
            contentContainerStyle={explorerStyles.listContent}
            renderItem={({ item }) => {
              if (item.kind === "folder") {
                return (
                  <TouchableOpacity 
                    style={explorerStyles.item} 
                    onPress={() => onNavigate(item.folder.path)}
                  >
                    <View style={explorerStyles.iconContainer}>
                      <Folder color={Colors.light.primary} size={24} strokeWidth={2} />
                    </View>
                    <View style={explorerStyles.itemContent}>
                      <Text style={explorerStyles.itemTitle}>{item.folder.name}</Text>
                      <Text style={explorerStyles.itemMeta}>{item.folder.itemCount} items</Text>
                    </View>
                    <ChevronRight color={Colors.light.muted} size={20} />
                  </TouchableOpacity>
                );
              }
              
              const Icon = item.media.file_type === 'video' ? Video : item.media.file_type === 'audio' ? Music : ImageIcon;
              
              return (
                <TouchableOpacity 
                  style={explorerStyles.item} 
                  onPress={() => onSelectMedia(item.media)}
                >
                  <View style={[explorerStyles.iconContainer, explorerStyles.mediaIcon]}>
                    <Icon color={Colors.light.text} size={20} strokeWidth={2} />
                  </View>
                  <View style={explorerStyles.itemContent}>
                    <Text style={explorerStyles.itemTitle}>{item.media.name}</Text>
                    <Text style={explorerStyles.itemMeta}>
                      {item.media.file_type.toUpperCase()} • {(item.media.file_size / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                  </View>
                  <CheckCircle2 color={Colors.light.primary} size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function AssignmentCard({ assignment, onPress, onLongPress, isSelected, selectionMode, currentUserId, isAdmin }: { assignment: Assignment; onPress: () => void; onLongPress: () => void; isSelected: boolean; selectionMode: boolean; currentUserId?: string; isAdmin: boolean }) {
  const { users } = useAppState();

  const getMediaIcon = () => {
    if (!assignment.mediaType) return null;
    
    switch (assignment.mediaType) {
      case 'video':
        return <Video color={Colors.light.primary} size={20} />;
      case 'image':
        return <ImageIcon color={Colors.light.primary} size={20} />;
      case 'audio':
        return <Music color={Colors.light.primary} size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("nl-NL", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const assignedUsernames = assignment.assignedUserIds.length > 0
    ? users.filter(u => assignment.assignedUserIds.includes(u.id)).map(u => u.username).join(", ")
    : "Alle leden";

  const isCompleted = currentUserId ? assignment.completedBy.some(c => c.userId === currentUserId) : false;
  
  const completionInfo = isAdmin && assignment.completedBy.length > 0 
    ? assignment.completedBy.map(c => {
        const user = users.find(u => u.id === c.userId);
        return {
          username: user?.username || 'Onbekend',
          completedAt: c.completedAt,
        };
      })
    : [];

  return (
    <TouchableOpacity 
      style={[styles.assignmentCard, isSelected && styles.cardSelected]} 
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {selectionMode && (
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <CheckCircle2 color={Colors.light.primary} size={24} strokeWidth={2.5} />
          ) : (
            <View style={styles.checkboxEmpty} />
          )}
        </View>
      )}
      <View style={[styles.assignmentHeader, !selectionMode && styles.assignmentFullWidth]}>
        <View style={styles.assignmentTitleRow}>
          <Text style={styles.assignmentTitle}>{assignment.title}</Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <CheckCircle2 color={Colors.light.text} size={14} strokeWidth={2.5} />
              <Text style={styles.completedBadgeText}>Voltooid</Text>
            </View>
          )}
        </View>
        {assignment.mediaType && (
          <View style={styles.mediaIconContainer}>
            {getMediaIcon()}
          </View>
        )}
      </View>
      
      {assignment.description && (
        <Text style={styles.assignmentDescription}>{assignment.description}</Text>
      )}
      
      {isAdmin && completionInfo.length > 0 && (
        <View style={styles.completionInfoContainer}>
          {completionInfo.map((info, idx) => (
            <View key={idx} style={styles.completionInfoRow}>
              <CheckCircle2 color={Colors.light.success} size={14} strokeWidth={2.5} />
              <Text style={styles.completionInfoText}>
                {info.username} - {formatDateTime(info.completedAt)}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.assignmentFooter}>
        <View style={styles.assignmentInfo}>
          <Calendar color={Colors.light.muted} size={16} />
          <Text style={styles.assignmentInfoText}>
            {assignment.dueDate ? formatDate(assignment.dueDate) : "Geen deadline"}
          </Text>
        </View>
        
        <View style={styles.assignmentInfo}>
          <Users color={Colors.light.muted} size={16} />
          <Text style={styles.assignmentInfoText} numberOfLines={1}>
            {assignedUsernames}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AssignmentDetailModal({ visible, assignment, onClose, currentUserId }: { visible: boolean; assignment: Assignment; onClose: () => void; currentUserId: string }) {
  const insets = useSafeAreaInsets();
  const { completeAssignment, users, uploadMedia } = useAppState();
  const [isCompleting, setIsCompleting] = useState(false);
  const [uploadedMediaUri, setUploadedMediaUri] = useState<string>("");
  const [uploadedMediaType, setUploadedMediaType] = useState<'video' | 'image' | 'audio' | undefined>(undefined);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showMediaExplorer, setShowMediaExplorer] = useState(false);
  const [explorerPath, setExplorerPath] = useState<string>("");

  const isCompleted = assignment.completedBy.some(c => c.userId === currentUserId);
  const hasUploadedMedia = !!uploadedMediaUri;
  const canComplete = !isCompleted && (!assignment.requireMedia || hasUploadedMedia);

  useEffect(() => {
    if (!visible) {
      setUploadedMediaUri("");
      setUploadedMediaType(undefined);
    }
  }, [visible]);

  const handleComplete = async () => {
    if (assignment.requireMedia && !uploadedMediaUri) {
      Alert.alert("Media vereist", "Upload eerst media voordat je de opdracht voltooit");
      return;
    }

    try {
      setIsCompleting(true);
      await completeAssignment(assignment.id, currentUserId, uploadedMediaUri || undefined);
      Alert.alert("Succes", "Huiswerk opdracht is voltooid!");
      onClose();
    } catch (error) {
      console.error('Error completing assignment:', error);
      Alert.alert("Fout", "Er is een fout opgetreden bij het voltooien van de opdracht");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSelectMediaFromLibrary = (media: any) => {
    const { data } = supabase.storage
      .from('media-library')
      .getPublicUrl(media.storage_path);
    
    setUploadedMediaUri(data.publicUrl);
    
    if (media.mime_type?.startsWith('video/')) {
      setUploadedMediaType('video');
    } else if (media.mime_type?.startsWith('image/')) {
      setUploadedMediaType('image');
    } else if (media.mime_type?.startsWith('audio/')) {
      setUploadedMediaType('audio');
    }
    
    setShowMediaExplorer(false);
    setExplorerPath("");
  };

  const handleUploadNewMedia = async () => {
    try {
      setIsUploadingMedia(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsUploadingMedia(false);
        return;
      }

      const file = result.assets[0];
      
      let fileType = 'other';
      if (file.mimeType?.startsWith('video/')) fileType = 'video';
      else if (file.mimeType?.startsWith('image/')) fileType = 'image';
      else if (file.mimeType?.startsWith('audio/')) fileType = 'audio';

      const response = await fetch(file.uri);
      const blob = await response.blob();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!reader.result) {
            reject(new Error('FileReader resultaat is leeg'));
            return;
          }
          const result = reader.result as string;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error(`FileReader fout: ${reader.error?.message || 'Onbekende fout'}`));
        reader.readAsDataURL(blob);
      });

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `huiswerk-uploads/${fileName}`;
      
      const arrayBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, arrayBuffer, {
          contentType: file.mimeType || 'application/octet-stream',
          upsert: false,
        });
      
      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }
      
      const { data } = supabase.storage
        .from('assignment-submissions')
        .getPublicUrl(uploadData.path);

      setUploadedMediaUri(data.publicUrl);

      if (file.mimeType?.startsWith('video/')) {
        setUploadedMediaType('video');
      } else if (file.mimeType?.startsWith('image/')) {
        setUploadedMediaType('image');
      } else if (file.mimeType?.startsWith('audio/')) {
        setUploadedMediaType('audio');
      }

      Alert.alert("Succes", "Media is succesvol geüpload!");
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert("Fout", "Er is een fout opgetreden bij het uploaden van media");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openMedia = async () => {
    if (!assignment.mediaUri) return;
    
    try {
      const supported = await Linking.canOpenURL(assignment.mediaUri);
      if (supported) {
        await Linking.openURL(assignment.mediaUri);
      } else {
        Alert.alert("Fout", "Kan media niet openen");
      }
    } catch (error) {
      console.error('Error opening media:', error);
      Alert.alert("Fout", "Er is een fout opgetreden bij het openen van media");
    }
  };

  const assignedUsernames = assignment.assignedUserIds.length > 0
    ? users.filter(u => assignment.assignedUserIds.includes(u.id)).map(u => u.username).join(", ")
    : "Alle leden";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={detailStyles.modalOverlay}>
        <View style={[detailStyles.modalContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <View style={detailStyles.modalHeader}>
            <Text style={detailStyles.modalTitle}>Huiswerk Opdracht</Text>
            <Pressable onPress={onClose}>
              <X color={Colors.light.text} size={28} strokeWidth={2.5} />
            </Pressable>
          </View>

          <ScrollView style={detailStyles.modalScroll} contentContainerStyle={detailStyles.scrollContent}>
            <View style={detailStyles.section}>
              <Text style={detailStyles.title}>{assignment.title}</Text>
              {isCompleted && (
                <View style={detailStyles.completedBadgeLarge}>
                  <CheckCircle2 color={Colors.light.text} size={20} strokeWidth={2.5} />
                  <Text style={detailStyles.completedBadgeText}>Voltooid</Text>
                </View>
              )}
            </View>

            {assignment.description && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.label}>Uitleg</Text>
                <Text style={detailStyles.description}>{assignment.description}</Text>
              </View>
            )}

            {assignment.dueDate && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.label}>Deadline</Text>
                <View style={detailStyles.infoRow}>
                  <Calendar color={Colors.light.primary} size={20} />
                  <Text style={detailStyles.infoText}>{formatDate(assignment.dueDate)}</Text>
                </View>
              </View>
            )}

            <View style={detailStyles.section}>
              <Text style={detailStyles.label}>Toegewezen aan</Text>
              <View style={detailStyles.infoRow}>
                <Users color={Colors.light.primary} size={20} />
                <Text style={detailStyles.infoText}>{assignedUsernames}</Text>
              </View>
            </View>

            {assignment.mediaUri && assignment.mediaType && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.label}>Referentie Media</Text>
                <TouchableOpacity 
                  style={detailStyles.mediaButton}
                  onPress={openMedia}
                >
                  <View style={detailStyles.mediaIconBox}>
                    {assignment.mediaType === 'video' && <Video color={Colors.light.text} size={24} />}
                    {assignment.mediaType === 'image' && <ImageIcon color={Colors.light.text} size={24} />}
                    {assignment.mediaType === 'audio' && <Music color={Colors.light.text} size={24} />}
                  </View>
                  <View style={detailStyles.mediaInfo}>
                    <Text style={detailStyles.mediaTitle}>
                      {assignment.mediaType === 'video' ? 'Video' : assignment.mediaType === 'image' ? 'Foto' : 'Audio'}
                    </Text>
                    <Text style={detailStyles.mediaSubtitle}>Klik om te openen</Text>
                  </View>
                  <Play color={Colors.light.primary} size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

            {assignment.requireMedia && !isCompleted && (
              <View style={detailStyles.section}>
                <Text style={detailStyles.label}>Jouw Media Upload</Text>
                {!uploadedMediaUri ? (
                  <TouchableOpacity
                    style={detailStyles.uploadButton}
                    onPress={handleUploadNewMedia}
                    disabled={isUploadingMedia}
                  >
                    {isUploadingMedia ? (
                      <ActivityIndicator size="small" color={Colors.light.text} />
                    ) : (
                      <Upload color={Colors.light.text} size={24} strokeWidth={2.5} />
                    )}
                    <Text style={detailStyles.uploadButtonText}>
                      {isUploadingMedia ? 'Uploaden...' : 'Upload Media'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={detailStyles.uploadedMediaContainer}>
                    <View style={detailStyles.uploadedMediaInfo}>
                      {uploadedMediaType === 'video' && <Video color={Colors.light.primary} size={24} />}
                      {uploadedMediaType === 'image' && <ImageIcon color={Colors.light.primary} size={24} />}
                      {uploadedMediaType === 'audio' && <Music color={Colors.light.primary} size={24} />}
                      <View style={detailStyles.uploadedTextContainer}>
                        <Text style={detailStyles.uploadedMediaTitle}>
                          {uploadedMediaType === 'video' ? 'Video' : uploadedMediaType === 'image' ? 'Foto' : 'Audio'} geüpload
                        </Text>
                        <Text style={detailStyles.uploadedMediaSubtitle}>Klaar voor indiening</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        setUploadedMediaUri("");
                        setUploadedMediaType(undefined);
                      }}
                    >
                      <X color={Colors.light.muted} size={24} />
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {!isCompleted && (
            <TouchableOpacity
              style={[detailStyles.completeButton, (!canComplete || isCompleting) && detailStyles.completeButtonDisabled]}
              onPress={handleComplete}
              disabled={!canComplete || isCompleting}
            >
              <LinearGradient
                colors={canComplete && !isCompleting ? [Colors.light.primary, '#B91C1C'] : [Colors.light.darkGray, Colors.light.darkGray]}
                style={detailStyles.completeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isCompleting ? (
                  <ActivityIndicator color={Colors.light.text} />
                ) : (
                  <>
                    <CheckCircle2 color={Colors.light.text} size={24} strokeWidth={2.5} />
                    <Text style={detailStyles.completeButtonText}>Voltooid</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <MediaExplorerModal
        visible={showMediaExplorer}
        currentPath={explorerPath}
        onClose={() => {
          setShowMediaExplorer(false);
          setExplorerPath("");
        }}
        onNavigate={setExplorerPath}
        onSelectMedia={handleSelectMediaFromLibrary}
      />
    </Modal>
  );
}

export default function HuiswerkScreen() {
  const insets = useSafeAreaInsets();
  const { assignments, currentUser, deleteAssignments } = useAppState();
  const isCrownAdmin = currentUser?.isCrownAdmin ?? false;
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | undefined>(undefined);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [detailAssignment, setDetailAssignment] = useState<Assignment | undefined>(undefined);

  const filteredAssignments = useMemo(() => {
    if (!currentUser) return [];
    
    if (currentUser.role === 'admin') {
      return assignments;
    }
    
    return assignments.filter(assignment => {
      if (assignment.assignedUserIds.length === 0) {
        return true;
      }
      return assignment.assignedUserIds.includes(currentUser.id);
    });
  }, [assignments, currentUser]);

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
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Huiswerk</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredAssignments.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText color={Colors.light.muted} size={48} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Nog geen huiswerk opdrachten</Text>
            </View>
          ) : (
            filteredAssignments.map(assignment => {
              const isSelected = selectedIds.has(assignment.id);
              return (
                <AssignmentCard 
                  key={assignment.id} 
                  assignment={assignment}
                  isSelected={isSelected}
                  selectionMode={selectionMode}
                  currentUserId={currentUser?.id}
                  isAdmin={currentUser?.role === "admin"}
                  onPress={() => {
                    if (selectionMode) {
                      setSelectedIds((prev) => {
                        const newSet = new Set(prev);
                        if (newSet.has(assignment.id)) {
                          newSet.delete(assignment.id);
                        } else {
                          newSet.add(assignment.id);
                        }
                        return newSet;
                      });
                    } else {
                      setDetailAssignment(assignment);
                    }
                  }}
                  onLongPress={() => {
                    if (!selectionMode && currentUser?.role === "admin") {
                      setSelectionMode(true);
                      setSelectedIds(new Set([assignment.id]));
                    }
                  }}
                />
              );
            })
          )}
        </ScrollView>
      </View>

      {(currentUser?.role === "admin" || isCrownAdmin) && (
        <>
          {selectionMode ? (
            <View style={[styles.selectionBar, { bottom: insets.bottom + 20 }]}>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => {
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                }}
              >
                <Text style={styles.selectionButtonText}>Annuleren</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteButton, selectedIds.size === 0 && styles.disabledDeleteButton]}
                onPress={() => {
                  if (selectedIds.size === 0) return;
                  setShowDeleteConfirm(true);
                }}
                disabled={selectedIds.size === 0}
              >
                <Trash2 color={selectedIds.size > 0 ? Colors.light.text : Colors.light.muted} size={20} strokeWidth={2.5} />
                <Text style={[styles.deleteButtonText, selectedIds.size === 0 && styles.disabledDeleteText]}>
                  Verwijderen ({selectedIds.size})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Pressable 
              style={[styles.fab, { bottom: insets.bottom + 20 }]} 
              onPress={() => {
                setEditingAssignment(undefined);
                setShowAddModal(true);
              }}
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
          )}

          <AddAssignmentModal
            visible={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setEditingAssignment(undefined);
            }}
            editingAssignment={editingAssignment}
          />

          <Modal
            visible={showDeleteConfirm}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDeleteConfirm(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContentSmall}>
                <View style={styles.modalHeaderSmall}>
                  <Text style={styles.modalTitleSmall}>Bevestigen</Text>
                </View>
                
                <Text style={styles.confirmText}>
                  Weet je het zeker om {selectedIds.size} {selectedIds.size === 1 ? 'opdracht' : 'opdrachten'} te verwijderen?
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => setShowDeleteConfirm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Annuleren</Text>
                  </Pressable>
                  
                  <Pressable
                    style={[styles.actionButton]}
                    onPress={() => {
                      deleteAssignments(Array.from(selectedIds));
                      setSelectionMode(false);
                      setSelectedIds(new Set());
                      setShowDeleteConfirm(false);
                    }}
                  >
                    <LinearGradient
                      colors={['#DC2626', '#991B1B']}
                      style={styles.createButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.createButtonText}>Verwijderen</Text>
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
        </>
      )}

      {currentUser && detailAssignment && (
        <AssignmentDetailModal
          visible={!!detailAssignment}
          assignment={detailAssignment}
          onClose={() => setDetailAssignment(undefined)}
          currentUserId={currentUser.id}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.muted,
  },
  assignmentCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    gap: 12,
    flexDirection: 'row',
  },
  assignmentHeader: {
    flex: 1,
    gap: 12,
  },
  assignmentFullWidth: {
    flex: 1,
  },
  assignmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  mediaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  assignmentDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  completionInfoContainer: {
    backgroundColor: Colors.light.darkGray,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  completionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completionInfoText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '600' as const,
    flex: 1,
  },
  assignmentFooter: {
    gap: 8,
    paddingTop: 4,
  },
  assignmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignmentInfoText: {
    fontSize: 13,
    color: Colors.light.muted,
    flex: 1,
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
  cardSelected: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.3,
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.muted,
  },
  selectionBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  selectionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  selectionButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  disabledDeleteButton: {
    backgroundColor: Colors.light.darkGray,
  },
  deleteButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  disabledDeleteText: {
    color: Colors.light.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentSmall: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  modalHeaderSmall: {
    marginBottom: 16,
  },
  modalTitleSmall: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '800' as const,
  },
  confirmText: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
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
});

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.light.text,
    fontSize: 32,
    fontWeight: '800' as const,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.surfaceLight,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.light.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  membersSection: {
    gap: 12,
  },
  membersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  memberChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  memberChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  memberChipTextSelected: {
    color: Colors.light.text,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  mediaButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.surface,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  mediaOptionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  uploadedMediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  uploadedMediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  uploadedMediaText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitButtonText: {
    color: Colors.light.text,
    fontWeight: '700' as const,
    fontSize: 16,
  },
  calendarPickerContainer: {
    marginTop: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    padding: 12,
  },
  calendarPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  calendarPickerButton: {
    padding: 4,
  },
  calendarPickerMonth: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  calendarPickerWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarPickerWeekDay: {
    flex: 1,
    textAlign: 'center',
    color: Colors.light.muted,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  calendarPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarPickerDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  calendarPickerDayCircle: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarPickerDayInactive: {
    opacity: 0.3,
  },
  calendarPickerDaySelected: {
    backgroundColor: Colors.light.primary,
  },
  calendarPickerDayText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  calendarPickerDayTextInactive: {
    color: Colors.light.muted,
  },
  calendarPickerDayTextSelected: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
  timePickerContainer: {
    marginTop: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
    padding: 12,
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerColumnLabel: {
    color: Colors.light.muted,
    fontSize: 12,
    fontWeight: '700' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timePickerScroll: {
    maxHeight: 180,
    width: '100%',
  },
  timePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  timePickerItemSelected: {
    backgroundColor: Colors.light.primary,
  },
  timePickerItemText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  timePickerItemTextSelected: {
    color: Colors.light.text,
    fontWeight: '700' as const,
  },
  timePickerColon: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 32,
  },
  timePickerDoneButton: {
    marginTop: 12,
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerDoneButtonText: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
});

const explorerStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.light.text,
    fontSize: 28,
    fontWeight: '800' as const,
  },
  breadcrumbContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  breadcrumbText: {
    color: Colors.light.muted,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  backButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  backText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  item: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.light.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mediaIcon: {
    backgroundColor: Colors.light.primary,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 3,
  },
  itemMeta: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: '500' as const,
  },
});

const detailStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.light.text,
    fontSize: 32,
    fontWeight: '800' as const,
  },
  modalScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.light.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  mediaIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaInfo: {
    flex: 1,
    gap: 2,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  mediaSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.muted,
  },
  completedBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  completedBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  completeButton: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  completeButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  completeButtonText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  uploadedMediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  uploadedMediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  uploadedTextContainer: {
    flex: 1,
    gap: 2,
  },
  uploadedMediaTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  uploadedMediaSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.light.muted,
  },
});
