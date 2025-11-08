import { useCallback, useState, useEffect } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type Role = "admin" | "member";

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  passwordChangedByUser: boolean;
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

export interface Assignment {
  id: string;
  title: string;
  description: string;
  assignedUserIds: string[];
  dueDate?: string;
  mediaUri?: string;
  mediaType?: 'video' | 'image' | 'audio';
  createdAt: string;
  submissions: { userId: string; videoUri: string; createdAt: string }[];
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
}

export interface PracticeDay {
  dayOfWeek: number;
  time: string;
}

export interface CancelledPractice {
  date: string;
  reason?: string;
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
}

export interface NotificationSettings {
  newsEnabled: boolean;
  newsHoursAdvance: number;
  assignmentsEnabled: boolean;
  trainingCancellationEnabled: boolean;
  trainingHoursAdvance: number;
  performancesEnabled: boolean;
  performancesHoursAdvance: number;
}

export interface AppStateValue {
  users: User[];
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (username: string, role: Role) => Promise<{ user: User; password: string }>;
  setRole: (userId: string, role: Role) => void;
  resetPassword: (userId: string) => Promise<string>;
  changePassword: (userId: string, newPassword: string) => void;
  permissions: Record<Role, PermissionMatrix>;
  setPermissions: (role: Role, perms: PermissionMatrix) => void;
  library: CategoryNode[];
  addFolder: (name: string, path: string[]) => void;
  deleteFolders: (folderIds: string[], path: string[]) => void;
  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt' | 'submissions'>) => void;
  updateAssignment: (id: string, assignment: Partial<Omit<Assignment, 'id' | 'createdAt' | 'submissions'>>) => void;
  deleteAssignments: (ids: string[]) => void;
  events: CalendarEvent[];
  performances: Performance[];
  addPerformance: (perf: Omit<Performance, 'id'>) => void;
  updatePerformance: (id: string, perf: Partial<Performance>) => void;
  practiceSchedule: PracticeSchedule;
  updatePracticeSchedule: (schedule: PracticeSchedule) => void;
  getRecentMedia: () => MediaItem[];
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  updateAnnouncement: (id: string, announcement: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => void;
  deleteAnnouncements: (ids: string[]) => void;
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateAppointment: (id: string, appointment: Partial<Omit<Appointment, 'id' | 'createdAt' | 'createdBy'>>) => void;
  deleteAppointments: (ids: string[]) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: NotificationSettings) => void;
}

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function genPassword(): string {
  const base = Math.random().toString(36).slice(2, 8);
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `${base}${suffix}`;
}

