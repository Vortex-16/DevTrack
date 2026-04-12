import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  Folder,
  GitCommit,
  Users,
  Zap,
  Star,
  Code2,
  TrendingUp,
  Bell,
  LogOut,
  ChevronRight,
  Activity,
  BookOpen,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { projectsApi, githubApi, preferencesApi } from '../../../src/services/api';
import { useDashboardStore, useProjectsStore, useAuthStore } from '../../../src/store';
import { StatCard, SectionHeader, Button, Badge, FullScreenLoader, Toast } from '../../../src/components/ui';
import { colors, spacing, radius, fontSize, fontWeight, globalStyles } from '../../../src/theme';

// ──────────────────────────────────────────
// Activity Bar (mini commit graph)
// ──────────────────────────────────────────
const ActivityBar = ({ count, max }: { count: number; max: number }) => {
  const h = max > 0 ? Math.max(4, (count / max) * 40) : 4;
  const color = count === 0 ? colors.bg.elevated : count < 3 ? '#3b82f620' : count < 6 ? colors.accent.primary + '80' : colors.accent.primary;
  return (
    <View style={{ width: 8, height: 40, justifyContent: 'flex-end', marginHorizontal: 1 }}>
      <View style={{ height: h, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
};

// ──────────────────────────────────────────
// Quick Action Card
// ──────────────────────────────────────────
interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}
const QuickAction = ({ icon, label, description, color, onPress }: QuickActionProps) => (
  <TouchableOpacity style={[s.quickAction, { borderLeftColor: color, borderLeftWidth: 2 }]} onPress={onPress} activeOpacity={0.7}>
    <View style={[s.qaIcon, { backgroundColor: color + '20' }]}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={s.qaLabel}>{label}</Text>
      <Text style={s.qaDesc}>{description}</Text>
    </View>
    <ChevronRight size={16} color={colors.text.muted} />
  </TouchableOpacity>
);

// ──────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────
export default function DashboardScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { stats, setStats, loading, setLoading } = useDashboardStore();
  const { projects, setProjects } = useProjectsStore();
  const { preferences } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activityData, setActivityData] = useState<{ date: string; count: number }[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [projectsStatsRes, githubRes, projectsListRes] = await Promise.allSettled([
        projectsApi.getStats(),
        githubApi.getInsights(),
        projectsApi.getAll({}),
      ]);

      const pStats = projectsStatsRes.status === 'fulfilled' ? projectsStatsRes.value?.data?.data : null;
      const gh = githubRes.status === 'fulfilled' ? githubRes.value?.data?.data : null;
      const pListRaw = projectsListRes.status === 'fulfilled' ? projectsListRes.value?.data?.data : null;
      const pList = pListRaw?.projects ?? (Array.isArray(pListRaw) ? pListRaw : []);

      setStats({
        totalProjects: pStats?.totalProjects ?? 0,
        activeProjects: pStats?.activeProjects ?? 0,
        totalCommits: pStats?.totalCommits ?? 0,
        githubRepos: gh?.stats?.publicRepos ?? gh?.stats?.totalRepos ?? gh?.public_repos ?? 0,
        githubFollowers: gh?.profile?.followers ?? gh?.followers ?? 0,
        githubStars: gh?.stats?.totalStars ?? gh?.total_stars ?? 0,
      });

      if (Array.isArray(pList)) {
        setProjects(pList);
      }

      // Activity data from github insights
      if (gh?.activityData || gh?.recentActivity) {
        setActivityData((gh.activityData || gh.recentActivity).slice(-30));
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      showToast('Failed to load some data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !stats) return <FullScreenLoader message="Syncing your workspace..." />;

  const maxActivity = Math.max(...activityData.map((d) => d.count), 1);
  const recentProjects = Array.isArray(projects) 
    ? [...projects].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      }).slice(0, 3) 
    : [];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statusColors: Record<string, string> = {
    active: colors.green.default,
    completed: colors.blue.default,
    paused: colors.yellow.default,
    planned: colors.text.muted,
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{getGreeting()},</Text>
            <Text style={s.username}>{user?.firstName ?? 'Developer'} 👋</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={async () => {
                await signOut();
              }}
            >
              <LogOut size={18} color={colors.red.default} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Accent Banner ── */}
        <View style={s.banner}>
          <View style={s.bannerGlow} />
          <Code2 size={20} color={colors.accent.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Developer Dashboard</Text>
            <Text style={s.bannerSub}>Your coding journey at a glance</Text>
          </View>
          <TrendingUp size={20} color={colors.green.default} />
        </View>

        <View style={s.body}>
          {/* ── Stats Grid ── */}
          <View style={s.statsGrid}>
            <StatCard icon={<Folder size={20} color={colors.blue.default} />} label="Total Projects" value={stats?.totalProjects ?? 0} color={colors.blue.default} />
            <StatCard icon={<Zap size={20} color={colors.green.default} />} label="Active Projects" value={stats?.activeProjects ?? 0} color={colors.green.default} />
            <StatCard icon={<GitCommit size={20} color={colors.purple.default} />} label="Total Commits" value={stats?.totalCommits ?? 0} color={colors.purple.default} />
            <StatCard icon={<Users size={20} color={colors.cyan.default} />} label="GitHub Followers" value={stats?.githubFollowers ?? 0} color={colors.cyan.default} />
            <StatCard icon={<Star size={20} color={colors.yellow.default} />} label="GitHub Stars" value={stats?.githubStars ?? 0} color={colors.yellow.default} />
            <StatCard icon={<Code2 size={20} color={colors.orange.default} />} label="Public Repos" value={stats?.githubRepos ?? 0} color={colors.orange.default} />
          </View>

          {/* ── Activity Graph ── */}
          {activityData.length > 0 && (
            <>
              <SectionHeader title="Activity" action={{ label: 'GitHub Insights →', onPress: () => router.push('/(auth)/github-insights' as any) }} />
              <View style={s.activityCard}>
                <Text style={s.activityLabel}>Last 30 days</Text>
                <View style={s.activityBars}>
                  {activityData.map((d, i) => (
                    <ActivityBar key={i} count={d.count} max={maxActivity} />
                  ))}
                </View>
              </View>
            </>
          )}

          {/* ── Recent Projects ── */}
          <SectionHeader title="Recent Projects" action={{ label: 'View all', onPress: () => router.push('/(auth)/projects') }} />
          {recentProjects.length === 0 ? (
            <View style={s.emptyProjects}>
              <Folder size={32} color={colors.text.muted} />
              <Text style={s.emptyText}>No projects yet. Add your first project!</Text>
              <Button label="Add Project" onPress={() => router.push('/(auth)/projects')} size="sm" style={{ marginTop: spacing.md }} />
            </View>
          ) : (
            recentProjects.map((p) => (
              <TouchableOpacity key={p.id} style={s.projectCard} activeOpacity={0.7} onPress={() => router.push('/(auth)/projects')}>
                <View style={s.projectRow}>
                  <View style={[s.projectDot, { backgroundColor: statusColors[p.status] ?? colors.text.muted }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.projectName}>{p.name}</Text>
                    {p.description && (
                      <Text style={s.projectDesc} numberOfLines={1}>{p.description}</Text>
                    )}
                    <View style={s.projectTags}>
                      {p.language && <Badge label={p.language} color={colors.accent.primary} style={{ marginRight: 6 }} />}
                      <Badge label={p.status} color={statusColors[p.status] ?? colors.text.muted} />
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.text.muted} />
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* ── Quick Actions ── */}
          <SectionHeader title="Quick Actions" />
          <QuickAction
            icon={<Folder size={18} color={colors.blue.default} />}
            label="Manage Projects"
            description="View and track your projects"
            color={colors.blue.default}
            onPress={() => router.push('/(auth)/projects')}
          />
          <QuickAction
            icon={<BookOpen size={18} color={colors.green.default} />}
            label="Learning Path"
            description="Track your skills & roadmap"
            color={colors.green.default}
            onPress={() => router.push('/(auth)/learning')}
          />
          <QuickAction
            icon={<Activity size={18} color={colors.purple.default} />}
            label="GitHub Insights"
            description="Analyze your GitHub activity"
            color={colors.purple.default}
            onPress={() => router.push('/(auth)/github-insights' as any)}
          />

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  username: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent.primary + '40',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 100,
    height: 100,
    backgroundColor: colors.accent.glow,
    borderRadius: 50,
  },
  bannerTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  bannerSub: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  activityCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    marginBottom: spacing.md,
  },
  activityLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 44,
    flexWrap: 'nowrap',
  },
  projectCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    marginBottom: spacing.sm,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  projectName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  projectDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  projectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  emptyProjects: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bg.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    marginBottom: spacing.sm,
  },
  qaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  qaLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  qaDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
});
