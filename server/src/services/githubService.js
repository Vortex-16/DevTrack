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
     * @param {string} username - GitHub username
     * @param {number} perPage - Number of repos to fetch
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
     * Get recent commits across user's repos
     * @param {string} username - GitHub username
     * @param {number} days - Number of days to look back
     */
    async getRecentCommits(username, days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        try {
            // Get user's recent events (includes push events with commits)
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
                            message: commit.message.split('\n')[0], // First line only
                            repo: event.repo.name,
                            date: event.created_at,
                            url: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
                        });
                    }
                }
            }

            // Filter by date and limit
            const filteredCommits = commits.filter(
                (c) => new Date(c.date) >= since
            );

            return filteredCommits.slice(0, 50); // Limit to 50 commits
        } catch (error) {
            console.error('Error fetching commits:', error.message);
            return [];
        }
    }

    /**
     * Get user's contribution activity summary
     * @param {string} username - GitHub username
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
                languagesUsed: new Set(),
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
     * @param {string} username - GitHub username
     */
    async getLanguages(username) {
        const repos = await this.getRepos(username, 20);
        const languages = {};

        for (const repo of repos) {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        }

        // Sort by count and return as array
        return Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }
    /**
     * Get detailed info for a specific repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     */
    async getRepoInfo(owner, repo) {
        try {
            const { data: repoData } = await this.octokit.rest.repos.get({
                owner,
                repo,
            });

            // Get commit count
            const { data: commitsData } = await this.octokit.rest.repos.listCommits({
                owner,
                repo,
                per_page: 1,
            });

            // GitHub returns total count in headers for pagination
            let commitCount = 0;
            try {
                const response = await this.octokit.request('GET /repos/{owner}/{repo}/commits', {
                    owner,
                    repo,
                    per_page: 1,
                });
                // Parse the Link header to get total count
                const linkHeader = response.headers.link;
                if (linkHeader) {
                    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
                    if (match) {
                        commitCount = parseInt(match[1]);
                    }
                } else {
                    commitCount = 1; // Only one page means few commits
                }
            } catch {
                commitCount = commitsData.length || 0;
            }

            // Get languages
            const { data: languagesData } = await this.octokit.rest.repos.listLanguages({
                owner,
                repo,
            });

            const totalBytes = Object.values(languagesData).reduce((a, b) => a + b, 0);
            const languages = Object.entries(languagesData).map(([name, bytes]) => ({
                name,
                bytes,
                percentage: Math.round((bytes / totalBytes) * 100),
            }));

            return {
                name: repoData.name,
                fullName: repoData.full_name,
                description: repoData.description,
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                openIssues: repoData.open_issues_count,
                createdAt: repoData.created_at,
                updatedAt: repoData.updated_at,
                pushedAt: repoData.pushed_at,
                defaultBranch: repoData.default_branch,
                size: repoData.size,
                url: repoData.html_url,
                commitCount,
                languages,
                topics: repoData.topics || [],
            };
        } catch (error) {
            console.error('Error fetching repo info:', error.message);
            throw error;
        }
    }

    /**
     * Parse GitHub URL to extract owner and repo
     * @param {string} url - GitHub repository URL
     */
    static parseGitHubUrl(url) {
        if (!url) return null;

        // Handle various GitHub URL formats
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
