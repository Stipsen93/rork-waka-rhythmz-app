import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, Alert, TouchableOpacity, Platform } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { CategoryNode, MediaItem, useAppState } from "@/providers/AppState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Folder, Video, Image as ImageIcon, ChevronRight, ArrowLeft, Plus, X, Trash2, CheckCircle2 } from "lucide-react-native";

const countAllItems = (node: CategoryNode): number => {
  let count = node.media?.length ?? 0;
  if (node.children) {
    for (const child of node.children) {
      count += countAllItems(child);
    }
  }
  return count;
};

export default function LibraryScreen() {
  const { library, addFolder, deleteFolders } = useAppState();
  const insets = useSafeAreaInsets();
  const [path, setPath] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({ totalItems: 0, folderCount: 0 });
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const current = useMemo<{ children?: CategoryNode[]; media?: MediaItem[] }>(() => {
    let nodes: CategoryNode[] = library;
    let node: CategoryNode | null = null;
    for (const id of path) {
      node = (nodes ?? []).find((n) => n.id === id) ?? null;
      nodes = node?.children ?? [];
    }
    return (node as CategoryNode) ?? { children: library };
  }, [library, path]);

  type Item = { kind: "folder"; node: CategoryNode } | { kind: "media"; media: MediaItem };
  const items: Item[] = [
    ...(current.children ?? []).map((c: CategoryNode) => ({ kind: "folder" as const, node: c })),
    ...(current.media ?? []).map((m: MediaItem) => ({ kind: "media" as const, media: m })),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top * 0.0 }]} testID="library-screen">
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.background, Colors.light.background]} 
        style={styles.headerBg} 
        locations={[0, 0.3, 1]}
      />
      
      <View style={styles.header}>
        <Text style={styles.appName}>WAKA RHYTHMZ</Text>
        <Text style={styles.title}>Bibliotheek</Text>
        {path.length > 0 && (
          <Text style={styles.breadcrumb}>
            {path.length} {path.length === 1 ? 'niveau' : 'niveaus'} diep
          </Text>
        )}
      </View>

      {path.length > 0 && (
        <Pressable 
          onPress={() => setPath((p) => p.slice(0, -1))} 
          style={styles.backButton} 
          testID="breadcrumb-back"
        >
          <ArrowLeft color={Colors.light.primary} size={20} strokeWidth={2.5} />
          <Text style={styles.backText}>Terug</Text>
        </Pressable>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => (item.kind === "folder" ? item.node.id : item.media.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        renderItem={({ item }) => {
          if (item.kind === "folder") {
            const itemCount = (item.node.media?.length ?? 0) + (item.node.children?.length ?? 0);
            const isSelected = selectedIds.has(item.node.id);
            
            return (
              <TouchableOpacity 
                style={[styles.card, isSelected && styles.cardSelected]} 
                onPress={() => {
                  if (selectionMode) {
                    setSelectedIds((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(item.node.id)) {
                        newSet.delete(item.node.id);
                      } else {
                        newSet.add(item.node.id);
                      }
                      return newSet;
                    });
                  } else {
                    setPath((p) => [...p, item.node.id]);
                  }
                }}
                onLongPress={() => {
                  if (!selectionMode) {
                    setSelectionMode(true);
                    setSelectedIds(new Set([item.node.id]));
                  }
                }}
                testID={`folder-${item.node.id}`}
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
                <View style={styles.iconContainer}>
                  <Folder color={Colors.light.primary} size={28} strokeWidth={2} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.node.name}</Text>
                  <Text style={styles.cardMeta}>{itemCount} items</Text>
                </View>
                {!selectionMode && <ChevronRight color={Colors.light.muted} size={20} />}
              </TouchableOpacity>
            );
          }
          
          const Icon = item.media.type === 'video' ? Video : ImageIcon;
          return (
            <Pressable style={styles.card} onPress={() => {}} testID={`media-${item.media.id}`}>
              <View style={[styles.iconContainer, styles.mediaIcon]}>
                <Icon color={Colors.light.text} size={24} strokeWidth={2} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.media.title}</Text>
                <Text style={styles.cardMeta}>{item.media.type.toUpperCase()}</Text>
              </View>
              <View style={styles.playBadge}>
                <Text style={styles.playBadgeText}>▶</Text>
              </View>
            </Pressable>
          );
        }}
      />

      {selectionMode ? (
        <View style={[styles.selectionBar, { bottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => {
              setSelectionMode(false);
              setSelectedIds(new Set());
            }}
            testID="cancel-selection"
          >
            <Text style={styles.selectionButtonText}>Annuleren</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.deleteButton, selectedIds.size === 0 && styles.disabledDeleteButton]}
            onPress={() => {
              console.log('Delete button clicked, selectedIds:', selectedIds.size);
              if (selectedIds.size === 0) return;
              
              let totalItems = 0;
              const selectedNodes = (current.children ?? []).filter(node => selectedIds.has(node.id));
              for (const node of selectedNodes) {
                totalItems += countAllItems(node);
              }
              
              console.log('Showing confirmation, totalItems:', totalItems);
              
              if (Platform.OS === 'web') {
                setDeleteInfo({ totalItems, folderCount: selectedIds.size });
                setShowDeleteConfirm(true);
              } else {
                Alert.alert(
                  'Items in mappen',
                  `Er zijn in totaal ${totalItems} item${totalItems !== 1 ? 's' : ''} in ${selectedIds.size > 1 ? 'deze mappen' : 'deze map'}.`,
                  [
                    { text: 'Annuleren', style: 'cancel' },
                    {
                      text: 'Doorgaan',
                      style: 'default',
                      onPress: () => {
                        Alert.alert(
                          'Bevestigen',
                          'Weet je het zeker om te verwijderen?',
                          [
                            { text: 'Annuleren', style: 'cancel' },
                            {
                              text: 'Verwijderen',
                              style: 'destructive',
                              onPress: () => {
                                console.log('Delete confirmed');
                                deleteFolders(Array.from(selectedIds), path);
                                setSelectionMode(false);
                                setSelectedIds(new Set());
                              }
                            }
                          ]
                        );
                      }
                    }
                  ]
                );
              }
            }}
            disabled={selectedIds.size === 0}
            testID="delete-button"
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
          onPress={() => setShowAddModal(true)}
          testID="add-fab"
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

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Toevoegen aan Bibliotheek</Text>
              <Pressable onPress={() => setShowAddModal(false)} testID="close-modal">
                <X color={Colors.light.muted} size={24} />
              </Pressable>
            </View>

            <Pressable 
              style={styles.optionCard} 
              onPress={() => {
                setShowAddModal(false);
                setShowFolderModal(true);
              }}
              testID="add-folder-option"
            >
              <View style={styles.optionIcon}>
                <Folder color={Colors.light.primary} size={32} strokeWidth={2} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Map Toevoegen</Text>
                <Text style={styles.optionDesc}>Maak een nieuwe categorie of submap</Text>
              </View>
              <ChevronRight color={Colors.light.muted} size={20} />
            </Pressable>

            <Pressable 
              style={styles.optionCard} 
              onPress={async () => {
                setShowAddModal(false);
                
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('Toestemming Vereist', 'We hebben toegang nodig tot je mediabibliotheek om bestanden te uploaden.');
                  return;
                }
                
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images', 'videos'],
                  allowsEditing: false,
                  quality: 1,
                });
                
                if (!result.canceled && result.assets && result.assets.length > 0) {
                  const asset = result.assets[0];
                  console.log('Selected media:', {
                    uri: asset.uri,
                    type: asset.type,
                    fileName: asset.fileName,
                  });
                }
              }}
              testID="add-media-option"
            >
              <View style={[styles.optionIcon, styles.mediaOptionIcon]}>
                <Video color={Colors.light.text} size={32} strokeWidth={2} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Media Toevoegen</Text>
                <Text style={styles.optionDesc}>Upload video of foto</Text>
              </View>
              <ChevronRight color={Colors.light.muted} size={20} />
            </Pressable>
          </View>
        </View>
      </Modal>

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
                    addFolder(folderName.trim(), path);
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

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Items in mappen</Text>
            </View>
            
            <Text style={styles.confirmText}>
              Er zijn in totaal {deleteInfo.totalItems} item{deleteInfo.totalItems !== 1 ? 's' : ''} in {deleteInfo.folderCount > 1 ? 'deze mappen' : 'deze map'}.
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
                  setShowDeleteConfirm(false);
                  setShowFinalConfirm(true);
                }}
              >
                <LinearGradient
                  colors={[Colors.light.primary, Colors.light.primaryDark]}
                  style={styles.createButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.createButtonText}>Doorgaan</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFinalConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinalConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bevestigen</Text>
            </View>
            
            <Text style={styles.confirmText}>
              Weet je het zeker om te verwijderen?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowFinalConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Annuleren</Text>
              </Pressable>
              
              <Pressable
                style={[styles.actionButton]}
                onPress={() => {
                  console.log('Delete confirmed');
                  deleteFolders(Array.from(selectedIds), path);
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                  setShowFinalConfirm(false);
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
    paddingBottom: 24 
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
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.darkGray,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mediaOptionIcon: {
    backgroundColor: Colors.light.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  optionDesc: {
    color: Colors.light.muted,
    fontSize: 14,
    fontWeight: '500' as const,
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
  cardSelected: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.3,
  },
  checkboxContainer: {
    marginRight: 12,
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
  confirmText: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
});
