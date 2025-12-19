import { useCallback, useState, useEffect } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from "@/constants/translations";
import { translations } from "@/constants/translations";
import { trpcClient } from "@/lib/trpc";
import { AppState } from 'react-native';

export type Role = "admin" | "member";

export interface UserNotificationPreferences {
  newsEnabled: boolean;
  assignmentsEnabled: boolean;
  trainingsEnabled: boolean;
  performancesEnabled: boolean;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  passwordChangedByUser: boolean;
  email?: string | null;
  phone?: string | null;
  age?: string | null;
  address?: string | null;
  notificationPreferences: UserNotificationPreferences;
  deletedByUser: boolean;
  deletedAt?: string | null;
  isCrownAdmin: boolean;
}

export interface PermissionMatrix {
  canAddMedia: boolean;
  canComment: boolean;
  canCreateEvents: boolean;
}

export interface CategoryNode {
  id: string;
  name: string;
  children?: CategoryNode[];
  media?: MediaItem[];
  description?: string;
  taggedUserIds?: string[];
}

export type MediaType = "video" | "image" | "text";

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  uri: string;
  notes?: string;
  comments: CommentItem[];
}

export interface CommentItem {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface AssignmentSubmission {
  userId: string;
  mediaUri?: string;
  notes?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  assignedUserIds: string[];
  dueDate?: string;
  mediaUri?: string;
  mediaType?: 'video' | 'image' | 'audio';
  requireMedia: boolean;
  completedBy: { userId: string; completedAt: string; mediaUri?: string }[];
  createdAt: string;
  submissions: AssignmentSubmission[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
}

export interface Performance {
  id: string;
  date: string;
  time: string;
  location: string;
  signedUpCount: number;
}

export interface Training {
  id: string;
  name: string;
  dayOfWeek: number;
  time: string;
  location: string;
  isOneTime?: boolean;
  repeatMode?: 'none' | '1x' | '2x' | 'custom';
  customDate?: string;
}

export interface PracticeDay {
  dayOfWeek: number;
  time: string;
}

export interface CancelledPractice {
  date: string;
  reason?: string;
  cancelledBy?: string;
}

export interface PracticeSchedule {
  regularDays: PracticeDay[];
  location: string;
  cancelledDates: CancelledPractice[];
  isActive: boolean;
  trainings: Training[];
}

export interface Announcement {
  id: string;
  name: string;
  description: string;
  date: string;
  createdAt: string;
  isExtraTraining?: boolean;
}

export interface Appointment {
  id: string;
  name: string;
  category: 'Feestje' | 'Verrassingsfeest' | 'Huwelijk' | 'Verjaardag' | 'Overig';
  date: string;
  time: string;
  location: string;
  memberIds: string[];
  createdAt: string;
  createdBy: string;
  status: 'active' | 'cancelled';
  forUserId?: string;
  confirmed: boolean;
  cancelledBy?: string;
}

export interface NotificationSettings {
  newsEnabled: boolean;
  newsReminderEnabled: boolean;
  newsHoursAdvance: number;
  assignmentsEnabled: boolean;
  assignmentsReminderEnabled: boolean;
  assignmentsHoursAdvance: number;
  trainingCancellationEnabled: boolean;
  trainingsReminderEnabled: boolean;
  trainingHoursAdvance: number;
  performancesEnabled: boolean;
  performancesReminderEnabled: boolean;
  performancesHoursAdvance: number;
}

export interface MediaLibraryItem {
  id: string;
  name: string;
  path: string;
  folder_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface StorageUsage {
  usageGB: number;
  maxGB: number;
  percentage: number;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
}

export interface AppStateValue {
  users: User[];
  currentUser: User | null;
  isInitialized: boolean;
  language: Language;
  t: typeof translations['nl'];
  setLanguage: (lang: Language) => Promise<void>;
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setCurrentUser: (u: User | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addUser: (username: string, role: Role) => Promise<{ user: User; password: string }>;
  deleteUsers: (userIds: string[]) => Promise<void>;
  setCrownAdmin: (userId: string) => Promise<void>;
  softDeleteAccount: (userId: string) => Promise<void>;
  reactivateAccount: (userId: string, newPassword: string) => Promise<void>;
  permanentDeleteAccount: (userId: string) => Promise<void>;
  setRole: (userId: string, role: Role) => void;
  resetPassword: (userId: string) => Promise<string>;
  changePassword: (userId: string, newPassword: string) => void;
  updateUserProfile: (userId: string, profile: { username?: string; email?: string | null; phone?: string | null; age?: string | null; address?: string | null }) => Promise<void>;
  updateUserNotificationPreferences: (userId: string, preferences: UserNotificationPreferences) => Promise<void>;
  permissions: Record<Role, PermissionMatrix>;
  setPermissions: (role: Role, perms: PermissionMatrix) => void;
  library: CategoryNode[];
  addFolder: (name: string, path: string[]) => void;
  deleteFolders: (folderIds: string[], path: string[]) => void;
  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt' | 'submissions' | 'completedBy'>) => void;
  updateAssignment: (id: string, assignment: Partial<Omit<Assignment, 'id' | 'createdAt' | 'submissions' | 'completedBy'>>) => void;
  deleteAssignments: (ids: string[]) => void;
  completeAssignment: (assignmentId: string, userId: string, submission?: { mediaUri?: string; notes?: string }) => Promise<void>;
  events: CalendarEvent[];
  performances: Performance[];
  addPerformance: (perf: Omit<Performance, 'id'>) => void;
  updatePerformance: (id: string, perf: Partial<Performance>) => void;
  practiceSchedule: PracticeSchedule;
  updatePracticeSchedule: (schedule: PracticeSchedule) => void;
  getRecentMedia: () => MediaItem[];
  clearRecentMediaList: () => Promise<void>;
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  updateAnnouncement: (id: string, announcement: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => void;
  deleteAnnouncements: (ids: string[]) => void;
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'createdBy' | 'status'>) => void;
  updateAppointment: (id: string, appointment: Partial<Omit<Appointment, 'id' | 'createdAt'>>) => void;
  deleteAppointments: (ids: string[]) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  mediaLibrary: MediaLibraryItem[];
  uploadMedia: (input: { name: string; folderPath: string; fileType: string; fileSize: number; mimeType: string; base64Data: string; onProgress?: (progress: number) => void }) => Promise<MediaLibraryItem>;
  deleteMedia: (ids: string[]) => Promise<void>;
  deleteFolder: (folderPath: string) => Promise<void>;
  renameMedia: (id: string, newName: string) => Promise<void>;
  renameFolder: (oldPath: string, newPath: string) => Promise<void>;
  getMediaInFolder: (folderPath: string) => MediaLibraryItem[];
  getFolders: () => string[];
  createFolder: (folderPath: string) => Promise<void>;
  storageUsage: StorageUsage | null;
  refreshStorageUsage: () => Promise<void>;
  groups: Group[];
  addGroup: (name: string, memberIds: string[]) => Promise<void>;
  updateGroup: (id: string, name: string, memberIds: string[]) => Promise<void>;
  deleteGroups: (ids: string[]) => Promise<void>;
  getMembersByGroupId: (groupId: string) => string[];
  syncAllData: () => Promise<void>;
}

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function genPassword(): string {
  const base = Math.random().toString(36).slice(2, 8);
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `${base}${suffix}`;
}

function buildCategoryTree(allNodes: any[]): (node: any) => CategoryNode {
  return (node: any): CategoryNode => {
    const children = allNodes.filter(n => n.parent_id === node.id).map(buildCategoryTree(allNodes));
    return {
      id: node.id,
      name: node.name,
      children: children.length > 0 ? children : undefined,
      media: (node.media as any) ?? undefined,
      description: node.description ?? undefined,
      taggedUserIds: node.tagged_user_ids ?? undefined,
    };
  };
}

export const [AppStateProvider, useAppState] = createContextHook<AppStateValue>(() => {
  console.log('🎯 [AppState] Initializing context hook...');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissionsState] = useState<Record<Role, PermissionMatrix>>({
    admin: { canAddMedia: true, canComment: true, canCreateEvents: true },
    member: { canAddMedia: false, canComment: true, canCreateEvents: false },
  });

  const [library, setLibrary] = useState<CategoryNode[]>([]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [events] = useState<CalendarEvent[]>([
    {
      id: "e1",
      title: "Repetitie",
      description: "Zaal 3, 19:00",
      startsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
  ]);

  const [performances, setPerformances] = useState<Performance[]>([]);

  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSchedule>({
    regularDays: [],
    location: "",
    cancelledDates: [],
    isActive: true,
    trainings: [],
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newsEnabled: true,
    newsReminderEnabled: true,
    newsHoursAdvance: 24,
    assignmentsEnabled: true,
    assignmentsReminderEnabled: false,
    assignmentsHoursAdvance: 24,
    trainingCancellationEnabled: true,
    trainingsReminderEnabled: true,
    trainingHoursAdvance: 2,
    performancesEnabled: true,
    performancesReminderEnabled: true,
    performancesHoursAdvance: 48,
  });

  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryItem[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [language, setLanguageState] = useState<Language>('nl');
  const [biometricEnabled, setBiometricEnabledState] = useState<boolean>(false);
  const [clearedMediaIds, setClearedMediaIds] = useState<Set<string>>(new Set());

  const refreshStorageUsage = useCallback(async () => {
    console.log('💾 Refreshing storage usage via tRPC...');
    try {
      const usage = await trpcClient.media.getStorageUsage.query();
      
      setStorageUsage({
        usageGB: usage.usageGB,
        maxGB: usage.maxGB,
        percentage: usage.percentage,
      });
      
      console.log('✅ Storage usage refreshed:', usage);
    } catch (error) {
      console.error('Error refreshing storage usage:', error);
    }
  }, []);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem('app_language');
        if (saved && (saved === 'nl' || saved === 'en')) {
          setLanguageState(saved as Language);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  useEffect(() => {
    const loadBiometricSetting = async () => {
      try {
        const saved = await AsyncStorage.getItem('biometric_enabled');
        if (saved !== null) {
          setBiometricEnabledState(saved === 'true');
        }
      } catch (error) {
        console.error('Error loading biometric setting:', error);
      }
    };
    loadBiometricSetting();
  }, []);

  useEffect(() => {
    const loadClearedMedia = async () => {
      try {
        const saved = await AsyncStorage.getItem('cleared_recent_media');
        if (saved) {
          setClearedMediaIds(new Set(JSON.parse(saved)));
        }
      } catch (error) {
        console.error('Error loading cleared media:', error);
      }
    };
    loadClearedMedia();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      refreshStorageUsage();
    }
  }, [isInitialized, refreshStorageUsage]);

  const syncAllData = useCallback(async () => {
    try {
      console.log('🔄 [AUTO-SYNC] Syncing all data from Supabase...');
      const [usersRes, assignmentsRes, announcementsRes, appointmentsRes, trainingsRes, scheduleRes, settingsRes, mediaLibraryRes, groupsRes, groupMembersRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('assignments').select('*'),
        supabase.from('announcements').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('trainings').select('*'),
        supabase.from('practice_schedule').select('*').single(),
        supabase.from('notification_settings').select('*').single(),
        supabase.from('media_library').select('*'),
        supabase.from('groups').select('*'),
        supabase.from('group_members').select('*'),
      ]);

      if (usersRes.data) {
        const mappedUsers = usersRes.data.map(u => ({
          id: u.id,
          username: u.username,
          password: u.password,
          role: u.role as Role,
          passwordChangedByUser: u.password_changed_by_user,
          email: u.email,
          phone: u.phone,
          age: u.age,
          address: u.address,
          notificationPreferences: (u.notification_preferences as any) ?? {
            newsEnabled: true,
            assignmentsEnabled: true,
            trainingsEnabled: true,
            performancesEnabled: true,
          },
          deletedByUser: u.deleted_by_user ?? false,
          deletedAt: u.deleted_at ?? null,
          isCrownAdmin: u.is_crown_admin ?? false,
        }));
        setUsers(mappedUsers);
      }

      if (assignmentsRes.data) {
        setAssignments(assignmentsRes.data.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          assignedUserIds: a.assigned_user_ids ?? [],
          dueDate: a.due_date ?? undefined,
          mediaUri: a.media_uri ?? undefined,
          mediaType: a.media_type ?? undefined,
          requireMedia: a.require_media ?? false,
          completedBy: (a.completed_by as any) ?? [],
          createdAt: a.created_at,
          submissions: (a.submissions as any) ?? [],
        })));
      }

      if (announcementsRes.data) {
        setAnnouncements(announcementsRes.data.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          date: a.date,
          createdAt: a.created_at,
        })));
      }

