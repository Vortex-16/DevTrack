/**
 * GitHub API Service
 * Handles all GitHub API interactions using Octokit
 */

const { Octokit } = require('octokit');

class GitHubService {
    constructor(token = null) {
        // Use provided token or fall back to PAT from env
        const authToken = token || process.env.GITHUB_PAT;

        if (!authToken) {
            throw new Error('GitHub token not provided');
        }

        this.octokit = new Octokit({ auth: authToken });
    }

    /**
     * Get authenticated user's profile
     */
    async getUser() {
        const { data } = await this.octokit.rest.users.getAuthenticated();
        return {
            username: data.login,
            name: data.name,
            avatarUrl: data.avatar_url,
            bio: data.bio,
            publicRepos: data.public_repos,
            followers: data.followers,
            following: data.following,
        };
    }

    /**
     * Get user's repositories
     */
    async getRepos(username, perPage = 10) {
        const { data } = await this.octokit.rest.repos.listForUser({
            username,
            sort: 'updated',
            per_page: perPage,
        });

        return data.map((repo) => ({
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            updatedAt: repo.updated_at,
            url: repo.html_url,
            isPrivate: repo.private,
        }));
    }

    /**
     * Get ALL commits for a specific repo (paginated)
     */
    async getAllCommitsForRepo(owner, repo, maxCommits = 100) {
        try {
            const commits = [];
            let page = 1;
            const perPage = 100;

            while (commits.length < maxCommits) {
                const { data } = await this.octokit.rest.repos.listCommits({
                    owner,
                    repo,
                    per_page: perPage,
                    page,
                });

                if (data.length === 0) break;

                for (const commit of data) {
                    commits.push({
                        sha: commit.sha.substring(0, 7),
                        message: commit.commit.message.split('\n')[0],
                        author: commit.commit.author?.name || 'Unknown',
                        date: commit.commit.author?.date,
                        url: commit.html_url,
                    });

                    if (commits.length >= maxCommits) break;
                }

                if (data.length < perPage) break;
                page++;
            }

            return commits;
        } catch (error) {
            console.error('Error fetching commits:', error.message);
            return [];
        }
    }

    /**
     * Get open pull requests for a repo
     */
    async getOpenPullRequests(owner, repo) {
        try {
            const { data } = await this.octokit.rest.pulls.list({
                owner,
                repo,
                state: 'open',
                per_page: 50,
            });

            return data.map(pr => ({
                number: pr.number,
                title: pr.title,
                state: pr.state,
                author: pr.user?.login,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                url: pr.html_url,
            }));
        } catch (error) {
            console.error('Error fetching PRs:', error.message);
            return [];
        }
    }

    /**
     * Get open issues for a repo
     */
    async getOpenIssues(owner, repo) {
        try {
            const { data } = await this.octokit.rest.issues.listForRepo({
                owner,
                repo,
                state: 'open',
                per_page: 50,
            });

            // Filter out pull requests (GitHub includes them in issues API)
            return data
                .filter(issue => !issue.pull_request)
                .map(issue => ({
                    number: issue.number,
                    title: issue.title,
                    labels: issue.labels.map(l => l.name),
                    assignee: issue.assignee?.login,
                    createdAt: issue.created_at,
                    url: issue.html_url,
                }));
        } catch (error) {
            console.error('Error fetching issues:', error.message);
            return [];
        }
    }

