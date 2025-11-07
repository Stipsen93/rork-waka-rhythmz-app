import { useCallback, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

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
  addUser: (username: string, role: Role) => { user: User; password: string };
  setRole: (userId: string, role: Role) => void;
  resetPassword: (userId: string) => string;
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

  const [users, setUsers] = useState<User[]>([
    { id: "u_admin", username: "admin", password: "admin", role: "admin", passwordChangedByUser: true },
  ]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissionsState] = useState<Record<Role, PermissionMatrix>>({
    admin: { canAddMedia: true, canComment: true, canCreateEvents: true },
    member: { canAddMedia: false, canComment: true, canCreateEvents: false },
  });

  const [library, setLibrary] = useState<CategoryNode[]>([
    {
      id: "c1",
      name: "Beats",
      children: [
        {
          id: "c1-1",
          name: "Afro",
          media: mockMedia,
          description: "Afro grooves",
        },
        {
          id: "c1-2",
          name: "Dancehall",
          media: [],
        },
      ],
    },
    {
      id: "c2",
      name: "Rudiments",
      media: mockMedia.slice(0, 1),
    },
  ]);

  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: "a1",
      title: "Groove A Homework",
      description: "Kijk de video en upload je eigen take (30s).",
      assignedUserIds: [],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      submissions: [],
    },
  ]);

  const [events] = useState<CalendarEvent[]>([
    {
      id: "e1",
      title: "Repetitie",
      description: "Zaal 3, 19:00",
      startsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
  ]);

  const [performances, setPerformances] = useState<Performance[]>([
    {
      id: "p1",
      date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      time: "20:00",
      location: "Poppodium Zuid",
      signedUpCount: 8,
    },
  ]);

  const [practiceSchedule, setPracticeSchedule] = useState<PracticeSchedule>({
    regularDays: [
      { dayOfWeek: 2, time: "18:30" },
      { dayOfWeek: 2, time: "19:30" },
    ],
    location: "De Zaalon",
    cancelledDates: [],
    isActive: true,
    trainings: [
      {
        id: "t1",
        name: "Groep 1",
        dayOfWeek: 2,
        time: "18:30",
        location: "De Zaalon",
      },
      {
        id: "t2",
        name: "Groep 2",
        dayOfWeek: 2,
        time: "19:30",
        location: "De Zaalon",
      },
    ],
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "ap_example",
      name: "Optreden FC Eindhoven",
      category: "Feestje",
      date: "2025-12-20",
      time: "21:30",
      location: "FC Eindhoven",
      memberIds: [],
      createdAt: new Date().toISOString(),
      createdBy: "u_admin",
    },
  ]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newsEnabled: true,
    newsHoursAdvance: 24,
    assignmentsEnabled: true,
    trainingCancellationEnabled: true,
    trainingHoursAdvance: 2,
    performancesEnabled: true,
    performancesHoursAdvance: 48,
  });

  const setRole = useCallback((userId: string, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
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

  const addUser = useCallback((username: string, role: Role) => {
    const password = genPassword();
    const user: User = { id: genId("u"), username, password, role, passwordChangedByUser: false };
    setUsers((prev) => [...prev, user]);
    return { user, password };
  }, []);

  const resetPassword = useCallback((userId: string) => {
    const newPassword = genPassword();
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, password: newPassword, passwordChangedByUser: false } : u
    ));
    return newPassword;
  }, []);

  const changePassword = useCallback((userId: string, newPassword: string) => {
    setUsers((prev) => prev.map((u) => 
      u.id === userId ? { ...u, password: newPassword, passwordChangedByUser: true } : u
    ));
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

  const updatePracticeSchedule = useCallback((schedule: PracticeSchedule) => {
    setPracticeSchedule(schedule);
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

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id' | 'createdAt' | 'submissions'>) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: genId("a"),
      createdAt: new Date().toISOString(),
      submissions: [],
    };
    setAssignments((prev) => [newAssignment, ...prev]);
  }, []);

  const updateAssignment = useCallback((id: string, assignment: Partial<Omit<Assignment, 'id' | 'createdAt' | 'submissions'>>) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, ...assignment } : a)));
  }, []);

  const deleteAssignments = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setAssignments((prev) => prev.filter((a) => !idSet.has(a.id)));
  }, []);

  const addAnnouncement = useCallback((announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: genId("an"),
      createdAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [...prev, newAnnouncement].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
  }, []);

  const updateAnnouncement = useCallback((id: string, announcement: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => {
    setAnnouncements((prev) => 
      prev.map((a) => (a.id === id ? { ...a, ...announcement } : a))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  }, []);

  const deleteAnnouncements = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setAnnouncements((prev) => prev.filter((a) => !idSet.has(a.id)));
  }, []);

  const addAppointment = useCallback((appointment: Omit<Appointment, 'id' | 'createdAt' | 'createdBy'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: genId("ap"),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id ?? '',
    };
    setAppointments((prev) => [...prev, newAppointment].sort((a, b) => 
      new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
    ));
  }, [currentUser]);

  const updateAppointment = useCallback((id: string, appointment: Partial<Omit<Appointment, 'id' | 'createdAt'>>) => {
    setAppointments((prev) => 
      prev.map((a) => (a.id === id ? { ...a, ...appointment } : a))
        .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
    );
  }, []);

  const deleteAppointments = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setAppointments((prev) => prev.filter((a) => !idSet.has(a.id)));
  }, []);

  const updateNotificationSettings = useCallback((settings: NotificationSettings) => {
    setNotificationSettings(settings);
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
