/**
 * Realistic mock dataset for the weekly report — matches the exact shapes produced by
 * githubService (getGitHubInsights / getWeeklyStats / getActivitySummary) and
 * groqService.generateWeeklyInsights. Used by scripts/preview-report.js --mock so the
 * PDF design can be iterated instantly with NO Firebase / GitHub / Groq / network calls.
 *
 * Pure data — no imports, no side effects.
 */

const dayDistribution = [
    { date: '2026-06-13', count: 3, dayName: 'Sat', weekday: 6 },
    { date: '2026-06-14', count: 0, dayName: 'Sun', weekday: 0 },
    { date: '2026-06-15', count: 11, dayName: 'Mon', weekday: 1 },
    { date: '2026-06-16', count: 9, dayName: 'Tue', weekday: 2 },
    { date: '2026-06-17', count: 14, dayName: 'Wed', weekday: 3 },
    { date: '2026-06-18', count: 4, dayName: 'Thu', weekday: 4 },
    { date: '2026-06-19', count: 1, dayName: 'Fri', weekday: 5 },
];

const weeklyStats = {
    weekly: { commits: 42, prs: 7, issues: 5, totalContributions: 54, reposActive: 4, activeDays: 6, totalDays: 7 },
    behavioral: {
        consistencyScore: 86,
        longestActiveRun: 5,
        peakDay: 'Wed',
        peakDayCount: 14,
        activeDayPercent: 86,
        dayDistribution,
    },
    dateRange: { from: '2026-06-13', to: '2026-06-19' },
};

const insights = {
    profile: {
        name: 'Ada Lovelace',
        username: 'adalove',
        avatarUrl: null,
        bio: 'Systems & ML engineer. Building developer tooling.',
        createdAt: '2019-03-11T00:00:00.000Z',
        followers: 312,
        following: 88,
    },
    stats: {
        totalRepos: 47,
        publicRepos: 39,
        privateRepos: 8,
        sourceRepos: 35,
        totalStars: 1840,
        totalForks: 263,
        totalCommits: 6120,
        totalPRs: 412,
        totalReviews: 188,
        totalIssuesSolved: 96,
        totalStarred: 540,
        totalWatching: 61,
        totalContributions: 7430,
    },
    rank: { score: 612, grade: 'S', level: 8 },
    languages: [
        { name: 'TypeScript', size: 482000, percentage: 38 },
        { name: 'Python', size: 305000, percentage: 24 },
        { name: 'Rust', size: 190000, percentage: 15 },
        { name: 'Go', size: 152000, percentage: 12 },
        { name: 'JavaScript', size: 89000, percentage: 7 },
        { name: 'Shell', size: 50000, percentage: 4 },
    ],
    badges: [
        { id: 'century_committer', name: 'Century Committer', icon: '🏆' },
        { id: 'pr_master', name: 'PR Master', icon: '🚢' },
        { id: 'community_leader', name: 'Community Leader', icon: '🌟' },
        { id: 'octo_ninja', name: 'Octo Ninja', icon: '🥷' },
    ],
};

// recentActivity.reposWorkedOn — array of objects (post-processing shape)
const recentActivity = {
    totalEvents: 54,
    reposWorkedOn: [
        { name: 'legal-tech-platform', shortName: 'legal-tech-platform', commitsThisWeek: 18, stars: 642 },
        { name: 'devtrack-core', shortName: 'devtrack-core', commitsThisWeek: 12, stars: 215 },
        { name: 'rust-vector-db', shortName: 'rust-vector-db', commitsThisWeek: 9, stars: 1180 },
        { name: 'infra-actions', shortName: 'infra-actions', commitsThisWeek: 3, stars: 47 },
    ],
};

const repos = recentActivity.reposWorkedOn;

