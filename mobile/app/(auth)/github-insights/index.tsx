import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { githubApi } from '../../../src/services/api';
import { useGitHubStore } from '../../../src/store';
import { FullScreenLoader, SectionHeader, ScreenHeader, Badge, Toast } from '../../../src/components/ui';
import {
  GitBranch, GitCommit, Star, Users, Package, TrendingUp, Activity, ExternalLink,
} from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, globalStyles } from '../../../src/theme';

const { width } = Dimensions.get('window');

// ─── Language Bar ────────────────────────────────────────────────
interface LangBarProps {
  name: string;
  percentage: number;
  color: string;
}
function LanguageBar({ name, percentage, color }: LangBarProps) {
  return (
    <View style={s.langRow}>
      <View style={[s.langDot, { backgroundColor: color }]} />
      <Text style={s.langName}>{name}</Text>
      <View style={s.langBg}>
        <View style={[s.langFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.langPct}>{percentage.toFixed(1)}%</Text>
    </View>
  );
}

// ─── Commit Graph ────────────────────────────────────────────────
function CommitGraph({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const slots = data.slice(-28);
  const cellSize = Math.floor((width - spacing.lg * 2 - spacing.md * 2) / 28);
  return (
    <View style={s.graphContainer}>
      <View style={s.graphRow}>
        {slots.map((d, i) => {
          const intensity = d.count / max;
          const bg = d.count === 0
            ? colors.bg.elevated
            : intensity < 0.3
            ? colors.accent.primary + '40'
            : intensity < 0.7
            ? colors.accent.primary + '90'
            : colors.accent.primary;
          return (
            <View
              key={i}
              style={{
                width: cellSize - 2,
                height: cellSize - 2,
                backgroundColor: bg,
                borderRadius: 2,
                margin: 1,
              }}
            />
          );
        })}
      </View>
      <View style={s.graphLegend}>
        <Text style={s.graphLegendText}>Less</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <View
            key={v}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: v === 0 ? colors.bg.elevated : colors.accent.primary + Math.round(v * 255).toString(16).padStart(2, '0'),
              marginHorizontal: 1,
            }}
          />
        ))}
        <Text style={s.graphLegendText}>More</Text>
      </View>
    </View>
  );
}

