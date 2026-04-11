import { create } from 'zustand';

// =================== TYPES ===================

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  username?: string;
  imageUrl?: string;
}

interface UserPreferences {
  onboardingCompleted: boolean;
  githubUsername?: string;
  preferredLanguages?: string[];
  goals?: string[];
  weeklyCommitTarget?: number;
  theme?: 'dark' | 'light';
  notificationsEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  preferences: UserPreferences | null;
  isOnboarded: boolean;
  setUser: (user: User | null) => void;
  setPreferences: (prefs: UserPreferences | null) => void;
  setOnboarded: (v: boolean) => void;
  reset: () => void;
}

// =================== AUTH STORE ===================

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  preferences: null,
  isOnboarded: false,
  setUser: (user) => set({ user }),
  setPreferences: (preferences) => set({ preferences, isOnboarded: preferences?.onboardingCompleted ?? false }),
  setOnboarded: (v) => set({ isOnboarded: v }),
  reset: () => set({ user: null, preferences: null, isOnboarded: false }),
}));

// =================== PROJECTS STORE ===================

export interface Project {
  id: string;
  name: string;
  description?: string;
  language?: string;
  status: 'active' | 'paused' | 'completed' | 'planned';
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
  commits?: number;
  lastActivity?: string;
  createdAt?: string;
  isPublic?: boolean;
}

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  refreshing: boolean;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setLoading: (v: boolean) => void;
  setRefreshing: (v: boolean) => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  loading: false,
  refreshing: false,
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updated) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    })),
  removeProject: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
}));

// =================== DASHBOARD / STATS STORE ===================

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalCommits: number;
  githubRepos: number;
  githubFollowers: number;
  githubStars: number;
  currentStreak?: number;
  leetcodeSolved?: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  setStats: (stats: DashboardStats | null) => void;
  setLoading: (v: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  loading: false,
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
}));

// =================== GITHUB STORE ===================

export interface GitHubInsight {
  totalCommits: number;
  topLanguages: { name: string; percentage: number; color: string }[];
  recentActivity: { date: string; count: number }[];
  topRepos: { name: string; stars: number; language: string; description?: string }[];
  profileStats: {
    public_repos: number;
    followers: number;
    following: number;
    total_stars: number;
  };
}

interface GitHubState {
  insights: GitHubInsight | null;
  loading: boolean;
  setInsights: (insights: GitHubInsight | null) => void;
  setLoading: (v: boolean) => void;
}

export const useGitHubStore = create<GitHubState>((set) => ({
  insights: null,
  loading: false,
  setInsights: (insights) => set({ insights }),
  setLoading: (loading) => set({ loading }),
}));

// =================== UI / GLOBAL ===================

interface UIState {
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info' | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toastMessage: null,
  toastType: null,
  showToast: (msg, type = 'info') => {
    set({ toastMessage: msg, toastType: type });
    setTimeout(() => set({ toastMessage: null, toastType: null }), 3500);
  },
  hideToast: () => set({ toastMessage: null, toastType: null }),
}));
