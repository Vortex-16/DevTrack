/**
 * AI Insights Controller
 * Provides strategic developer productivity analysis powered by Groq AI.
 *
 * Endpoints:
 *   GET /api/insights/productivity  — Commit/activity trend analysis (30/90 days)
 *   GET /api/insights/recommendations — Personalized strategic action items
 *   GET /api/insights/risk          — Project + code risk analysis
 *   GET /api/insights/momentum      — Weekly momentum score + history
 */

const { collections, db } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const { getGroqService } = require('../services/groqService');
const GitHubService = require('../services/githubService');
const cache = require('../config/cache');
const {
    getActiveGithubToken,
    hasGithubAccessExpired,
    buildGithubAccessClearUpdate,
} = require('../services/githubAccessService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getUserAndToken = async (userId) => {
    const userDoc = await collections.users().doc(userId).get();
    if (!userDoc.exists) throw new APIError('User not found', 404);

    const user = userDoc.data();
    const token = getActiveGithubToken(user);

    if (!token && hasGithubAccessExpired(user)) {
        await collections.users().doc(userId)
            .update(buildGithubAccessClearUpdate())
            .catch(() => null);
    }

    return { user, token };
};

// ─── Productivity Trends ──────────────────────────────────────────────────────

/**
 * GET /api/insights/productivity
 * Fetches contribution data for 90 days and asks Groq to analyze trends,
 * peak productivity periods, and consistency patterns.
 *
 * Query params: ?days=30|60|90 (default 90)
 */
exports.getProductivityTrends = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const days = Math.min(parseInt(req.query.days) || 90, 90);
        const cacheKey = `insights_productivity_${userId}_${days}`;

        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: cached, fromCache: true });

        const { user, token } = await getUserAndToken(userId);

        if (!user.githubUsername) {
            return res.status(200).json({
                success: true,
                data: {
                    available: false,
                    message: 'Connect GitHub to unlock productivity insights.',
                },
            });
        }

        const githubService = new GitHubService(token);

        // Fetch contribution data in parallel with project data
        const [contributions, projectsSnapshot] = await Promise.all([
            githubService.getContributions(user.githubUsername, days).catch(() => null),
            collections.projects().where('uid', '==', userId).limit(10).get(),
        ]);

        const projects = projectsSnapshot.docs.map(d => ({
            name: d.data().name,
            primaryLanguage: d.data().primaryLanguage,
            lastAnalyzed: d.data().lastAnalyzed,
            healthScore: d.data().healthScore,
        }));

        // Build AI prompt payload (keep it compact to save tokens)
        const promptData = {
            username: user.githubUsername,
            days,
            totalContributions: contributions?.totalContributions || 0,
            totalCommits: contributions?.totalCommits || 0,
            totalPRs: contributions?.totalPRs || 0,
            totalIssues: contributions?.totalIssues || 0,
            streak: contributions?.streak || 0,
            activeDays: contributions?.days?.filter(d => d.contributionCount > 0).length || 0,
            inactiveDays: contributions?.days?.filter(d => d.contributionCount === 0).length || 0,
            peakDay: contributions?.days?.reduce((max, d) =>
                d.contributionCount > (max?.contributionCount || 0) ? d : max, null
            ),
            projectCount: projects.length,
            projects,
        };

        const groq = getGroqService();
        const aiResult = await groq.analyzeProductivityTrends(promptData);

        const responseData = {
            available: true,
            period: { days, username: user.githubUsername },
            raw: {
                totalContributions: promptData.totalContributions,
                totalCommits: promptData.totalCommits,
                streak: promptData.streak,
                activeDays: promptData.activeDays,
                inactiveDays: promptData.inactiveDays,
            },
            analysis: aiResult,
            generatedAt: new Date().toISOString(),
        };

        cache.set(cacheKey, responseData, cache.TTL.AI_INSIGHTS);
        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        next(error);
    }
};

// ─── Strategic Recommendations ────────────────────────────────────────────────

/**
 * GET /api/insights/recommendations
 * Cross-references GitHub activity, project health, and learning history
 * to generate personalized strategic action items.
 */