const aiInsights = {
    dashboard: {
        momentum: 'HIGH ↑',
        kpis: {
            weeklyCommits: 42,
            weeklyPRs: 7,
            commitsDelta: '+18%',
            prsDelta: '+2',
            focusScore: 72,
            collaborationScore: 81,
            consistencyScore: 86,
        },
        biggestWin: 'legal-tech-platform shipped 18 commits and crossed 1.2K weekly clones while holding an 89% feature-to-fix ratio — the strongest output of the quarter.',
        biggestRisk: 'rust-vector-db carries 1.18K stars but only 9 commits this week with 4 open dependency advisories — visibility risk is compounding.',
        strategicFocus: 'Cut a patch release for rust-vector-db and triage its dependency advisories before they reach downstream consumers.',
    },
    behavioral: {
        peakDay: 'Wed',
        peakDayCount: 14,
        consistencyPattern: 'Mid-week loaded: 67% of commits landed Mon–Wed, tapering into the weekend.',
        focusFragmentation: 'Healthy concentration — 71% of effort on two primary repos.',
        commitTypeBreakdown: { features: 44, fixes: 28, docs: 11, refactors: 13, other: 4 },
        behaviorSummary: 'Work is front-loaded into the early week with a clear Wednesday peak. Feature work dominates, but a rising fix ratio late-week hints at stabilization pressure on legal-tech-platform.',
    },
    intelligence: {
        workConsistency: { status: 'Excellent', interpretation: 'Active on 6 of 7 days with a 5-day streak — well above baseline.', trend: '↑', score: 88 },
        focusAnalysis: { status: 'Stable', interpretation: 'Effort concentrated on legal-tech-platform and devtrack-core; limited context-switching.', trend: '→', score: 74 },
        collaboration: { status: 'Stable', interpretation: '7 PRs opened and 12 reviews — steady team throughput.', trend: '↑', score: 81 },
        codeQuality: { status: 'Warning', interpretation: 'Fix commits rose to 28% of volume, suggesting churn in recently shipped features.', trend: '↓', score: 63 },
    },
    repositories: {
        'legal-tech-platform': {
            state: 'RAPID_GROWTH',
            metrics: { momentum: 'HIGH', commitVelocity: 18, visibilityRisk: 22, estimatedMaintenanceRatio: 34 },
            insight: 'Sustained feature velocity with commits referencing "billing engine" and "audit log" — core product surface is expanding fast.',
            suggestedAction: 'Add integration tests around the new billing engine before the next release cut.',
        },
        'devtrack-core': {
            state: 'FEATURE_EXPANDING',
            metrics: { momentum: 'MEDIUM', commitVelocity: 12, visibilityRisk: 18, estimatedMaintenanceRatio: 41 },
            insight: 'Commits show new "report generator" and "queue worker" modules — backend capability is broadening steadily.',
            suggestedAction: 'Document the queue worker contract to reduce onboarding friction for contributors.',
        },
        'rust-vector-db': {
            state: 'SECURITY_SENSITIVE',
            metrics: { momentum: 'LOW', commitVelocity: 9, visibilityRisk: 78, estimatedMaintenanceRatio: 67 },
            insight: 'High-visibility repo with low weekly velocity; recent commits mention "bump tokio" and "CVE" — dependency exposure is live.',
            suggestedAction: 'Run cargo audit and publish a patched release to protect downstream users.',
        },
        'infra-actions': {
            state: 'MAINTENANCE_HEAVY',
            metrics: { momentum: 'LOW', commitVelocity: 3, visibilityRisk: 12, estimatedMaintenanceRatio: 82 },
            insight: 'Mostly CI fixes and workflow pin updates — maintenance work rather than new capability.',
            suggestedAction: 'Consolidate duplicated workflow steps into a reusable composite action.',
        },
    },
    security: [
        {
            issue: 'Outdated dependency with known CVE',
            severity: 'High',
            confidence: 'High',
            evidence: 'Commit "bump tokio" alongside a "CVE" reference in rust-vector-db indicates an unpatched advisory in the dependency tree.',
            affectedArea: 'rust-vector-db / Cargo.lock',
            suggestion: 'Run cargo audit, upgrade the flagged crates, and cut a patch release.',
        },
        {
            issue: 'Potential secret handling in billing module',
            severity: 'Medium',
            confidence: 'Medium',
            evidence: 'Commits touching "billing engine" and "env" suggest credentials may be read directly from environment without a secret manager.',
            affectedArea: 'legal-tech-platform / billing',
            suggestion: 'Route billing credentials through a secret manager and assert they are never logged.',
        },
        {
            issue: 'Missing input validation on new report endpoint',
            severity: 'Low',
            confidence: 'Low',
            evidence: 'New "report generator" routes in devtrack-core with no accompanying validation commits.',
            affectedArea: 'devtrack-core / routes',
            suggestion: 'Add schema validation (e.g. Joi/zod) to the new report endpoints.',
        },
    ],
    weeklyDelta: {
        note: 'Comparison estimated from prior report patterns.',
        metrics: [
            { label: 'Commits', current: 42, estimated: '~36', delta: '+6', signal: '↑' },
            { label: 'PRs Merged', current: 7, estimated: '~5', delta: '+2', signal: '↑' },
            { label: 'Active Repos', current: 4, estimated: '~4', delta: '0', signal: '→' },
            { label: 'Focus Score', current: 72, estimated: '~78', delta: '-6', signal: '↓' },
        ],
        interpretation: 'Output rose week-over-week while focus dipped slightly as a fourth repo entered the rotation.',
    },
    globalScore: {
        total: 79,
        breakdown: { consistency: 88, velocity: 82, collaboration: 81, codeQuality: 63, security: 58 },
        scoringNote: 'Strong consistency and velocity lift the score; security exposure on rust-vector-db is the main drag.',
    },
    narrative: 'A high-output week anchored by legal-tech-platform, which expanded its billing and audit surfaces at sustained velocity while devtrack-core broadened its backend with new report and queue modules. Consistency was excellent — six active days and a five-day streak — and collaboration held steady across seven PRs and twelve reviews. The principal concern is rust-vector-db: a high-visibility, 1.18K-star project moving slowly with a live dependency advisory, which drags the security subscore and warrants an immediate patched release. A late-week rise in fix commits also signals stabilization pressure on recently shipped features. Net trajectory is strongly positive, contingent on closing the security gap.',
};

// History for the momentum trend (oldest → newest; current week appended last)
const history = [
    { createdAt: '2026-05-29T10:00:00.000Z', aiInsights: { globalScore: { total: 68 } }, stats: { weeklyCommits: 31 } },
    { createdAt: '2026-06-05T10:00:00.000Z', aiInsights: { globalScore: { total: 72 } }, stats: { weeklyCommits: 35 } },
    { createdAt: '2026-06-12T10:00:00.000Z', aiInsights: { globalScore: { total: 74 } }, stats: { weeklyCommits: 36 } },
    { createdAt: '2026-06-19T10:00:00.000Z', aiInsights, stats: { ...insights.stats, weeklyCommits: 42 } },
];

// Attach weekly stats the way generatePDFReport does, so heatmap renders.
aiInsights._weeklyStats = weeklyStats;

const user = {
    name: 'Ada Lovelace',
    githubUsername: 'adalove',
    email: 'ada@example.com',
};

module.exports = {
    user,
    insights,
    repos,
    activeRepos: recentActivity.reposWorkedOn,
    aiInsights,
    history,
    recentActivity,
    weeklyStats,
    streak: 5,
    subtitle: 'Friday, Jun 19, 2026',
};
