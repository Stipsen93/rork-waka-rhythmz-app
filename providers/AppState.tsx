import { useCallback, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

export type Role = "admin" | "member";

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
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
  mediaToWatchId?: string;
  dueDate?: string;
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

export interface PracticeDay {
  dayOfWeek: number;
  time: string;
}

export interface PracticeSchedule {
  regularDays: PracticeDay[];
  cancelledDates: string[];
  isActive: boolean;
}

export interface AppStateValue {
  users: User[];
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  addUser: (username: string, role: Role) => { user: User; password: string };
  setRole: (userId: string, role: Role) => void;
  permissions: Record<Role, PermissionMatrix>;
  setPermissions: (role: Role, perms: PermissionMatrix) => void;
  library: CategoryNode[];
  addFolder: (name: string, path: string[]) => void;
  deleteFolders: (folderIds: string[], path: string[]) => void;
  assignments: Assignment[];
  events: CalendarEvent[];
  performances: Performance[];
  addPerformance: (perf: Omit<Performance, 'id'>) => void;
  updatePerformance: (id: string, perf: Partial<Performance>) => void;
  practiceSchedule: PracticeSchedule;
  updatePracticeSchedule: (schedule: PracticeSchedule) => void;
  getRecentMedia: () => MediaItem[];
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
    { id: "u_admin", username: "admin", password: "admin123", role: "admin" },
  ]);
  const [currentUser, setCurrentUser] = useState<User | null>(users[0]);
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

  const [assignments] = useState<Assignment[]>([
    {
      id: "a1",
      title: "Groove A Homework",
      description: "Kijk de video en upload je eigen take (30s).",
      mediaToWatchId: "m1",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
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
      { dayOfWeek: 2, time: "19:00" },
      { dayOfWeek: 4, time: "19:00" },
    ],
    cancelledDates: [],
    isActive: true,
  });

  const setRole = useCallback((userId: string, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }, []);

  const addUser = useCallback((username: string, role: Role) => {
    const password = genPassword();
    const user: User = { id: genId("u"), username, password, role };
    setUsers((prev) => [...prev, user]);
    return { user, password };
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

      const addToNode = (nodes: CategoryNode[]): CategoryNode[] => {
        return nodes.map((node) => {
          if (node.id === path[0]) {
            if (path.length === 1) {
              return {
                ...node,
                children: [...(node.children ?? []), newFolder],
              };
            } else {
              return {
                ...node,
                children: addToNode(node.children ?? []),
              };
            }
          }
          return node;
        });
      };

      return addToNode(prev);
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

  const value: AppStateValue = {
    users,
    currentUser,
    setCurrentUser,
    addUser,
    setRole,
    permissions,
    setPermissions,
    library,
    addFolder,
    deleteFolders,
    assignments,
    events,
    performances,
    addPerformance,
    updatePerformance,
    practiceSchedule,
    updatePracticeSchedule,
    getRecentMedia,
  };

  return value;
});