      if (appointmentsRes.data) {
        setAppointments(appointmentsRes.data.map(a => ({
          id: a.id,
          name: a.name,
          category: a.category,
          date: a.date,
          time: a.time,
          location: a.location,
          memberIds: a.member_ids ?? [],
          createdAt: a.created_at,
          createdBy: a.created_by,
          status: a.status,
          forUserId: a.for_user_id ?? undefined,
          confirmed: a.confirmed ?? false,
        })));
      }

      if (trainingsRes.data && scheduleRes.data) {
        setPracticeSchedule({
          regularDays: (scheduleRes.data.regular_days as any) ?? [],
          location: scheduleRes.data.location,
          cancelledDates: (scheduleRes.data.cancelled_dates as any) ?? [],
          isActive: scheduleRes.data.is_active,
          trainings: trainingsRes.data.map(t => ({
            id: t.id,
            name: t.name,
            dayOfWeek: t.day_of_week,
            time: t.time,
            location: t.location,
            isOneTime: t.is_one_time ?? false,
            repeatMode: (t.repeat_mode as any) ?? 'none',
            customDate: t.custom_date ?? undefined,
          })),
        });
      }

      if (settingsRes.data) {
        setNotificationSettings({
          newsEnabled: settingsRes.data.news_enabled,
          newsHoursAdvance: settingsRes.data.news_hours_advance,
          assignmentsEnabled: settingsRes.data.assignments_enabled,
          trainingCancellationEnabled: settingsRes.data.training_cancellation_enabled,
          trainingHoursAdvance: settingsRes.data.training_hours_advance,
          performancesEnabled: settingsRes.data.performances_enabled,
          performancesHoursAdvance: settingsRes.data.performances_hours_advance,
        });
      }

      if (mediaLibraryRes.data) {
        setMediaLibrary(mediaLibraryRes.data.map(m => ({
          id: m.id,
          name: m.name,
          path: m.path,
          folder_path: m.folder_path,
          file_type: m.file_type,
          file_size: m.file_size,
          mime_type: m.mime_type,
          storage_path: m.storage_path,
          uploaded_by: m.uploaded_by,
          created_at: m.created_at,
        })));
      }

      if (groupsRes.data && groupMembersRes.data) {
        const groupsWithMembers = groupsRes.data.map(g => {
          const members = groupMembersRes.data.filter(gm => gm.group_id === g.id);
          return {
            id: g.id,
            name: g.name,
            memberIds: members.map(m => m.user_id),
            createdBy: g.created_by,
            createdAt: g.created_at,
          };
        });
        setGroups(groupsWithMembers);
      }

      await refreshStorageUsage();

      console.log('✅ [AUTO-SYNC] All data synced successfully');
    } catch (error) {
      console.error('❌ [AUTO-SYNC] Error syncing data:', error);
    }
  }, [refreshStorageUsage]);

  useEffect(() => {
    if (!isInitialized) return;

    console.log('🔄 [AUTO-SYNC] Setting up auto-sync interval (10 minutes)');
    const syncInterval = setInterval(() => {
      syncAllData();
    }, 10 * 60 * 1000);

    return () => {
      console.log('🔌 [AUTO-SYNC] Clearing auto-sync interval');
      clearInterval(syncInterval);
    };
  }, [isInitialized, syncAllData]);