exports.getRecommendations = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const cacheKey = `insights_recs_${userId}`;

        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: cached, fromCache: true });

        const { user, token } = await getUserAndToken(userId);

        if (!user.githubUsername) {
            return res.status(200).json({
                success: true,
                data: { available: false, message: 'Connect GitHub to get personalized recommendations.' },
            });
        }

        const githubService = new GitHubService(token);

        // Gather context in parallel
        const [activity, projectsSnap, prefsDoc] = await Promise.all([
            githubService.getActivitySummary(user.githubUsername).catch(() => null),
            collections.projects().where('uid', '==', userId).limit(10).get(),
            collections.users().doc(userId).get(),
        ]);

        const projects = projectsSnap.docs.map(d => {
            const data = d.data();
            return {
                name: data.name,
                healthScore: data.healthScore,
                primaryLanguage: data.primaryLanguage,
                lastCommit: data.lastCommit,
                openIssues: data.openIssues,
                status: data.status,
                aiInsights: data.aiInsights?.substring?.(0, 300),
            };
        });

        const userData = prefsDoc.exists ? prefsDoc.data() : {};

        const promptData = {
            username: user.githubUsername,
            totalEvents: activity?.totalEvents || 0,
            pushEvents: activity?.pushEvents || 0,
            reposThisWeek: activity?.reposCount || 0,
            projects,
            role: userData.role || 'developer',
            experienceLevel: userData.experienceLevel || 'mid',
            goals: userData.goals || [],
        };

        const groq = getGroqService();
        const recommendations = await groq.generateStrategicRecommendations(promptData);

        const responseData = {
            available: true,
            recommendations,
            context: {
                projectCount: projects.length,
                weeklyActivity: activity?.totalEvents || 0,
            },
            generatedAt: new Date().toISOString(),
        };

        cache.set(cacheKey, responseData, cache.TTL.AI_INSIGHTS);
        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        next(error);
    }
};

// ─── Risk Analysis ────────────────────────────────────────────────────────────

/**
 * GET /api/insights/risk
 * Analyzes project health scores, open issues, and stale repos to surface
 * technical debt and risk signals.
 */
exports.getRiskAnalysis = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const cacheKey = `insights_risk_${userId}`;

        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: cached, fromCache: true });

        const projectsSnap = await collections.projects()
            .where('uid', '==', userId)
            .orderBy('updatedAt', 'desc')
            .limit(15)
            .get();

        const projects = projectsSnap.docs.map(d => {
            const data = d.data();
            const daysSinceUpdate = data.updatedAt
                ? Math.floor((Date.now() - new Date(data.updatedAt).getTime()) / 86400000)
                : null;
            return {
                name: data.name,
                healthScore: data.healthScore ?? null,
                openIssues: data.openIssues ?? 0,
                openPRs: data.openPRs ?? 0,
                daysSinceUpdate,
                primaryLanguage: data.primaryLanguage,
                hasTests: data.hasTests ?? false,
                hasCICD: data.hasCICD ?? false,
                isPrivate: data.isPrivate ?? false,
                securityAlerts: data.securityAlerts ?? 0,
            };
        });

        // Compute simple risk scores locally (fast, no AI needed for raw metrics)
        const withRisk = projects.map(p => {
            let riskScore = 0;
            const flags = [];

            if (p.healthScore !== null && p.healthScore < 40) { riskScore += 30; flags.push('Low health score'); }
            if (p.openIssues > 10) { riskScore += 20; flags.push(`${p.openIssues} open issues`); }
            if (p.daysSinceUpdate !== null && p.daysSinceUpdate > 60) { riskScore += 25; flags.push(`Stale (${p.daysSinceUpdate}d)`); }
            if (!p.hasTests) { riskScore += 10; flags.push('No tests detected'); }
            if (!p.hasCICD) { riskScore += 5; flags.push('No CI/CD'); }
            if (p.securityAlerts > 0) { riskScore += 25; flags.push(`${p.securityAlerts} security alerts`); }

            return {
                ...p,
                riskScore: Math.min(riskScore, 100),
                riskLevel: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low',
                riskFlags: flags,
            };
        }).sort((a, b) => b.riskScore - a.riskScore);

        // Use AI only for the top high-risk project (token efficient)
        let aiAnalysis = null;
        const highRisk = withRisk.filter(p => p.riskLevel === 'high').slice(0, 3);

        if (highRisk.length > 0) {
            try {
                const groq = getGroqService();
                aiAnalysis = await groq.analyzeCodeRisk({ highRiskProjects: highRisk });
            } catch {
                // Non-critical — risk scores still available
            }
        }

        const responseData = {
            available: true,
            summary: {
                totalProjects: withRisk.length,
                highRisk: withRisk.filter(p => p.riskLevel === 'high').length,
                mediumRisk: withRisk.filter(p => p.riskLevel === 'medium').length,
                lowRisk: withRisk.filter(p => p.riskLevel === 'low').length,
                overallRiskScore: withRisk.length > 0
                    ? Math.round(withRisk.reduce((s, p) => s + p.riskScore, 0) / withRisk.length)
                    : 0,
            },
            projects: withRisk,
            aiAnalysis,
            generatedAt: new Date().toISOString(),
        };

        cache.set(cacheKey, responseData, cache.TTL.AI_INSIGHTS);
        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        next(error);
    }
};

