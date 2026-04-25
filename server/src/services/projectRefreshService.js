/**
 * Project Refresh Service
 * Periodically refreshes project GitHub + AI analysis with randomized weekly scheduling.
 */

const { collections } = require('../config/firebase');
const GitHubService = require('./githubService');
const { getGroqService } = require('./groqService');

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const mergeTrafficHistory = (oldHistory = [], newHistory = []) => {
    if (!Array.isArray(oldHistory)) oldHistory = [];
    if (!Array.isArray(newHistory)) newHistory = [];

    const historyMap = new Map();
    oldHistory.forEach((item) => {
        if (item && item.timestamp) historyMap.set(item.timestamp, item);
    });
    newHistory.forEach((item) => {
        if (item && item.timestamp) historyMap.set(item.timestamp, item);
    });

    return Array.from(historyMap.values()).sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
};

const getRandomNextRefreshAt = () => {
    const now = new Date();
    const daysAhead = 6 + Math.floor(Math.random() * 3); // 6-8 days
    const randomMinutes = Math.floor(Math.random() * 24 * 60);

    const next = new Date(now);
    next.setUTCDate(next.getUTCDate() + daysAhead);
    next.setUTCHours(0, 0, 0, 0);
    next.setUTCMinutes(randomMinutes);

    return next.toISOString();
};

const isDueForRefresh = (project, now) => {
    if (!project.repositoryUrl || project.isAnalyzing) return false;

    if (project.nextAutoRefreshAt) {
        const scheduled = new Date(project.nextAutoRefreshAt);
        if (!Number.isNaN(scheduled.getTime())) {
            return scheduled <= now;
        }
    }

    const anchor = project.lastAutoRefreshAt || project.updatedAt || project.createdAt;
    const anchorDate = new Date(anchor);

    if (Number.isNaN(anchorDate.getTime())) return true;
    return (now.getTime() - anchorDate.getTime()) >= WEEK_MS;
};

const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const refreshProjectsBatch = async (options = {}) => {
    const now = new Date();
    const maxProjects = Number(options.maxProjects || process.env.AUTO_PROJECT_REFRESH_BATCH || 8);

    const projectsSnapshot = await collections.projects().get();
    const allProjects = projectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const dueProjects = allProjects.filter((project) => isDueForRefresh(project, now));

    if (dueProjects.length === 0) {
        return { scanned: allProjects.length, due: 0, refreshed: 0, failed: 0 };
    }

    const selected = shuffle(dueProjects).slice(0, Math.max(1, maxProjects));
    const userTokenCache = new Map();
    const groqService = getGroqService();

    let refreshed = 0;
    let failed = 0;

    for (const project of selected) {
        try {
            const parsed = GitHubService.parseGitHubUrl(project.repositoryUrl);
            if (!parsed) {
                await collections.projects().doc(project.id).update({
                    nextAutoRefreshAt: getRandomNextRefreshAt(),
                    autoRefreshError: 'Invalid GitHub repository URL',
                    updatedAt: new Date().toISOString(),
                });
                failed += 1;
                continue;
            }

            let token = userTokenCache.get(project.uid);
            if (token === undefined) {
                const userDoc = await collections.users().doc(project.uid).get();
                token = userDoc.exists ? (userDoc.data()?.githubAccessToken || null) : null;
                userTokenCache.set(project.uid, token);
            }

            await collections.projects().doc(project.id).update({
                isAnalyzing: true,
                analysisError: null,
                autoRefreshError: null,
                updatedAt: new Date().toISOString(),
            });

            const github = new GitHubService(token);
            const freshGithubData = await github.getCompleteRepoInfo(parsed.owner, parsed.repo);
            const freshAiAnalysis = await groqService.analyzeProjectProgress(freshGithubData);

            const oldGithubData = project.githubData || {};
            const mergedViews = mergeTrafficHistory(oldGithubData.viewHistory, freshGithubData.viewHistory);
            const mergedClones = mergeTrafficHistory(oldGithubData.cloneHistory, freshGithubData.cloneHistory);

            const mergedGithubData = {
                ...freshGithubData,
                viewHistory: mergedViews,
                cloneHistory: mergedClones,
                allTimeViews: mergedViews.reduce((sum, d) => sum + (d.count || 0), 0),
                allTimeClones: mergedClones.reduce((sum, d) => sum + (d.count || 0), 0),
            };

            await collections.projects().doc(project.id).update({
                githubData: mergedGithubData,
                aiAnalysis: freshAiAnalysis,
                progress: freshAiAnalysis?.progressPercentage || 0,
                commits: freshGithubData?.totalCommits || project.commits || 0,
                technologies: freshGithubData?.languages?.map((l) => l.name) || project.technologies || [],
                isAnalyzing: false,
                analysisError: null,
                autoRefreshError: null,
                lastAutoRefreshAt: new Date().toISOString(),
                nextAutoRefreshAt: getRandomNextRefreshAt(),
                updatedAt: new Date().toISOString(),
            });

            refreshed += 1;
        } catch (error) {
            failed += 1;
            await collections.projects().doc(project.id).update({
                isAnalyzing: false,
                autoRefreshError: error.message,
                nextAutoRefreshAt: getRandomNextRefreshAt(),
                updatedAt: new Date().toISOString(),
            }).catch(() => null);
        }
    }

    return {
        scanned: allProjects.length,
        due: dueProjects.length,
        selected: selected.length,
        refreshed,
        failed,
    };
};

module.exports = {
    refreshProjectsBatch,
};