  useEffect(() => {
    if (!isInitialized) return;

    console.log('🔄 [APP-STATE-SYNC] Setting up AppState listener for automatic data sync');
    
    const handleAppStateChange = (nextAppState: string) => {
      console.log('🔄 [APP-STATE-SYNC] App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        console.log('🔄 [APP-STATE-SYNC] App became active, syncing all data...');
        syncAllData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    syncAllData();

    return () => {
      console.log('🔌 [APP-STATE-SYNC] Removing AppState listener');
      subscription.remove();
    };
  }, [isInitialized, syncAllData]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🔄 Loading data from Supabase...');
        
        let savedUserId: string | null = null;
        try {
          savedUserId = await AsyncStorage.getItem('saved_user_id');
          console.log('💾 Saved user ID:', savedUserId);
        } catch (error) {
          console.error('❌ Error reading saved user ID:', error);
        }
        const [usersRes, libraryRes, assignmentsRes, trainingsRes, scheduleRes, announcementsRes, appointmentsRes, settingsRes, mediaLibraryRes, groupsRes, groupMembersRes] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('library').select('*'),
          supabase.from('assignments').select('*'),
          supabase.from('trainings').select('*'),
          supabase.from('practice_schedule').select('*').single(),
          supabase.from('announcements').select('*'),
          supabase.from('appointments').select('*'),
          supabase.from('notification_settings').select('*').single(),
          supabase.from('media_library').select('*'),
          supabase.from('groups').select('*'),
          supabase.from('group_members').select('*'),
        ]);

        if (usersRes.data) {
          const mappedUsers = usersRes.data.map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            role: u.role as Role,
            passwordChangedByUser: u.password_changed_by_user,
            email: u.email,
            phone: u.phone,
            age: u.age,
            address: u.address,
            notificationPreferences: (u.notification_preferences as any) ?? {
              newsEnabled: true,
              assignmentsEnabled: true,
              trainingsEnabled: true,
              performancesEnabled: true,
            },
            deletedByUser: u.deleted_by_user ?? false,
            deletedAt: u.deleted_at ?? null,
            isCrownAdmin: u.is_crown_admin ?? false,
          }));
          setUsers(mappedUsers);
          if (mappedUsers.length === 0) {
            const newUser: Database['public']['Tables']['users']['Insert'] = {
              id: "u_admin",
              username: "admin",
              password: "admin",
              role: "admin",
              password_changed_by_user: true,
            };
            await supabase.from('users').insert(newUser);
            setUsers([{ id: "u_admin", username: "admin", password: "admin", role: "admin", passwordChangedByUser: true, email: null, phone: null, age: null, address: null, notificationPreferences: { newsEnabled: true, assignmentsEnabled: true, trainingsEnabled: true, performancesEnabled: true }, deletedByUser: false, deletedAt: null, isCrownAdmin: true }]);
          }
        }

        if (libraryRes.data) {
          setLibrary(libraryRes.data.filter(l => !l.parent_id).map(buildCategoryTree(libraryRes.data)));
        }

        if (assignmentsRes.data) {
          setAssignments(assignmentsRes.data.map(a => ({
            id: a.id,
            title: a.title,
            description: a.description,
            assignedUserIds: a.assigned_user_ids ?? [],
            dueDate: a.due_date ?? undefined,
            mediaUri: a.media_uri ?? undefined,
            mediaType: a.media_type ?? undefined,
            requireMedia: a.require_media ?? false,
            completedBy: (a.completed_by as any) ?? [],
            createdAt: a.created_at,
            submissions: (a.submissions as any) ?? [],
          })));
        }

        if (trainingsRes.data && scheduleRes.data) {
          setPracticeSchedule({
            regularDays: (scheduleRes.data.regular_days as any) ?? [],
            location: scheduleRes.data.location,
            cancelledDates: (scheduleRes.data.cancelled_dates as any) ?? [],
            isActive: scheduleRes.data.is_active,
            trainings: trainingsRes.data.map(t => ({
              id: t.id,
              name: t.name,
              dayOfWeek: t.day_of_week,
              time: t.time,
              location: t.location,
              isOneTime: t.is_one_time ?? false,
              repeatMode: (t.repeat_mode as any) ?? 'none',
              customDate: t.custom_date ?? undefined,
            })),
          });
        } else if (!scheduleRes.data) {
          const defaultSchedule: Database['public']['Tables']['practice_schedule']['Insert'] = {
            regular_days: [
              { dayOfWeek: 2, time: "18:30" },
              { dayOfWeek: 2, time: "19:30" },
            ] as any,
            location: "De Zaalon",
            cancelled_dates: [] as any,
            is_active: true,
          };
          await supabase.from('practice_schedule').insert(defaultSchedule);
          
          const defaultTrainings: Database['public']['Tables']['trainings']['Insert'][] = [
            { training_id: "t1", name: "Groep 1", day_of_week: 2, time: "18:30", location: "De Zaalon" },
            { training_id: "t2", name: "Groep 2", day_of_week: 2, time: "19:30", location: "De Zaalon" },
          ];
          await supabase.from('trainings').insert(defaultTrainings);
          
          setPracticeSchedule({
            regularDays: (defaultSchedule.regular_days as any) ?? [],
            location: defaultSchedule.location,
            cancelledDates: (defaultSchedule.cancelled_dates as any) ?? [],
            isActive: defaultSchedule.is_active,
            trainings: defaultTrainings.map(t => ({
              id: t.training_id ?? '',
              name: t.name,
              dayOfWeek: t.day_of_week,
              time: t.time,
              location: t.location,
              isOneTime: false,
              repeatMode: 'none',
            })),
          });
        }

        if (announcementsRes.data) {
          setAnnouncements(announcementsRes.data.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            date: a.date,
            createdAt: a.created_at,
          })));
        }

        if (appointmentsRes.data) {
          setAppointments(appointmentsRes.data.map(a => ({
            id: a.id,
            name: a.name,
            category: a.category,
            date: a.date,
            time: a.time,
            location: a.location,
            memberIds: a.member_ids ?? [],
            createdAt: a.created_at,
            createdBy: a.created_by,
            status: a.status,
            forUserId: (a as any).for_user_id ?? undefined,
            confirmed: (a as any).confirmed ?? false,
            cancelledBy: (a as any).cancelled_by ?? undefined,
          })));
          if (appointmentsRes.data.length === 0) {
            const defaultAppointment: Database['public']['Tables']['appointments']['Insert'] = {
              id: "ap_example",
              name: "Optreden FC Eindhoven",
              category: "Feestje",
              date: "2025-12-20",
              time: "21:30",
              location: "FC Eindhoven",
              member_ids: [],
              created_by: "u_admin",
            };
            await supabase.from('appointments').insert(defaultAppointment);
            setAppointments([{
              id: defaultAppointment.id,
              name: defaultAppointment.name,
              category: defaultAppointment.category,
              date: defaultAppointment.date,
              time: defaultAppointment.time,
              location: defaultAppointment.location,
              memberIds: defaultAppointment.member_ids ?? [],
              createdAt: new Date().toISOString(),
              createdBy: defaultAppointment.created_by,
              status: 'active',
              forUserId: undefined,
              confirmed: false,
              cancelledBy: undefined,
            }]);
          }
        }

        if (mediaLibraryRes.data) {
          setMediaLibrary(mediaLibraryRes.data.map(m => ({
            id: m.id,
            name: m.name,
            path: m.path,
            folder_path: m.folder_path,
            file_type: m.file_type,
            file_size: m.file_size,
            mime_type: m.mime_type,
            storage_path: m.storage_path,
            uploaded_by: m.uploaded_by,
            created_at: m.created_at,
          })));
        }

        if (groupsRes.data && groupMembersRes.data) {
          const groupsWithMembers = groupsRes.data.map(g => {
            const members = groupMembersRes.data.filter(gm => gm.group_id === g.id);
            return {
              id: g.id,
              name: g.name,
              memberIds: members.map(m => m.user_id),
              createdBy: g.created_by,
              createdAt: g.created_at,
            };
          });
          setGroups(groupsWithMembers);
        }

        if (settingsRes.data) {
          setNotificationSettings({
            newsEnabled: settingsRes.data.news_enabled,
            newsHoursAdvance: settingsRes.data.news_hours_advance,
            assignmentsEnabled: settingsRes.data.assignments_enabled,
            trainingCancellationEnabled: settingsRes.data.training_cancellation_enabled,
            trainingHoursAdvance: settingsRes.data.training_hours_advance,
            performancesEnabled: settingsRes.data.performances_enabled,
            performancesHoursAdvance: settingsRes.data.performances_hours_advance,
          });
        } else {
          const defaultSettings: Database['public']['Tables']['notification_settings']['Insert'] = {
            news_enabled: true,
            news_hours_advance: 24,
            assignments_enabled: true,
            training_cancellation_enabled: true,
            training_hours_advance: 2,
            performances_enabled: true,
            performances_hours_advance: 48,
          };
          await supabase.from('notification_settings').insert(defaultSettings);
          setNotificationSettings({
            newsEnabled: defaultSettings.news_enabled,
            newsHoursAdvance: defaultSettings.news_hours_advance,
            assignmentsEnabled: defaultSettings.assignments_enabled,
            trainingCancellationEnabled: defaultSettings.training_cancellation_enabled,
            trainingHoursAdvance: defaultSettings.training_hours_advance,
            performancesEnabled: defaultSettings.performances_enabled,
            performancesHoursAdvance: defaultSettings.performances_hours_advance,
          });
        }

        console.log('✅ Data loaded from Supabase');
        
        if (savedUserId) {
          const savedUser = usersRes.data?.find(u => u.id === savedUserId);
          if (savedUser && !savedUser.deleted_by_user) {
            setCurrentUser({
              id: savedUser.id,
              username: savedUser.username,
              password: savedUser.password,
              role: savedUser.role as Role,
              passwordChangedByUser: savedUser.password_changed_by_user,
              email: savedUser.email,
              phone: savedUser.phone,
              age: savedUser.age,
              address: savedUser.address,
              notificationPreferences: (savedUser.notification_preferences as any) ?? {
                newsEnabled: true,
                assignmentsEnabled: true,
                trainingsEnabled: true,
                performancesEnabled: true,
              },
              deletedByUser: savedUser.deleted_by_user ?? false,
              deletedAt: savedUser.deleted_at ?? null,
              isCrownAdmin: savedUser.is_crown_admin ?? false,
            });
            console.log('✅ Restored login session for user:', savedUser.username);
          } else {
            console.log('⚠️ Saved user not found or deleted, clearing session');
            await AsyncStorage.removeItem('saved_user_id');
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Error initializing data:', error);
        setIsInitialized(true);
      }
    };

    initializeData();

    const usersSubscription = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        console.log('🔄 Users changed, reloading...');
        supabase.from('users').select('*').then(res => {
          if (res.data) {
            const mappedUsers = res.data.map(u => ({
              id: u.id,
              username: u.username,
              password: u.password,
              role: u.role as Role,
              passwordChangedByUser: u.password_changed_by_user,
              email: u.email,
              phone: u.phone,
              age: u.age,
              address: u.address,
              notificationPreferences: (u.notification_preferences as any) ?? {
                newsEnabled: true,
                assignmentsEnabled: true,
                trainingsEnabled: true,
                performancesEnabled: true,
              },
              deletedByUser: u.deleted_by_user ?? false,
              deletedAt: u.deleted_at ?? null,
              isCrownAdmin: u.is_crown_admin ?? false,
            }));
            setUsers(mappedUsers);
          }
        });
      })
      .subscribe();

    const assignmentsSubscription = supabase
      .channel('assignments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        console.log('🔄 Assignments changed, reloading...');
        supabase.from('assignments').select('*').then(res => {
          if (res.data) {
            setAssignments(res.data.map(a => ({
              id: a.id,
              title: a.title,
              description: a.description,
              assignedUserIds: a.assigned_user_ids ?? [],
              dueDate: a.due_date ?? undefined,
              mediaUri: a.media_uri ?? undefined,
              mediaType: a.media_type ?? undefined,
              requireMedia: a.require_media ?? false,
              completedBy: (a.completed_by as any) ?? [],
              createdAt: a.created_at,
              submissions: (a.submissions as any) ?? [],
            })));
          }
        });
      })
      .subscribe();

    const announcementsSubscription = supabase
      .channel('announcements-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        console.log('🔄 Announcements changed, reloading...');
        supabase.from('announcements').select('*').then(res => {
          if (res.data) {
            setAnnouncements(res.data.map(a => ({
              id: a.id,
              name: a.name,
              description: a.description,
              date: a.date,
              createdAt: a.created_at,
            })));
          }
        });
      })
      .subscribe();

    const appointmentsSubscription = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        console.log('🔄 Appointments changed, reloading...');
        supabase.from('appointments').select('*').then(res => {
          if (res.data) {
            setAppointments(res.data.map(a => ({
              id: a.id,
              name: a.name,
              category: a.category,
              date: a.date,
              time: a.time,
              location: a.location,
              memberIds: a.member_ids ?? [],
              createdAt: a.created_at,
              createdBy: a.created_by,
              status: a.status,
              forUserId: (a as any).for_user_id ?? undefined,
              confirmed: (a as any).confirmed ?? false,
              cancelledBy: (a as any).cancelled_by ?? undefined,
            })));
          }
        });
      })
      .subscribe();

    const trainingsSubscription = supabase
      .channel('trainings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trainings' }, () => {
        console.log('🔄 Trainings changed, reloading...');
        Promise.all([
          supabase.from('trainings').select('*'),
          supabase.from('practice_schedule').select('*').single(),
        ]).then(([trainingsRes, scheduleRes]) => {
          if (trainingsRes.data && scheduleRes.data) {
            setPracticeSchedule({
              regularDays: (scheduleRes.data.regular_days as any) ?? [],
              location: scheduleRes.data.location,
              cancelledDates: (scheduleRes.data.cancelled_dates as any) ?? [],
              isActive: scheduleRes.data.is_active,
              trainings: trainingsRes.data
                .filter(t => !t.deleted_at)
                .map(t => ({
                  id: t.training_id,
                  name: t.name,
                  dayOfWeek: t.day_of_week,
                  time: t.time,
                  location: t.location,
                  isOneTime: t.is_one_time ?? false,
                  repeatMode: (t.repeat_mode as any) ?? 'none',
                  customDate: t.custom_date ?? undefined,
                })),
            });
          }
        });
      })
      .subscribe();

    const scheduleSubscription = supabase
      .channel('schedule-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'practice_schedule' }, () => {
        console.log('🔄 Practice schedule changed, reloading...');
        Promise.all([
          supabase.from('trainings').select('*'),
          supabase.from('practice_schedule').select('*').single(),
        ]).then(([trainingsRes, scheduleRes]) => {
          if (trainingsRes.data && scheduleRes.data) {
            setPracticeSchedule({
              regularDays: (scheduleRes.data.regular_days as any) ?? [],
              location: scheduleRes.data.location,
              cancelledDates: (scheduleRes.data.cancelled_dates as any) ?? [],
              isActive: scheduleRes.data.is_active,
              trainings: trainingsRes.data
                .filter(t => !t.deleted_at)
                .map(t => ({
                  id: t.training_id,
                  name: t.name,
                  dayOfWeek: t.day_of_week,
                  time: t.time,
                  location: t.location,
                  isOneTime: t.is_one_time ?? false,
                  repeatMode: (t.repeat_mode as any) ?? 'none',
                  customDate: t.custom_date ?? undefined,
                })),
            });
          }
        });
      })
      .subscribe();

    const settingsSubscription = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_settings' }, () => {
        console.log('🔄 Settings changed, reloading...');
        supabase.from('notification_settings').select('*').single().then(res => {
          if (res.data) {
            setNotificationSettings({
              newsEnabled: res.data.news_enabled,
              newsHoursAdvance: res.data.news_hours_advance,
              assignmentsEnabled: res.data.assignments_enabled,
              trainingCancellationEnabled: res.data.training_cancellation_enabled,
              trainingHoursAdvance: res.data.training_hours_advance,
              performancesEnabled: res.data.performances_enabled,
              performancesHoursAdvance: res.data.performances_hours_advance,
            });
          }
        });
      })
      .subscribe();

    const mediaLibrarySubscription = supabase
      .channel('media-library-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_library' }, async (payload) => {
        console.log('🔄 Media library changed:', payload.eventType, payload);
        console.log('🔄 Payload new data:', payload.new);
        console.log('🔄 Payload old data:', payload.old);
        
        try {
          const res = await supabase.from('media_library').select('*');
          if (res.data) {
            console.log('✅ Reloaded media library:', res.data.length, 'items');
            const mapped = res.data.map(m => ({
              id: m.id,
              name: m.name,
              path: m.path,
              folder_path: m.folder_path,
              file_type: m.file_type,
              file_size: m.file_size,
              mime_type: m.mime_type,
              storage_path: m.storage_path,
              uploaded_by: m.uploaded_by,
              created_at: m.created_at,
            }));
            console.log('✅ Mapped items:', mapped);
            setMediaLibrary(mapped);
          }
        } catch (error) {
          console.error('❌ Error reloading media library:', error);
        }
      })
      .subscribe();

    const groupsSubscription = supabase
      .channel('groups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        console.log('🔄 Groups changed, reloading...');
        Promise.all([
          supabase.from('groups').select('*'),
          supabase.from('group_members').select('*'),
        ]).then(([groupsRes, groupMembersRes]) => {
          if (groupsRes.data && groupMembersRes.data) {
            const groupsWithMembers = groupsRes.data.map(g => {
              const members = groupMembersRes.data.filter(gm => gm.group_id === g.id);
              return {
                id: g.id,
                name: g.name,
                memberIds: members.map(m => m.user_id),
                createdBy: g.created_by,
                createdAt: g.created_at,
              };
            });
            setGroups(groupsWithMembers);
          }
        });
      })
      .subscribe();

    const groupMembersSubscription = supabase
      .channel('group-members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => {
        console.log('🔄 Group members changed, reloading...');
        Promise.all([
          supabase.from('groups').select('*'),
          supabase.from('group_members').select('*'),
        ]).then(([groupsRes, groupMembersRes]) => {
          if (groupsRes.data && groupMembersRes.data) {
            const groupsWithMembers = groupsRes.data.map(g => {
              const members = groupMembersRes.data.filter(gm => gm.group_id === g.id);
              return {
                id: g.id,
                name: g.name,
                memberIds: members.map(m => m.user_id),
                createdBy: g.created_by,
                createdAt: g.created_at,
              };
            });
            setGroups(groupsWithMembers);
          }
        });
      })
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from Supabase real-time...');
      usersSubscription.unsubscribe();
      assignmentsSubscription.unsubscribe();
      announcementsSubscription.unsubscribe();
      appointmentsSubscription.unsubscribe();
      trainingsSubscription.unsubscribe();
      scheduleSubscription.unsubscribe();
      settingsSubscription.unsubscribe();
      mediaLibrarySubscription.unsubscribe();
      groupsSubscription.unsubscribe();
      groupMembersSubscription.unsubscribe();
    };
  }, []);

  const setRole = useCallback(async (userId: string, role: Role) => {
    console.log('💾 Updating user role in Supabase...');
    
    const targetUser = users.find(u => u.id === userId);
    
    if (!currentUser) {
      console.log('❌ No current user');
      return;
    }
    
    if (targetUser?.role === 'admin' && role === 'member') {
      if (!currentUser.isCrownAdmin) {
        console.log('❌ Only crown admin can demote admins');
        throw new Error('Only crown admin can demote admins to members');
      }
    }
    
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    const updateData: Database['public']['Tables']['users']['Update'] = { role };
    await supabase.from('users').update(updateData).eq('id', userId);
    console.log('✅ User role updated');
  }, [users, currentUser]);

  const login = useCallback(async (username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.deletedByUser) {
        return false;
      }
      setCurrentUser(user);
      
      try {
        await AsyncStorage.setItem('saved_user_id', user.id);
        console.log('✅ Login saved to storage');
      } catch (error) {
        console.error('❌ Error saving login:', error);
      }
      
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    
    try {
      await AsyncStorage.removeItem('saved_user_id');
      console.log('✅ Login removed from storage');
    } catch (error) {
      console.error('❌ Error removing login:', error);
    }
  }, []);

  const addUser = useCallback(async (username: string, role: Role): Promise<{ user: User; password: string }> => {
    console.log('💾 Adding new user to Supabase...');
    const password = genPassword();
    const user: User = { 
      id: genId("u"), 
      username, 
      password, 
      role, 
      passwordChangedByUser: false,
      notificationPreferences: {
        newsEnabled: true,
        assignmentsEnabled: true,
        trainingsEnabled: true,
        performancesEnabled: true,
      },
      deletedByUser: false,
      deletedAt: null,
      isCrownAdmin: false,
    };
    const insertData: Database['public']['Tables']['users']['Insert'] = {
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role,
      password_changed_by_user: user.passwordChangedByUser,
      notification_preferences: user.notificationPreferences as any,
    };
    await supabase.from('users').insert(insertData);
    setUsers((prev) => [...prev, user]);
    console.log('✅ User added');
    return { user, password };
  }, []);

  const deleteUsers = useCallback(async (userIds: string[]) => {
    console.log('💾 Deleting users from Supabase...', userIds);
    const idSet = new Set(userIds);
    setUsers((prev) => prev.filter((u) => !idSet.has(u.id)));
    await supabase.from('users').delete().in('id', userIds);
    if (currentUser && idSet.has(currentUser.id)) {
      setCurrentUser(null);
    }
    console.log('✅ Users deleted');
  }, [currentUser]);

  const softDeleteAccount = useCallback(async (userId: string) => {
    console.log('💾 Soft deleting account...');
    const updateData: Database['public']['Tables']['users']['Update'] = {
      deleted_by_user: true,
      deleted_at: new Date().toISOString()
    };
    await supabase.from('users').update(updateData).eq('id', userId);
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, deletedByUser: true, deletedAt: new Date().toISOString() } : u
    ));
    console.log('✅ Account soft deleted');
  }, []);

  const reactivateAccount = useCallback(async (userId: string, newPassword: string) => {
    console.log('💾 Reactivating account...');
    const updateData: Database['public']['Tables']['users']['Update'] = {
      deleted_by_user: false,
      deleted_at: null,
      password: newPassword,
      password_changed_by_user: false
    };
    await supabase.from('users').update(updateData).eq('id', userId);
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, deletedByUser: false, deletedAt: null, password: newPassword, passwordChangedByUser: false } : u
    ));
    console.log('✅ Account reactivated');
  }, []);

  const permanentDeleteAccount = useCallback(async (userId: string) => {
    console.log('💾 Permanently deleting account...');
    await supabase.from('users').delete().eq('id', userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    console.log('✅ Account permanently deleted');
  }, []);

  const resetPassword = useCallback(async (userId: string): Promise<string> => {
    console.log('💾 Resetting password in Supabase...');
    const newPassword = genPassword();
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, password: newPassword, passwordChangedByUser: false } : u
    ));
    const updateData: Database['public']['Tables']['users']['Update'] = { password: newPassword, password_changed_by_user: false };
    await supabase.from('users').update(updateData).eq('id', userId);
    console.log('✅ Password reset');
    return newPassword;
  }, []);

  const changePassword = useCallback(async (userId: string, newPassword: string) => {
    console.log('💾 Changing password in Supabase...');
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, password: newPassword, passwordChangedByUser: true } : u
    ));
    const updateData: Database['public']['Tables']['users']['Update'] = { password: newPassword, password_changed_by_user: true };
    await supabase.from('users').update(updateData).eq('id', userId);
    console.log('✅ Password changed');
  }, []);

  const updateUserProfile = useCallback(async (userId: string, profile: { username?: string; email?: string | null; phone?: string | null; age?: string | null; address?: string | null }) => {
    console.log('💾 Updating user profile in Supabase...');
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, ...profile } : u
    ));
    const updateData: Database['public']['Tables']['users']['Update'] = profile as any;
    await supabase.from('users').update(updateData).eq('id', userId);
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => prev ? { ...prev, ...profile } : prev);
    }
    console.log('✅ User profile updated');
  }, [currentUser]);

  const updateUserNotificationPreferences = useCallback(async (userId: string, preferences: UserNotificationPreferences) => {
    console.log('💾 Updating user notification preferences in Supabase...');
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, notificationPreferences: preferences } : u
    ));
    const updateData: Database['public']['Tables']['users']['Update'] = {
      notification_preferences: preferences as any,
    };
    await supabase.from('users').update(updateData).eq('id', userId);
    console.log('✅ User notification preferences updated');
  }, []);

  const setPermissions = useCallback((role: Role, perms: PermissionMatrix) => {
    setPermissionsState((prev) => ({ ...prev, [role]: perms }));
  }, []);

  const addFolder = useCallback((name: string, path: string[]) => {
    const newFolder: CategoryNode = {
      id: genId("c"),
      name,
      children: [],
      media: [],
    };

    setLibrary((prev) => {
      if (path.length === 0) {
        return [...prev, newFolder];
      }

      const addToNode = (nodes: CategoryNode[], currentPath: string[]): CategoryNode[] => {
        return nodes.map((node) => {
          if (node.id === currentPath[0]) {
            if (currentPath.length === 1) {
              return {
                ...node,
                children: [...(node.children ?? []), newFolder],
              };
            } else {
              return {
                ...node,
                children: addToNode(node.children ?? [], currentPath.slice(1)),
              };
            }
          }
          return node;
        });
      };

      return addToNode(prev, path);
    });
  }, []);

  const deleteFolders = useCallback((folderIds: string[], path: string[]) => {
    const idSet = new Set(folderIds);

    setLibrary((prev) => {
      if (path.length === 0) {
        return prev.filter((node) => !idSet.has(node.id));
      }

      const removeFromNode = (nodes: CategoryNode[], currentPath: string[]): CategoryNode[] => {
        return nodes.map((node) => {
          if (node.id === currentPath[0]) {
            if (currentPath.length === 1) {
              return {
                ...node,
                children: (node.children ?? []).filter((child) => !idSet.has(child.id)),
              };
            } else {
              return {
                ...node,
                children: removeFromNode(node.children ?? [], currentPath.slice(1)),
              };
            }
          }
          return node;
        });
      };

      return removeFromNode(prev, path);
    });
  }, []);

  const addPerformance = useCallback((perf: Omit<Performance, 'id'>) => {
    const newPerf: Performance = {
      ...perf,
      id: genId("p"),
    };
    setPerformances((prev) => [...prev, newPerf]);
  }, []);

  const updatePerformance = useCallback((id: string, perf: Partial<Performance>) => {
    setPerformances((prev) => prev.map((p) => (p.id === id ? { ...p, ...perf } : p)));
  }, []);

  const updatePracticeSchedule = useCallback(async (schedule: PracticeSchedule) => {
    console.log('💾 Updating practice schedule in Supabase...');
    
    const oldSchedule = practiceSchedule;
    setPracticeSchedule(schedule);
    
    const scheduleUpdateData: Database['public']['Tables']['practice_schedule']['Update'] = {
      regular_days: schedule.regularDays as any,
      location: schedule.location,
      cancelled_dates: schedule.cancelledDates as any,
      is_active: schedule.isActive,
    };
    
    const scheduleIdRes = await supabase.from('practice_schedule').select('id').single();
    await supabase.from('practice_schedule').update(scheduleUpdateData).eq('id', scheduleIdRes.data?.id ?? '');
    
    // Soft delete all existing trainings
    await supabase.from('trainings').update({ deleted_at: new Date().toISOString() }).is('deleted_at', null);
    
    if (schedule.trainings.length > 0) {
      // Check for existing trainings and update or insert
      for (const training of schedule.trainings) {
        const existingTraining = await supabase
          .from('trainings')
          .select('*')
          .eq('training_id', training.id)
          .single();
        
        if (existingTraining.data) {
          // Update existing training and reactivate it
          await supabase
            .from('trainings')
            .update({
              name: training.name,
              day_of_week: training.dayOfWeek,
              time: training.time,
              location: training.location,
              is_one_time: training.isOneTime ?? false,
              repeat_mode: training.repeatMode ?? 'none',
              custom_date: training.customDate ?? null,
              deleted_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('training_id', training.id);
        } else {
          // Insert new training
          await supabase
            .from('trainings')
            .insert({
              training_id: training.id,
              name: training.name,
              day_of_week: training.dayOfWeek,
              time: training.time,
              location: training.location,
              is_one_time: training.isOneTime ?? false,
              repeat_mode: training.repeatMode ?? 'none',
              custom_date: training.customDate ?? null,
            });
        }
      }
      
      const newOneTimeTrainings = schedule.trainings.filter(t => {
        const existedBefore = oldSchedule.trainings.find(old => old.id === t.id);
        return t.isOneTime && (!existedBefore || !existedBefore.isOneTime);
      });
      
      for (const training of newOneTimeTrainings) {
        const now = new Date();
        const currentDayOfWeek = now.getDay();
        now.setHours(0, 0, 0, 0);
        
        let nextTrainingDate = new Date(now);
        let daysUntilTraining = (training.dayOfWeek - currentDayOfWeek + 7) % 7;
        
        if (daysUntilTraining === 0) {
          daysUntilTraining = 7;
        }
        
        nextTrainingDate.setDate(nextTrainingDate.getDate() + daysUntilTraining);
        
        const year = nextTrainingDate.getFullYear();
        const month = String(nextTrainingDate.getMonth() + 1).padStart(2, '0');
        const day = String(nextTrainingDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const newAnnouncement: Announcement = {
          id: genId('an'),
          name: 'Extra training',
          description: `Extra training: ${training.name} op ${training.time} in ${training.location}`,
          date: dateStr,
          createdAt: new Date().toISOString(),
          isExtraTraining: true,
        };
        
        const insertData: Database['public']['Tables']['announcements']['Insert'] = {
          id: newAnnouncement.id,
          name: newAnnouncement.name,
          description: newAnnouncement.description,
          date: newAnnouncement.date,
        };
        await supabase.from('announcements').insert(insertData);
        setAnnouncements((prev) => [...prev, newAnnouncement].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
        
        console.log('✅ Extra training announcement created');
      }
    }
    
    console.log('✅ Practice schedule updated');
  }, [practiceSchedule]);

  const getRecentMedia = useCallback((): MediaItem[] => {
    const allMedia: MediaItem[] = [];
    
    const collectMedia = (nodes: CategoryNode[]) => {
      for (const node of nodes) {
        if (node.media) {
          allMedia.push(...node.media);
        }
        if (node.children) {
          collectMedia(node.children);
        }
      }
    };
    
    collectMedia(library);
    return allMedia.filter(m => !clearedMediaIds.has(m.id)).slice(0, 5);
  }, [library, clearedMediaIds]);

  const clearRecentMediaList = useCallback(async () => {
    console.log('🗑️ Clearing recent media list...');
    const allMedia: MediaItem[] = [];
    
    const collectMedia = (nodes: CategoryNode[]) => {
      for (const node of nodes) {
        if (node.media) {
          allMedia.push(...node.media);
        }
        if (node.children) {
          collectMedia(node.children);
        }
      }
    };
    
    collectMedia(library);
    const allIds = allMedia.map(m => m.id);
    const newClearedSet = new Set([...clearedMediaIds, ...allIds]);
    
    setClearedMediaIds(newClearedSet);
    
    try {
      await AsyncStorage.setItem('cleared_recent_media', JSON.stringify(Array.from(newClearedSet)));
      console.log('✅ Recent media list cleared');
    } catch (error) {
      console.error('❌ Error saving cleared media:', error);
    }
  }, [library, clearedMediaIds]);

  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id' | 'createdAt' | 'submissions' | 'completedBy'>) => {
    console.log('💾 Adding assignment to Supabase...');
    const newAssignment: Assignment = {
      ...assignment,
      id: genId("a"),
      createdAt: new Date().toISOString(),
      completedBy: [],
      submissions: [],
    };
    const insertData: Database['public']['Tables']['assignments']['Insert'] = {
      id: newAssignment.id,
      title: newAssignment.title,
      description: newAssignment.description,
      assigned_user_ids: newAssignment.assignedUserIds,
      due_date: newAssignment.dueDate ?? null,
      media_uri: newAssignment.mediaUri ?? null,
      media_type: newAssignment.mediaType ?? null,
      require_media: newAssignment.requireMedia,
      completed_by: newAssignment.completedBy as any,
      submissions: newAssignment.submissions as any,
    };
    
    const { error } = await supabase.from('assignments').insert(insertData);
    if (error) {
      console.error('❌ Error adding assignment:', error.message || JSON.stringify(error));
      throw error;
    }
    
    setAssignments((prev) => [newAssignment, ...prev]);
    console.log('✅ Assignment added:', newAssignment.id, newAssignment.title);

    if (notificationSettings.assignmentsEnabled && currentUser) {
      const { notifyNewAssignment } = await import('@/lib/notification-service');
      const usersToNotify = users.filter(u => 
        u.role === 'member' && 
        u.notificationPreferences.assignmentsEnabled &&
        newAssignment.assignedUserIds.includes(u.id) &&
        u.id !== currentUser.id
      );
      const userIds = usersToNotify.map(u => u.id);
      if (userIds.length > 0) {
        await notifyNewAssignment(
          newAssignment.title,
          newAssignment.description,
          newAssignment.id,
          userIds
        );
      }
    }
  }, [notificationSettings, currentUser, users]);

  const updateAssignment = useCallback(async (id: string, assignment: Partial<Omit<Assignment, 'id' | 'createdAt' | 'submissions' | 'completedBy'>>) => {
    console.log('💾 Updating assignment in Supabase...', id);
    const updateData: Database['public']['Tables']['assignments']['Update'] = {};
    if (assignment.title !== undefined) updateData.title = assignment.title;
    if (assignment.description !== undefined) updateData.description = assignment.description;
    if (assignment.assignedUserIds !== undefined) updateData.assigned_user_ids = assignment.assignedUserIds;
    if (assignment.dueDate !== undefined) updateData.due_date = assignment.dueDate;
    if (assignment.mediaUri !== undefined) updateData.media_uri = assignment.mediaUri;
    if (assignment.mediaType !== undefined) updateData.media_type = assignment.mediaType;
    if (assignment.requireMedia !== undefined) updateData.require_media = assignment.requireMedia;
    
    const { error } = await supabase.from('assignments').update(updateData).eq('id', id);
    if (error) {
      console.error('❌ Error updating assignment:', error);
      throw error;
    }
    
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, ...assignment } : a)));
    console.log('✅ Assignment updated:', id);
  }, []);

  const deleteAssignments = useCallback(async (ids: string[]) => {
    console.log('💾 Deleting assignments from Supabase...', ids);
    
    const { error } = await supabase.from('assignments').delete().in('id', ids);
    if (error) {
      console.error('❌ Error deleting assignments:', error);
      throw error;
    }
    
    const idSet = new Set(ids);
    setAssignments((prev) => prev.filter((a) => !idSet.has(a.id)));
    console.log('✅ Assignments deleted:', ids.length);
  }, []);

  const completeAssignment = useCallback(async (assignmentId: string, userId: string, submission?: { mediaUri?: string; notes?: string }) => {
    console.log('💾 Completing assignment in Supabase...', assignmentId);
    
    const completion = {
      userId,
      completedAt: new Date().toISOString(),
      ...(submission?.mediaUri && { mediaUri: submission.mediaUri }),
    };
    
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      console.error('❌ Assignment not found:', assignmentId);
      throw new Error('Assignment not found');
    }
    
    const updatedCompletedBy = [...assignment.completedBy, completion];
    
    const newSubmission: AssignmentSubmission = {
      userId,
      createdAt: new Date().toISOString(),
      ...(submission?.mediaUri && { mediaUri: submission.mediaUri }),
      ...(submission?.notes && { notes: submission.notes }),
    };
    
    const updatedSubmissions = [...assignment.submissions, newSubmission];
    
    const updateData: Database['public']['Tables']['assignments']['Update'] = {
      completed_by: updatedCompletedBy as any,
      submissions: updatedSubmissions as any,
    };
    
    const { error } = await supabase.from('assignments').update(updateData).eq('id', assignmentId);
    if (error) {
      console.error('❌ Error completing assignment:', error);
      throw error;
    }
    
    setAssignments((prev) => prev.map((a) => {
      if (a.id === assignmentId) {
        return { ...a, completedBy: updatedCompletedBy, submissions: updatedSubmissions };
      }
      return a;
    }));
    
    console.log('✅ Assignment completed:', assignmentId);
  }, [assignments]);

  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    console.log('💾 Adding announcement to Supabase...');
    const newAnnouncement: Announcement = {
      ...announcement,
      id: genId("an"),
      createdAt: new Date().toISOString(),
    };
    const insertData: Database['public']['Tables']['announcements']['Insert'] = {
      id: newAnnouncement.id,
      name: newAnnouncement.name,
      description: newAnnouncement.description,
      date: newAnnouncement.date,
    };
    await supabase.from('announcements').insert(insertData);
    setAnnouncements((prev) => [...prev, newAnnouncement].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
    console.log('✅ Announcement added');

    if (notificationSettings.newsEnabled && currentUser) {
      const { notifyNewAnnouncement } = await import('@/lib/notification-service');
      const usersToNotify = users.filter(u => 
        u.role === 'member' && 
        u.notificationPreferences.newsEnabled &&
        u.id !== currentUser.id
      );
      const userIds = usersToNotify.map(u => u.id);
      if (userIds.length > 0) {
        await notifyNewAnnouncement(
          newAnnouncement.name,
          newAnnouncement.description,
          newAnnouncement.id,
          userIds
        );
      }
    }
  }, [notificationSettings, currentUser, users]);

  const updateAnnouncement = useCallback(async (id: string, announcement: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => {
    console.log('💾 Updating announcement in Supabase...');
    setAnnouncements((prev) => 
      prev.map((a) => (a.id === id ? { ...a, ...announcement } : a))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    const updateData: Database['public']['Tables']['announcements']['Update'] = announcement;
    await supabase.from('announcements').update(updateData).eq('id', id);
    console.log('✅ Announcement updated');
  }, []);

  const deleteAnnouncements = useCallback(async (ids: string[]) => {
    console.log('💾 Deleting announcements from Supabase...');
    const idSet = new Set(ids);
    setAnnouncements((prev) => prev.filter((a) => !idSet.has(a.id)));
    await supabase.from('announcements').delete().in('id', ids);
    console.log('✅ Announcements deleted');
  }, []);

  const addAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'createdBy' | 'status'>) => {
    console.log('💾 Adding appointment to Supabase...');
    const newAppointment: Appointment = {
      ...appointment,
      id: genId("ap"),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id ?? '',
      status: 'active',
    };
    const insertData: Database['public']['Tables']['appointments']['Insert'] = {
      id: newAppointment.id,
      name: newAppointment.name,
      category: newAppointment.category,
      date: newAppointment.date,
      time: newAppointment.time,
      location: newAppointment.location,
      member_ids: newAppointment.memberIds,
      created_by: newAppointment.createdBy,
      for_user_id: newAppointment.forUserId ?? null,
      confirmed: newAppointment.confirmed ?? false,
    };
    await supabase.from('appointments').insert(insertData);
    setAppointments((prev) => [...prev, newAppointment].sort((a, b) => 
      new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
    ));
    console.log('✅ Appointment added');

    if (notificationSettings.performancesEnabled && currentUser) {
      const { sendNotificationToUsers } = await import('@/lib/notification-service');
      const usersToNotify = users.filter(u => 
        newAppointment.memberIds.includes(u.id) &&
        u.notificationPreferences.performancesEnabled &&
        u.id !== currentUser.id
      );
      const userIds = usersToNotify.map(u => u.id);
      if (userIds.length > 0) {
        await sendNotificationToUsers({
          userIds,
          title: `📅 Nieuwe afspraak: ${newAppointment.name}`,
          body: `${newAppointment.date} om ${newAppointment.time} in ${newAppointment.location}`,
          data: {
            type: 'performance',
            id: newAppointment.id,
          },
        });
      }
    }
  }, [currentUser, notificationSettings, users]);

  const updateAppointment = useCallback(async (id: string, appointment: Partial<Omit<Appointment, 'id' | 'createdAt'>>) => {
    console.log('💾 Updating appointment in Supabase...');
    
    const oldAppointment = appointments.find(a => a.id === id);
    
    setAppointments((prev) => 
      prev.map((a) => (a.id === id ? { ...a, ...appointment } : a))
        .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
    );
    const updateData: Database['public']['Tables']['appointments']['Update'] = {};
    if (appointment.name !== undefined) updateData.name = appointment.name;
    if (appointment.category !== undefined) updateData.category = appointment.category;
    if (appointment.date !== undefined) updateData.date = appointment.date;
    if (appointment.time !== undefined) updateData.time = appointment.time;
    if (appointment.location !== undefined) updateData.location = appointment.location;
    if (appointment.memberIds !== undefined) updateData.member_ids = appointment.memberIds;
    if (appointment.status !== undefined) updateData.status = appointment.status;
    if (appointment.createdBy !== undefined) updateData.created_by = appointment.createdBy;
    if (appointment.forUserId !== undefined) updateData.for_user_id = appointment.forUserId;
    if (appointment.confirmed !== undefined) updateData.confirmed = appointment.confirmed;
    await supabase.from('appointments').update(updateData).eq('id', id);
    console.log('✅ Appointment updated');

    if (oldAppointment) {
      if (appointment.status === 'cancelled' && oldAppointment.status !== 'cancelled') {
        const existingCancelledAnnouncement = announcements.find(
          a => a.name === `Afspraak geannuleerd: ${oldAppointment.name}` || 
             a.description.includes(`De afspraak "${oldAppointment.name}" op ${oldAppointment.date} om ${oldAppointment.time} in ${oldAppointment.location} is geannuleerd.`)
        );
        
        if (!existingCancelledAnnouncement) {
          const newAnnouncement: Announcement = {
            id: genId("an"),
            name: `Afspraak geannuleerd: ${oldAppointment.name}`,
            description: `De afspraak "${oldAppointment.name}" op ${oldAppointment.date} om ${oldAppointment.time} in ${oldAppointment.location} is geannuleerd.`,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
          };
          const insertData: Database['public']['Tables']['announcements']['Insert'] = {
            id: newAnnouncement.id,
            name: newAnnouncement.name,
            description: newAnnouncement.description,
            date: newAnnouncement.date,
          };
          await supabase.from('announcements').insert(insertData);
          setAnnouncements((prev) => [...prev, newAnnouncement].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          ));
        }
      } else if (appointment.status === 'active' && oldAppointment.status === 'cancelled') {
        const cancelledAnnouncements = announcements.filter(
          a => a.name === `Afspraak geannuleerd: ${oldAppointment.name}` || 
             a.description.includes(`De afspraak "${oldAppointment.name}"`) && a.description.includes('geannuleerd')
        );
        
        if (cancelledAnnouncements.length > 0) {
          const idsToDelete = cancelledAnnouncements.map(a => a.id);
          await supabase.from('announcements').delete().in('id', idsToDelete);
          setAnnouncements((prev) => prev.filter(a => !idsToDelete.includes(a.id)));
        }
      } else if (appointment.status !== 'cancelled' && oldAppointment.status !== 'cancelled') {
        const changes: string[] = [];
        if (appointment.date !== undefined && appointment.date !== oldAppointment.date) {
          changes.push(`datum gewijzigd naar ${appointment.date}`);
        }
        if (appointment.time !== undefined && appointment.time !== oldAppointment.time) {
          changes.push(`tijd gewijzigd naar ${appointment.time}`);
        }
        if (appointment.location !== undefined && appointment.location !== oldAppointment.location) {
          changes.push(`locatie gewijzigd naar ${appointment.location}`);
        }
        
        if (changes.length > 0) {
          const existingChangeAnnouncement = announcements.find(
            a => a.name === `Afspraak gewijzigd: ${oldAppointment.name}` && 
                 a.date === new Date().toISOString().split('T')[0]
          );
          
          if (!existingChangeAnnouncement) {
            const newAnnouncement: Announcement = {
              id: genId("an"),
              name: `Afspraak gewijzigd: ${oldAppointment.name}`,
              description: `De afspraak "${oldAppointment.name}" is bijgewerkt: ${changes.join(', ')}.`,
              date: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
            };
            const insertData: Database['public']['Tables']['announcements']['Insert'] = {
              id: newAnnouncement.id,
              name: newAnnouncement.name,
              description: newAnnouncement.description,
              date: newAnnouncement.date,
            };
            await supabase.from('announcements').insert(insertData);
            setAnnouncements((prev) => [...prev, newAnnouncement].sort((a, b) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            ));
          }
        }
      }
    }
  }, [appointments, announcements]);

  const deleteAppointments = useCallback(async (ids: string[]) => {
    console.log('💾 Deleting appointments from Supabase...');
    const idSet = new Set(ids);
    setAppointments((prev) => prev.filter((a) => !idSet.has(a.id)));
    await supabase.from('appointments').delete().in('id', ids);
    console.log('✅ Appointments deleted');
  }, []);

  const updateNotificationSettings = useCallback(async (settings: NotificationSettings) => {
    console.log('💾 Updating notification settings in Supabase...');
    setNotificationSettings(settings);
    const updateData: Database['public']['Tables']['notification_settings']['Update'] = {
      news_enabled: settings.newsEnabled,
      news_hours_advance: settings.newsHoursAdvance,
      assignments_enabled: settings.assignmentsEnabled,
      training_cancellation_enabled: settings.trainingCancellationEnabled,
      training_hours_advance: settings.trainingHoursAdvance,
      performances_enabled: settings.performancesEnabled,
      performances_hours_advance: settings.performancesHoursAdvance,
    };
    await supabase.from('notification_settings').update(updateData).eq('id', (await supabase.from('notification_settings').select('id').single()).data?.id ?? '');
    console.log('✅ Notification settings updated');
  }, []);

  const uploadMedia = useCallback(async (input: { 
    name: string; 
    folderPath: string; 
    fileType: string; 
    fileSize: number; 
    mimeType: string; 
    base64Data: string;
    onProgress?: (progress: number) => void;
  }): Promise<MediaLibraryItem> => {
    console.log('💾 [UPLOAD] Uploading media directly to Supabase...');
    console.log('💾 [UPLOAD] Input:', {
      name: input.name,
      folderPath: input.folderPath,
      fileType: input.fileType,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      base64Length: input.base64Data.length,
    });
    
    try {
      if (input.onProgress) {
        input.onProgress(10);
      }
      
      const storagePath = input.folderPath ? `${input.folderPath}/${input.name}` : input.name;
      
      const binaryString = atob(input.base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      if (input.onProgress) {
        input.onProgress(30);
      }
      
      console.log('💾 [UPLOAD] Uploading to storage path:', storagePath);
      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(storagePath, bytes, {
          contentType: input.mimeType,
          upsert: false,
        });
      
      if (uploadError) {
        console.error('❌ [UPLOAD] Storage upload error:', uploadError);
        throw uploadError;
      }
      
      if (input.onProgress) {
        input.onProgress(70);
      }
      
      console.log('💾 [UPLOAD] Storage upload successful, creating database entry...');
      
      const mediaId = genId('m');
      const mediaItem: MediaLibraryItem = {
        id: mediaId,
        name: input.name,
        path: storagePath,
        folder_path: input.folderPath,
        file_type: input.fileType,
        file_size: input.fileSize,
        mime_type: input.mimeType,
        storage_path: storagePath,
        uploaded_by: currentUser?.id ?? null,
        created_at: new Date().toISOString(),
      };
      
      const insertData: Database['public']['Tables']['media_library']['Insert'] = {
        id: mediaItem.id,
        name: mediaItem.name,
        path: mediaItem.path,
        folder_path: mediaItem.folder_path,
        file_type: mediaItem.file_type,
        file_size: mediaItem.file_size,
        mime_type: mediaItem.mime_type,
        storage_path: mediaItem.storage_path,
        uploaded_by: mediaItem.uploaded_by,
      };
      
      const { error: dbError } = await supabase.from('media_library').insert(insertData);
      if (dbError) {
        console.error('❌ [UPLOAD] Database insert error:', dbError);
        await supabase.storage.from('media-library').remove([storagePath]);
        throw dbError;
      }
      
      if (input.onProgress) {
        input.onProgress(90);
      }
      
      setMediaLibrary(prev => [mediaItem, ...prev]);
      await refreshStorageUsage();
      
      if (input.onProgress) {
        input.onProgress(100);
      }
      
      console.log('✅ [UPLOAD] Media uploaded successfully');
      return mediaItem;
    } catch (error: any) {
      console.error('❌ [UPLOAD] Upload error:', error);
      console.error('❌ [UPLOAD] Error details:', JSON.stringify({
        message: error?.message,
        cause: error?.cause,
        name: error?.name,
      }));
      throw new Error(`Upload mislukt: ${error?.message || 'Onbekende fout'}`);
    }
  }, [currentUser, refreshStorageUsage]);

  const deleteMedia = useCallback(async (ids: string[]) => {
    console.log('💾 [DELETE_MEDIA] Starting delete for IDs:', ids);
    console.log('💾 [DELETE_MEDIA] Current mediaLibrary length:', mediaLibrary.length);
    
    try {
      const itemsToDelete = mediaLibrary.filter(m => ids.includes(m.id));
      console.log('💾 [DELETE_MEDIA] Items to delete:', itemsToDelete.length);
      console.log('💾 [DELETE_MEDIA] Items details:', itemsToDelete);
      
      const storagePaths = itemsToDelete.map(m => m.storage_path);
      console.log('💾 [DELETE_MEDIA] Storage paths to delete:', storagePaths);
      
      if (storagePaths.length > 0) {
        console.log('💾 [DELETE_MEDIA] Deleting from storage...');
        const { error: storageError } = await supabase.storage
          .from('media-library')
          .remove(storagePaths);
        
        if (storageError) {
          console.error('💾 [DELETE_MEDIA] Storage delete error:', storageError);
          throw new Error(`Storage verwijderen mislukt: ${storageError.message}`);
        }
        console.log('💾 [DELETE_MEDIA] Storage deletion completed');
      }
      
      console.log('💾 [DELETE_MEDIA] Deleting from database...');
      const { error: dbError } = await supabase
        .from('media_library')
        .delete()
        .in('id', ids);
      
      if (dbError) {
        console.error('💾 [DELETE_MEDIA] Database delete error:', dbError);
        throw new Error(`Database verwijderen mislukt: ${dbError.message}`);
      }
      console.log('💾 [DELETE_MEDIA] Database deletion completed');
      
      setMediaLibrary(prev => {
        const filtered = prev.filter(m => !ids.includes(m.id));
        console.log('💾 [DELETE_MEDIA] Updating local state, new length:', filtered.length);
        return filtered;
      });
      console.log('✅ [DELETE_MEDIA] Media deleted successfully');
    } catch (error) {
      console.error('❌ [DELETE_MEDIA] Delete media error:', error);
      throw error;
    }
  }, [mediaLibrary]);

  const deleteFolder = useCallback(async (folderPath: string) => {
    console.log('💾 Deleting folder from Supabase...', folderPath);
    
    try {
      const itemsInFolder = mediaLibrary.filter(m => 
        m.folder_path === folderPath || m.folder_path.startsWith(folderPath + '/')
      );
      console.log('Items in folder to delete:', itemsInFolder.length);
      
      const storagePaths = itemsInFolder.map(m => m.storage_path);
      const ids = itemsInFolder.map(m => m.id);
      
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('media-library')
          .remove(storagePaths);
        
        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }
      
      if (ids.length > 0) {
        const { error: dbError } = await supabase
          .from('media_library')
          .delete()
          .in('id', ids);
        
        if (dbError) {
          console.error('Database delete error:', dbError);
          throw new Error(`Database verwijderen mislukt: ${dbError.message}`);
        }
      }
      
      const { data: files } = await supabase.storage
        .from('media-library')
        .list(folderPath);
      
      if (files && files.length > 0) {
        const filesToRemove = files.map(file => `${folderPath}/${file.name}`);
        console.log('Additional files to remove:', filesToRemove.length);
        const { error: cleanupError } = await supabase.storage
          .from('media-library')
          .remove(filesToRemove);
        
        if (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      setMediaLibrary(prev => prev.filter(m => 
        m.folder_path !== folderPath && !m.folder_path.startsWith(folderPath + '/')
      ));
      console.log('✅ Folder deleted successfully');
    } catch (error) {
      console.error('❌ Delete folder error:', error);
      throw error;
    }
  }, [mediaLibrary]);

  const renameMedia = useCallback(async (id: string, newName: string) => {
    console.log('💾 Renaming media in Supabase...');
    
    const item = mediaLibrary.find(m => m.id === id);
    if (!item) {
      throw new Error('Media item niet gevonden');
    }
    
    const updateData: Database['public']['Tables']['media_library']['Update'] = {
      name: newName,
    };
    
    const { error: dbError } = await supabase
      .from('media_library')
      .update(updateData)
      .eq('id', id);
    
    if (dbError) {
      throw new Error(`Database fout: ${dbError.message}`);
    }
    
    setMediaLibrary(prev => prev.map(m => 
      m.id === id ? { ...m, name: newName } : m
    ));
    
    console.log('✅ Media renamed');
  }, [mediaLibrary]);

  const renameFolder = useCallback(async (oldPath: string, newPath: string) => {
    console.log('💾 Renaming folder in Supabase...');
    
    const itemsInFolder = mediaLibrary.filter(m => 
      m.folder_path === oldPath || m.folder_path.startsWith(oldPath + '/')
    );
    
    for (const item of itemsInFolder) {
      const newFolderPath = item.folder_path === oldPath
        ? newPath
        : newPath + item.folder_path.substring(oldPath.length);
      
      const pathParts = item.storage_path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const newStoragePath = newFolderPath ? `${newFolderPath}/${fileName}` : fileName;
      const newPath_field = newStoragePath;
      
      const updateData: Database['public']['Tables']['media_library']['Update'] = {
        folder_path: newFolderPath,
        path: newPath_field,
        storage_path: newStoragePath,
      };
      
      const { error: dbError } = await supabase
        .from('media_library')
        .update(updateData)
        .eq('id', item.id);
      
      if (dbError) {
        console.error('Database update error:', dbError);
        throw new Error(`Database fout: ${dbError.message}`);
      }
    }
    
    setMediaLibrary(prev => prev.map(m => {
      if (m.folder_path === oldPath || m.folder_path.startsWith(oldPath + '/')) {
        const newFolderPath = m.folder_path === oldPath
          ? newPath
          : newPath + m.folder_path.substring(oldPath.length);
        
        const pathParts = m.storage_path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const newStoragePath = newFolderPath ? `${newFolderPath}/${fileName}` : fileName;
        
        return {
          ...m,
          folder_path: newFolderPath,
          path: newStoragePath,
          storage_path: newStoragePath,
        };
      }
      return m;
    }));
    
    console.log('✅ Folder renamed');
  }, [mediaLibrary]);

  const getMediaInFolder = useCallback((folderPath: string): MediaLibraryItem[] => {
    return mediaLibrary.filter(m => m.folder_path === folderPath);
  }, [mediaLibrary]);

  const getFolders = useCallback((): string[] => {
    const folderSet = new Set<string>();
    mediaLibrary.forEach(item => {
      if (item.folder_path) {
        folderSet.add(item.folder_path);
        
        const parts = item.folder_path.split('/').filter(Boolean);
        for (let i = 1; i <= parts.length; i++) {
          const parentPath = parts.slice(0, i).join('/');
          if (parentPath) {
            folderSet.add(parentPath);
          }
        }
      }
    });
    return Array.from(folderSet).sort();
  }, [mediaLibrary]);

  const createFolder = useCallback(async (folderPath: string) => {
    console.log('💾 [CREATE_FOLDER] Creating folder directly in Supabase Storage...');
    
    try {
      const placeholderPath = `${folderPath}/.emptyFolderPlaceholder`;
      const placeholderData = new Uint8Array([]);
      
      const { data, error } = await supabase.storage
        .from('media-library')
        .upload(placeholderPath, placeholderData, {
          contentType: 'application/octet-stream',
          upsert: false,
        });
      
      if (error) {
        console.error('❌ [CREATE_FOLDER] Storage error:', error);
        throw error;
      }
      
      console.log('✅ [CREATE_FOLDER] Folder created successfully:', data);
    } catch (error: any) {
      console.error('❌ [CREATE_FOLDER] Folder creation error:', error);
      throw new Error(`Folder aanmaken mislukt: ${error?.message || 'Onbekende fout'}`);
    }
  }, []);

  const addGroup = useCallback(async (name: string, memberIds: string[]) => {
    console.log('💾 Adding group to Supabase...');
    const groupId = genId('g');
    const newGroup: Group = {
      id: groupId,
      name,
      memberIds,
      createdBy: currentUser?.id ?? '',
      createdAt: new Date().toISOString(),
    };
    
    const insertData: Database['public']['Tables']['groups']['Insert'] = {
      id: newGroup.id,
      name: newGroup.name,
      created_by: newGroup.createdBy,
    };
    await supabase.from('groups').insert(insertData);
    
    if (memberIds.length > 0) {
      const membersData: Database['public']['Tables']['group_members']['Insert'][] = memberIds.map(userId => ({
        group_id: groupId,
        user_id: userId,
      }));
      await supabase.from('group_members').insert(membersData);
    }
    
    setGroups((prev) => [...prev, newGroup]);
    console.log('✅ Group added');
  }, [currentUser]);

  const updateGroup = useCallback(async (id: string, name: string, memberIds: string[]) => {
    console.log('💾 Updating group in Supabase...');
    
    const updateData: Database['public']['Tables']['groups']['Update'] = { name };
    await supabase.from('groups').update(updateData).eq('id', id);
    
    await supabase.from('group_members').delete().eq('group_id', id);
    
    if (memberIds.length > 0) {
      const membersData: Database['public']['Tables']['group_members']['Insert'][] = memberIds.map(userId => ({
        group_id: id,
        user_id: userId,
      }));
      await supabase.from('group_members').insert(membersData);
    }
    
    setGroups((prev) => prev.map(g => g.id === id ? { ...g, name, memberIds } : g));
    console.log('✅ Group updated');
  }, []);

  const deleteGroups = useCallback(async (ids: string[]) => {
    console.log('💾 Deleting groups from Supabase...');
    const idSet = new Set(ids);
    setGroups((prev) => prev.filter((g) => !idSet.has(g.id)));
    await supabase.from('groups').delete().in('id', ids);
    console.log('✅ Groups deleted');
  }, []);

  const getMembersByGroupId = useCallback((groupId: string): string[] => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.memberIds : [];
  }, [groups]);

  const setLanguage = useCallback(async (lang: Language) => {
    console.log('💾 Setting language...', lang);
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('app_language', lang);
      console.log('✅ Language saved');
    } catch (error) {
      console.error('❌ Error saving language:', error);
    }
  }, []);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    console.log('💾 Setting biometric...', enabled);
    setBiometricEnabledState(enabled);
    try {
      await AsyncStorage.setItem('biometric_enabled', enabled ? 'true' : 'false');
      console.log('✅ Biometric setting saved');
    } catch (error) {
      console.error('❌ Error saving biometric setting:', error);
    }
  }, []);

  const setCrownAdmin = useCallback(async (userId: string) => {
    console.log('💾 Setting crown admin in Supabase...');
    
    await supabase.from('users').update({ is_crown_admin: false }).neq('id', '');
    
    const updateData: Database['public']['Tables']['users']['Update'] = { 
      is_crown_admin: true,
      role: 'admin'
    };
    await supabase.from('users').update(updateData).eq('id', userId);
    
    setUsers((prev) => prev.map((u) => ({
      ...u,
      isCrownAdmin: u.id === userId,
      role: u.id === userId ? 'admin' as Role : u.role
    })));
    
    if (currentUser) {
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser) {
        setCurrentUser({ ...updatedUser, isCrownAdmin: updatedUser.id === userId });
      }
    }
    console.log('✅ Crown admin set');
  }, [currentUser, users]);

  const value: AppStateValue = {
    users,
    currentUser,
    isInitialized,
    language,
    t: translations[language],
    setLanguage,
    biometricEnabled,
    setBiometricEnabled,
    setCurrentUser,
    login,
    logout,
    addUser,
    deleteUsers,
    softDeleteAccount,
    reactivateAccount,
    permanentDeleteAccount,
    setRole,
    resetPassword,
    changePassword,
    updateUserProfile,
    updateUserNotificationPreferences,
    permissions,
    setPermissions,
    library,
    addFolder,
    deleteFolders,
    assignments,
    addAssignment,
    updateAssignment,
    deleteAssignments,
    completeAssignment,
    events,
    performances,
    addPerformance,
    updatePerformance,
    practiceSchedule,
    updatePracticeSchedule,
    getRecentMedia,
    clearRecentMediaList,
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncements,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointments,
    notificationSettings,
    updateNotificationSettings,
    mediaLibrary,
    uploadMedia,
    deleteMedia,
    deleteFolder,
    renameMedia,
    renameFolder,
    getMediaInFolder,
    getFolders,
    createFolder,
    storageUsage,
    refreshStorageUsage,
    groups,
    addGroup,
    updateGroup,
    deleteGroups,
    getMembersByGroupId,
    setCrownAdmin,
    syncAllData,
  };

  return value;
});