// ─── Momentum Score ───────────────────────────────────────────────────────────

/**
 * GET /api/insights/momentum
 * Returns the user's current weekly momentum score (0-100) based on
 * commit activity, streak, project health, and learning consistency.
 * Stores history in `userMetrics` Firestore collection (12-week rolling).
 */
exports.getMomentum = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const cacheKey = `insights_momentum_${userId}`;

        const cached = cache.get(cacheKey);
        if (cached) return res.status(200).json({ success: true, data: cached, fromCache: true });

        const { user, token } = await getUserAndToken(userId);

        if (!user.githubUsername) {
            return res.status(200).json({
                success: true,
                data: { available: false, score: 0, label: 'Not Connected', history: [] },
            });
        }

        const githubService = new GitHubService(token);

        const [contributions, projectsSnap] = await Promise.all([
            githubService.getContributions(user.githubUsername, 7).catch(() => null),
            collections.projects().where('uid', '==', userId).limit(10).get(),
        ]);

        const projects = projectsSnap.docs.map(d => d.data());
        const avgHealth = projects.length > 0
            ? projects.reduce((s, p) => s + (p.healthScore || 50), 0) / projects.length
            : 50;

        // Momentum score formula (0-100)
        const commitScore = Math.min((contributions?.totalCommits || 0) * 5, 40);     // max 40pts
        const streakScore = Math.min((contributions?.streak || 0) * 3, 25);           // max 25pts
        const healthScore = (avgHealth / 100) * 20;                                   // max 20pts
        const diversityScore = Math.min((contributions?.totalPRs || 0) * 3, 15);     // max 15pts

        const score = Math.round(commitScore + streakScore + healthScore + diversityScore);

        const label = score >= 85 ? 'Exceptional'
            : score >= 70 ? 'Strong Momentum'
                : score >= 50 ? 'Building'
                    : score >= 30 ? 'Warming Up'
                        : 'Getting Started';

        // Persist this week's score to Firestore for history
        const weekKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const metricsRef = db.collection('userMetrics').doc(userId);
        const metricsDoc = await metricsRef.get();

        let history = metricsDoc.exists ? (metricsDoc.data().momentumHistory || []) : [];

        // Update or append this week's entry
        const existingIndex = history.findIndex(h => h.week === weekKey);
        if (existingIndex >= 0) {
            history[existingIndex] = { week: weekKey, score, label };
        } else {
            history.push({ week: weekKey, score, label });
        }

        // Keep only the last 12 weeks
        history = history.slice(-12);

        await metricsRef.set({ momentumHistory: history, updatedAt: new Date().toISOString() }, { merge: true })
            .catch(() => null);

        const responseData = {
            available: true,
            score,
            label,
            breakdown: {
                commits: Math.round(commitScore),
                streak: Math.round(streakScore),
                projectHealth: Math.round(healthScore),
                diversity: Math.round(diversityScore),
            },
            history,
            generatedAt: new Date().toISOString(),
        };

        cache.set(cacheKey, responseData, cache.TTL.AI_INSIGHTS);
        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        next(error);
    }
};