export const [AppStateProvider, useAppState] = createContextHook<AppStateValue>(() => {
  const [isInitialized, setIsInitialized] = useState(false);
  const mockMedia: MediaItem[] = [
    {
      id: "m1",
      type: "video",
      title: "Groove A - Intro",
      uri: "https://cdn.coverr.co/videos/coverr-drums-1450/1080p.mp4",
      notes: "Focus op rechterhand accent.",
      comments: [],
    },
    {
      id: "m2",
      type: "image",
      title: "Stick Grip",
      uri: "https://images.unsplash.com/photo-1518131678677-a90f9f3a5e83?q=80&w=1600&auto=format&fit=crop",
      comments: [],
    },
  ];

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
    newsHoursAdvance: 24,
    assignmentsEnabled: true,
    trainingCancellationEnabled: true,
    trainingHoursAdvance: 2,
    performancesEnabled: true,
    performancesHoursAdvance: 48,
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [usersRes, libraryRes, assignmentsRes, trainingsRes, scheduleRes, announcementsRes, appointmentsRes, settingsRes] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('library').select('*'),
          supabase.from('assignments').select('*'),
          supabase.from('trainings').select('*'),
          supabase.from('practice_schedule').select('*').single(),
          supabase.from('announcements').select('*'),
          supabase.from('appointments').select('*'),
          supabase.from('notification_settings').select('*').single(),
        ]);

        if (usersRes.data) {
          const mappedUsers = usersRes.data.map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            role: u.role as Role,
            passwordChangedByUser: u.password_changed_by_user,
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
            setUsers([{ id: "u_admin", username: "admin", password: "admin", role: "admin", passwordChangedByUser: true }]);
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
            { id: "t1", name: "Groep 1", day_of_week: 2, time: "18:30", location: "De Zaalon" },
            { id: "t2", name: "Groep 2", day_of_week: 2, time: "19:30", location: "De Zaalon" },
          ];
          await supabase.from('trainings').insert(defaultTrainings);
          
          setPracticeSchedule({
            regularDays: (defaultSchedule.regular_days as any) ?? [],
            location: defaultSchedule.location,
            cancelledDates: (defaultSchedule.cancelled_dates as any) ?? [],
            isActive: defaultSchedule.is_active,
            trainings: defaultTrainings.map(t => ({
              id: t.id ?? '',
              name: t.name,
              dayOfWeek: t.day_of_week,
              time: t.time,
              location: t.location,
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
            }]);
          }
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

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing data:', error);
        setIsInitialized(true);
      }
    };

    initializeData();
  }, []);

  const buildCategoryTree = (allNodes: any[]) => (node: any): CategoryNode => {
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

  const setRole = useCallback(async (userId: string, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    const updateData: Database['public']['Tables']['users']['Update'] = { role };
    await supabase.from('users').update(updateData).eq('id', userId);
  }, []);

  const login = useCallback((username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const addUser = useCallback(async (username: string, role: Role): Promise<{ user: User; password: string }> => {
    const password = genPassword();
    const user: User = { id: genId("u"), username, password, role, passwordChangedByUser: false };
    const insertData: Database['public']['Tables']['users']['Insert'] = {
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role,
      password_changed_by_user: user.passwordChangedByUser,
    };
    await supabase.from('users').insert(insertData);
    setUsers((prev) => [...prev, user]);
    return { user, password };
  }, []);

  const resetPassword = useCallback(async (userId: string): Promise<string> => {
    const newPassword = genPassword();
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, password: newPassword, passwordChangedByUser: false } : u
    ));
    const updateData: Database['public']['Tables']['users']['Update'] = { password: newPassword, password_changed_by_user: false };
    await supabase.from('users').update(updateData).eq('id', userId);
    return newPassword;
  }, []);

  const changePassword = useCallback(async (userId: string, newPassword: string) => {
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, password: newPassword, passwordChangedByUser: true } : u
    ));
    const updateData: Database['public']['Tables']['users']['Update'] = { password: newPassword, password_changed_by_user: true };
    await supabase.from('users').update(updateData).eq('id', userId);
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
    setPracticeSchedule(schedule);
    const scheduleUpdateData: Database['public']['Tables']['practice_schedule']['Update'] = {
      regular_days: schedule.regularDays as any,
      location: schedule.location,
      cancelled_dates: schedule.cancelledDates as any,
      is_active: schedule.isActive,
    };
    await supabase.from('practice_schedule').update(scheduleUpdateData).eq('id', (await supabase.from('practice_schedule').select('id').single()).data?.id ?? '');
    
    await supabase.from('trainings').delete().neq('id', '');
    if (schedule.trainings.length > 0) {
      const trainingsInsert: Database['public']['Tables']['trainings']['Insert'][] = schedule.trainings.map(t => ({
        id: t.id,
        name: t.name,
        day_of_week: t.dayOfWeek,
        time: t.time,
        location: t.location,
      }));
      await supabase.from('trainings').insert(trainingsInsert);
    }
  }, []);

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
    return allMedia.slice(0, 5);
  }, [library]);

  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id' | 'createdAt' | 'submissions'>) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: genId("a"),
      createdAt: new Date().toISOString(),
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
      submissions: newAssignment.submissions as any,
    };
    await supabase.from('assignments').insert(insertData);
    setAssignments((prev) => [newAssignment, ...prev]);
  }, []);

  const updateAssignment = useCallback(async (id: string, assignment: Partial<Omit<Assignment, 'id' | 'createdAt' | 'submissions'>>) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, ...assignment } : a)));
    const updateData: Database['public']['Tables']['assignments']['Update'] = {};
    if (assignment.title !== undefined) updateData.title = assignment.title;
    if (assignment.description !== undefined) updateData.description = assignment.description;
    if (assignment.assignedUserIds !== undefined) updateData.assigned_user_ids = assignment.assignedUserIds;
    if (assignment.dueDate !== undefined) updateData.due_date = assignment.dueDate;
    if (assignment.mediaUri !== undefined) updateData.media_uri = assignment.mediaUri;
    if (assignment.mediaType !== undefined) updateData.media_type = assignment.mediaType;
    await supabase.from('assignments').update(updateData).eq('id', id);
  }, []);

  const deleteAssignments = useCallback(async (ids: string[]) => {
    const idSet = new Set(ids);
    setAssignments((prev) => prev.filter((a) => !idSet.has(a.id)));
    await supabase.from('assignments').delete().in('id', ids);
  }, []);

  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
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
  }, []);

  const updateAnnouncement = useCallback(async (id: string, announcement: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => {
    setAnnouncements((prev) => 
      prev.map((a) => (a.id === id ? { ...a, ...announcement } : a))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    const updateData: Database['public']['Tables']['announcements']['Update'] = announcement;
    await supabase.from('announcements').update(updateData).eq('id', id);
  }, []);

  const deleteAnnouncements = useCallback(async (ids: string[]) => {
    const idSet = new Set(ids);
    setAnnouncements((prev) => prev.filter((a) => !idSet.has(a.id)));
    await supabase.from('announcements').delete().in('id', ids);
  }, []);

  const addAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'createdBy'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: genId("ap"),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id ?? '',
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
    };
    await supabase.from('appointments').insert(insertData);
    setAppointments((prev) => [...prev, newAppointment].sort((a, b) => 
      new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
    ));
  }, [currentUser]);

  const updateAppointment = useCallback(async (id: string, appointment: Partial<Omit<Appointment, 'id' | 'createdAt'>>) => {
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
    await supabase.from('appointments').update(updateData).eq('id', id);
  }, []);

  const deleteAppointments = useCallback(async (ids: string[]) => {
    const idSet = new Set(ids);
    setAppointments((prev) => prev.filter((a) => !idSet.has(a.id)));
    await supabase.from('appointments').delete().in('id', ids);
  }, []);

  const updateNotificationSettings = useCallback(async (settings: NotificationSettings) => {
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
  }, []);

  const value: AppStateValue = {
    users,
    currentUser,
    setCurrentUser,
    login,
    logout,
    addUser,
    setRole,
    resetPassword,
    changePassword,
    permissions,
    setPermissions,
    library,
    addFolder,
    deleteFolders,
    assignments,
    addAssignment,
    updateAssignment,
    deleteAssignments,
    events,
    performances,
    addPerformance,
    updatePerformance,
    practiceSchedule,
    updatePracticeSchedule,
    getRecentMedia,
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
  };

  return value;
});