    /**
     * Get repository directory structure
     */
    async getRepoContents(owner, repo, path = '') {
        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path,
            });

            if (Array.isArray(data)) {
                return data.map(item => ({
                    name: item.name,
                    path: item.path,
                    type: item.type, // 'file' or 'dir'
                    size: item.size,
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching repo contents:', error.message);
            return [];
        }
    }

    /**
     * Get README content
     */
    async getReadme(owner, repo) {
        try {
            const { data } = await this.octokit.rest.repos.getReadme({
                owner,
                repo,
            });

            // Decode base64 content
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            return content.substring(0, 2000); // Limit to 2000 chars for AI
        } catch (error) {
            console.error('Error fetching README:', error.message);
            return null;
        }
    }

    /**
     * Get content of key project files for AI analysis
     */
    async getKeyFileContents(owner, repo) {
        const keyFiles = [
            'package.json',
            'pyproject.toml',
            'requirements.txt',
            'Cargo.toml',
            'go.mod',
            'pom.xml',
            'build.gradle',
            '.env.example',
            'docker-compose.yml',
            'Dockerfile'
        ];

        const contents = {};

        for (const filename of keyFiles) {
            try {
                const { data } = await this.octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path: filename,
                });

                if (data.content) {
                    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
                    contents[filename] = decoded.substring(0, 1500); // Limit size
                }
            } catch {
                // File doesn't exist, skip
            }
        }

        return contents;
    }

    /**
     * Get commit statistics (additions, deletions, files changed)
     */
    async getCommitStats(owner, repo, limit = 20) {
        try {
            const commits = await this.getAllCommitsForRepo(owner, repo, limit);
            const stats = {
                totalCommits: commits.length,
                commitMessages: [],
                commitPatterns: {
                    features: 0,
                    fixes: 0,
                    docs: 0,
                    refactors: 0,
                    tests: 0,
                    other: 0
                },
                recentActivity: []
            };

            for (const commit of commits) {
                const msg = commit.message.toLowerCase();
                stats.commitMessages.push(commit.message);

                // Categorize commits by message pattern
                if (msg.includes('feat') || msg.includes('add') || msg.includes('implement')) {
                    stats.commitPatterns.features++;
                } else if (msg.includes('fix') || msg.includes('bug') || msg.includes('resolve')) {
                    stats.commitPatterns.fixes++;
                } else if (msg.includes('doc') || msg.includes('readme')) {
                    stats.commitPatterns.docs++;
                } else if (msg.includes('refactor') || msg.includes('clean') || msg.includes('improve')) {
                    stats.commitPatterns.refactors++;
                } else if (msg.includes('test')) {
                    stats.commitPatterns.tests++;
                } else {
                    stats.commitPatterns.other++;
                }

                // Track recent activity by date
                if (commit.date) {
                    const dateKey = commit.date.split('T')[0];
                    stats.recentActivity.push({
                        date: dateKey,
                        message: commit.message,
                        author: commit.author
                    });
                }
            }

            return stats;
        } catch (error) {
            console.error('Error fetching commit stats:', error.message);
            return null;
        }
    }

    /**
     * Get file tree depth for project structure analysis
     */
    async getProjectStructure(owner, repo, path = '', depth = 0, maxDepth = 2) {
        if (depth > maxDepth) return [];

        try {
            const { data } = await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path,
            });

            if (!Array.isArray(data)) return [];

            const structure = [];
            for (const item of data) {
                const entry = {
                    name: item.name,
                    path: item.path,
                    type: item.type,
                    size: item.size || 0
                };

                if (item.type === 'dir' && depth < maxDepth) {
                    entry.children = await this.getProjectStructure(owner, repo, item.path, depth + 1, maxDepth);
                }

                structure.push(entry);
            }

            return structure;
        } catch (error) {
            console.error('Error fetching project structure:', error.message);
            return [];
        }
    }

    /**
     * Get user's contribution data using GraphQL API (includes private contributions)
     */
    async getContributions(username, days = 30) {
        try {
            const to = new Date();
            const from = new Date();
            from.setDate(from.getDate() - days);

            const query = `
                query($username: String!, $from: DateTime!, $to: DateTime!) {
                    user(login: $username) {
                        contributionsCollection(from: $from, to: $to) {
                            totalCommitContributions
                            totalPullRequestContributions
                            totalIssueContributions
                            contributionCalendar {
                                totalContributions
                                weeks {
                                    contributionDays {
                                        date
                                        contributionCount
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const response = await this.octokit.graphql(query, {
                username,
                from: from.toISOString(),
                to: to.toISOString(),
            });

            const collection = response.user?.contributionsCollection;
            if (!collection) {
                console.log('⚠️ No contributions data from GraphQL');
                return null;
            }

            // Flatten the days from weeks
            const allDays = collection.contributionCalendar.weeks.flatMap(w => w.contributionDays);

            // Calculate streak
            let streak = 0;
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            // Sort by date descending
            const sortedDays = allDays.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Find streak starting from today or yesterday
            let checkDate = new Date();
            const todayData = sortedDays.find(d => d.date === today);
            const yesterdayData = sortedDays.find(d => d.date === yesterday);

            if (!todayData?.contributionCount && !yesterdayData?.contributionCount) {
                streak = 0;
            } else {
                if (!todayData?.contributionCount) {
                    checkDate.setDate(checkDate.getDate() - 1);
                }

                for (const day of sortedDays) {
                    const checkStr = checkDate.toISOString().split('T')[0];
                    if (day.date === checkStr && day.contributionCount > 0) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else if (day.date < checkStr) {
                        break;
                    }
                }
            }

            console.log('✅ GraphQL contributions:', {
                totalCommits: collection.totalCommitContributions,
                streak,
                daysWithActivity: allDays.filter(d => d.contributionCount > 0).length
            });

            return {
                totalCommits: collection.totalCommitContributions,
                totalPRs: collection.totalPullRequestContributions,
                totalIssues: collection.totalIssueContributions,
                totalContributions: collection.contributionCalendar.totalContributions,
                streak,
                days: allDays,
            };
        } catch (error) {
            console.error('Error fetching contributions via GraphQL:', error.message);
            return null;
        }
    }

    /**
     * Get recent commits across user's repos (falls back to GraphQL if REST returns empty)
     */
    async getRecentCommits(username, days = 7) {
        // First try GraphQL for accurate contribution data
        try {
            const contributions = await this.getContributions(username, days);
            if (contributions && contributions.totalCommits > 0) {
                // Convert contribution days to commit-like objects for compatibility
                const commits = contributions.days
                    .filter(d => d.contributionCount > 0)
                    .map(d => ({
                        date: d.date + 'T12:00:00Z',
                        count: d.contributionCount,
                        message: `${d.contributionCount} contribution(s)`,
                    }));

                return {
                    commits,
                    streak: contributions.streak,
                    totalContributions: contributions.totalContributions,
                };
            }
        } catch (err) {
            console.log('GraphQL failed, falling back to REST:', err.message);
        }

        // Fallback to REST API
        const since = new Date();
        since.setDate(since.getDate() - days);

        try {
            const { data: events } = await this.octokit.rest.activity.listPublicEventsForUser({
                username,
                per_page: 100,
            });

            const commits = [];

            for (const event of events) {
                if (event.type === 'PushEvent' && event.payload.commits) {
                    for (const commit of event.payload.commits) {
                        commits.push({
                            sha: commit.sha.substring(0, 7),
                            message: commit.message.split('\n')[0],
                            repo: event.repo.name,
                            date: event.created_at,
                            url: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
                        });
                    }
                }
            }

            const filteredCommits = commits.filter(
                (c) => new Date(c.date) >= since
            );

            return { commits: filteredCommits.slice(0, 50), streak: 0 };
        } catch (error) {
            console.error('Error fetching commits:', error.message);
            return { commits: [], streak: 0 };
        }
    }

    /**
     * Get user's contribution activity summary
     */
    async getActivitySummary(username) {
        try {
            const { data: events } = await this.octokit.rest.activity.listPublicEventsForUser({
                username,
                per_page: 100,
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const summary = {
                totalEvents: events.length,
                todayEvents: 0,
                pushEvents: 0,
                prEvents: 0,
                issueEvents: 0,
                reposWorkedOn: new Set(),
            };

            for (const event of events) {
                const eventDate = new Date(event.created_at);
                eventDate.setHours(0, 0, 0, 0);

                if (eventDate.getTime() === today.getTime()) {
                    summary.todayEvents++;
                }

                summary.reposWorkedOn.add(event.repo.name);

                switch (event.type) {
                    case 'PushEvent':
                        summary.pushEvents++;
                        break;
                    case 'PullRequestEvent':
                        summary.prEvents++;
                        break;
                    case 'IssuesEvent':
                        summary.issueEvents++;
                        break;
                }
            }

            return {
                ...summary,
                reposWorkedOn: Array.from(summary.reposWorkedOn),
                reposCount: summary.reposWorkedOn.size,
            };
        } catch (error) {
            console.error('Error fetching activity summary:', error.message);
            throw error;
        }
    }

    /**
     * Get languages used in user's repos
     */
    async getLanguages(username) {
        const repos = await this.getRepos(username, 20);
        const languages = {};

        for (const repo of repos) {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        }

        return Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }

    /**
     * Get languages for a specific repository only
     */
    async getRepoLanguagesOnly(owner, repo) {
        try {
            const { data: languagesData } = await this.octokit.rest.repos.listLanguages({
                owner,
                repo,
            });

            const totalBytes = Object.values(languagesData).reduce((a, b) => a + b, 0);

            if (totalBytes === 0) return [];

            return Object.entries(languagesData)
                .map(([name, bytes]) => ({
                    name,
                    bytes,
                    percentage: Math.round((bytes / totalBytes) * 100),
                }))
                .sort((a, b) => b.percentage - a.percentage);
        } catch (error) {
            console.error('Error fetching repo languages:', error.message);
            return [];
        }
    }

    /**
     * Get COMPLETE repo info for AI analysis (enhanced)
     */
    async getCompleteRepoInfo(owner, repo) {
        try {
            console.log(`📊 Fetching complete repo info for ${owner}/${repo}...`);

            // Fetch all data in parallel
            const [
                repoData,
                commits,
                pullRequests,
                issues,
                contents,
                readme,
                languagesData,
                keyFiles,
                commitStats
            ] = await Promise.all([
                this.octokit.rest.repos.get({ owner, repo }).then(r => r.data),
                this.getAllCommitsForRepo(owner, repo, 100),
                this.getOpenPullRequests(owner, repo),
                this.getOpenIssues(owner, repo),
                this.getRepoContents(owner, repo),
                this.getReadme(owner, repo),
                this.octokit.rest.repos.listLanguages({ owner, repo }).then(r => r.data),
                this.getKeyFileContents(owner, repo),
                this.getCommitStats(owner, repo, 30)
            ]);

            // Process languages
            const totalBytes = Object.values(languagesData).reduce((a, b) => a + b, 0);
            const languages = Object.entries(languagesData).map(([name, bytes]) => ({
                name,
                bytes,
                percentage: Math.round((bytes / totalBytes) * 100),
            }));

            // Calculate commit frequency (commits per week)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const recentCommits = commits.filter(c => new Date(c.date) > oneWeekAgo);

            console.log(`✅ Fetched: ${commits.length} commits, ${pullRequests.length} PRs, ${issues.length} issues, ${Object.keys(keyFiles).length} key files`);

            return {
                // Basic info
                name: repoData.name,
                fullName: repoData.full_name,
                description: repoData.description,
                url: repoData.html_url,
                isPrivate: repoData.private,

                // Metrics
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                openIssuesCount: repoData.open_issues_count,
                size: repoData.size,

                // Dates
                createdAt: repoData.created_at,
                updatedAt: repoData.updated_at,
                pushedAt: repoData.pushed_at,

                // Languages
                languages,
                primaryLanguage: repoData.language,

                // Activity data
                totalCommits: commits.length,
                recentCommitsThisWeek: recentCommits.length,
                commits: commits.slice(0, 50), // Last 50 for AI context

                // Commit analysis
                commitStats: commitStats,

                // PRs and Issues
                openPullRequests: pullRequests,
                openIssues: issues,

                // Structure
                directoryStructure: contents,
                readme: readme,

                // Key file contents for AI to understand project
                keyFiles: keyFiles,

                // Topics
                topics: repoData.topics || [],
            };
        } catch (error) {
            console.error('Error fetching complete repo info:', error.message);
            throw error;
        }
    }

    /**
     * Get detailed info for a specific repository (legacy - kept for compatibility)
     */
    async getRepoInfo(owner, repo) {
        // Delegate to enhanced method
        return this.getCompleteRepoInfo(owner, repo);
    }

    /**
     * Parse GitHub URL to extract owner and repo
     */
    static parseGitHubUrl(url) {
        if (!url) return null;

        const patterns = [
            /github\.com\/([^\/]+)\/([^\/]+)/,
            /github\.com:([^\/]+)\/([^\/]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    owner: match[1],
                    repo: match[2].replace(/\.git$/, ''),
                };
            }
        }
        return null;
    }
}

module.exports = GitHubService;
