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
     * Get recent commits across user's repos
     */
    async getRecentCommits(username, days = 7) {
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

            return filteredCommits.slice(0, 50);
        } catch (error) {
            console.error('Error fetching commits:', error.message);
            return [];
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
                languagesData
            ] = await Promise.all([
                this.octokit.rest.repos.get({ owner, repo }).then(r => r.data),
                this.getAllCommitsForRepo(owner, repo, 100),
                this.getOpenPullRequests(owner, repo),
                this.getOpenIssues(owner, repo),
                this.getRepoContents(owner, repo),
                this.getReadme(owner, repo),
                this.octokit.rest.repos.listLanguages({ owner, repo }).then(r => r.data)
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

            console.log(`✅ Fetched: ${commits.length} commits, ${pullRequests.length} PRs, ${issues.length} issues`);

            return {
                // Basic info
                name: repoData.name,
                fullName: repoData.full_name,
                description: repoData.description,
                url: repoData.html_url,

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

                // PRs and Issues
                openPullRequests: pullRequests,
                openIssues: issues,

                // Structure
                directoryStructure: contents,
                readme: readme,

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