// ─── Repo Card ───────────────────────────────────────────────────
function RepoCard({ repo }: { repo: { name: string; stars: number; language: string; description?: string } }) {
  return (
    <View style={s.repoCard}>
      <View style={s.repoHeader}>
        <Package size={16} color={colors.accent.primary} style={{ marginRight: spacing.sm }} />
        <Text style={s.repoName}>{repo.name}</Text>
        <View style={s.repoStars}>
          <Star size={12} color={colors.yellow.default} />
          <Text style={s.repoStarCount}>{repo.stars}</Text>
        </View>
      </View>
      {repo.description && (
        <Text style={s.repoDesc} numberOfLines={2}>{repo.description}</Text>
      )}
      {repo.language && (
        <Badge label={repo.language} color={colors.accent.primary} style={{ marginTop: spacing.sm }} />
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function GitHubInsightsScreen() {
  const { insights, setInsights, loading, setLoading } = useGitHubStore();
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [profileFull, setProfileFull] = useState<any>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [insightsRes, profileRes] = await Promise.allSettled([
        githubApi.getInsights(),
        githubApi.getProfile(),
      ]);

      if (insightsRes.status === 'fulfilled') {
        const d = insightsRes.value?.data?.data;
        setInsights({
          totalCommits: d?.stats?.totalCommits ?? d?.totalCommits ?? 0,
          topLanguages: d?.languages ?? d?.topLanguages ?? [],
          recentActivity: d?.recentActivity ?? d?.activityData ?? [],
          topRepos: d?.stats?.topRepos ?? d?.topRepos ?? d?.repos ?? [],
          profileStats: {
            public_repos: d?.stats?.publicRepos ?? d?.stats?.totalRepos ?? d?.public_repos ?? 0,
            followers: d?.profile?.followers ?? d?.followers ?? 0,
            following: d?.profile?.following ?? d?.following ?? 0,
            total_stars: d?.stats?.totalStars ?? d?.total_stars ?? 0,
          },
        });
      }

      if (profileRes.status === 'fulfilled') {
        setProfileFull(profileRes.value?.data?.data);
      }
    } catch (err) {
      showToast('Failed to load GitHub data', 'error');
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

  if (loading && !insights) return <FullScreenLoader />;

  const profile = insights?.profileStats;
  const langs = Array.isArray(insights?.topLanguages) ? insights!.topLanguages : [];
  const activity = Array.isArray(insights?.recentActivity) ? insights!.recentActivity : [];
  const repos = Array.isArray(insights?.topRepos) ? insights!.topRepos : [];

  return (
    <SafeAreaView style={globalStyles.screen}>
      <ScreenHeader title="GitHub Insights" subtitle="Your activity at a glance" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.primary} />
        }
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
      >
        {/* ── Stats Row ── */}
        <View style={s.statsRow}>
          {[
            { icon: Package, label: 'Repos', value: profile?.public_repos ?? 0, color: colors.blue.default },
            { icon: Users, label: 'Followers', value: profile?.followers ?? 0, color: colors.green.default },
            { icon: TrendingUp, label: 'Following', value: profile?.following ?? 0, color: colors.purple.default },
            { icon: Star, label: 'Stars', value: profile?.total_stars ?? 0, color: colors.yellow.default },
          ].map((s) => (
            <View key={s.label} style={s2.statChip}>
              <View style={[s2.statChipIcon, { backgroundColor: s.color + '20' }]}>
                <s.icon size={16} color={s.color} />
              </View>
              <Text style={s2.statChipValue}>{s.value}</Text>
              <Text style={s2.statChipLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Commit Graph ── */}
        {activity.length > 0 && (
          <>
            <SectionHeader title="Commit Activity" />
            <View style={s.card}>
              <View style={s.cardHeaderRow}>
                <Activity size={16} color={colors.accent.primary} />
                <Text style={s.cardHeaderText}>Last 28 days</Text>
                <Text style={s.totalCommits}>{insights?.totalCommits ?? 0} total</Text>
              </View>
              <CommitGraph data={activity} />
            </View>
          </>
        )}

        {/* ── Languages ── */}
        {langs.length > 0 && (
          <>
            <SectionHeader title="Top Languages" />
            <View style={s.card}>
              {langs.slice(0, 8).map((l) => (
                <LanguageBar key={l.name} name={l.name} percentage={l.percentage} color={l.color ?? colors.accent.primary} />
              ))}
            </View>
          </>
        )}

        {/* ── Top Repos ── */}
        {repos.length > 0 && (
          <>
            <SectionHeader title="Top Repositories" />
            {repos.slice(0, 5).map((r, i) => (
              <RepoCard key={r.name + i} repo={r} />
            ))}
          </>
        )}

        {!insights && (
          <View style={s.notConnected}>
            <GitBranch size={40} color={colors.text.muted} />
            <Text style={s.notConnectedTitle}>GitHub Not Connected</Text>
            <Text style={s.notConnectedSub}>Connect your GitHub account in Settings to see insights.</Text>
          </View>
        )}
      </ScrollView>
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    marginBottom: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardHeaderText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  totalCommits: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  graphContainer: {
    overflow: 'hidden',
  },
  graphRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  graphLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    gap: 2,
  },
  graphLegendText: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginHorizontal: spacing.sm,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  langDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  langName: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    width: 90,
  },
  langBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bg.elevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  langFill: {
    height: '100%',
    borderRadius: 3,
  },
  langPct: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    width: 40,
    textAlign: 'right',
  },
  repoCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    marginBottom: spacing.sm,
  },
  repoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  repoName: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  repoStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repoStarCount: {
    fontSize: fontSize.sm,
    color: colors.yellow.default,
    fontWeight: fontWeight.semibold,
  },
  repoDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  notConnected: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  notConnectedTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  notConnectedSub: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

const s2 = StyleSheet.create({
  statChip: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    alignItems: 'center',
  },
  statChipIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statChipValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statChipLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
});
