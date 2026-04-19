/**
 * GitHub API Service
 * Handles all GitHub API interactions using Octokit
 */

const { Octokit } = require("octokit");

class GitHubService {
  constructor(token = null) {
    // Use provided token or fall back to PAT from env
    const authToken = token || process.env.GITHUB_PAT;

    if (!authToken) {
      throw new Error("GitHub token not provided");
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
    let repositories;

    try {
      // Use listForAuthenticatedUser to get BOTH public and private repos
      // This is the preferred method when we have a user token
      const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: perPage,
        visibility: "all", // "all" gives both public and private
        affiliation: "owner,collaborator,organization_member",
      });
      repositories = data;
    } catch (error) {
      console.warn("Could not fetch using listForAuthenticatedUser, falling back to listForUser:", error.message);
      // Fallback for when we only have a public PAT or specific username access
      const { data } = await this.octokit.rest.repos.listForUser({
        username,
        sort: "updated",
        per_page: perPage,
      });
      repositories = data;
    }

    return repositories.map((repo) => ({
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
   * Get the TRUE total commit count for a repository
   * Uses the Contributors Stats API which gives accurate totals
   */
  async getTrueCommitCount(owner, repo) {
    try {
      // Method 1: Try to get from contributors stats (most accurate)
      const { data: contributors } =
        await this.octokit.rest.repos.listContributors({
          owner,
          repo,
          per_page: 100,
          anon: "true", // Include anonymous contributors
        });

      if (contributors && contributors.length > 0) {
        const totalCommits = contributors.reduce(
          (sum, c) => sum + (c.contributions || 0),
          0
        );
        console.log(
          `📊 True commit count for ${owner}/${repo}: ${totalCommits} (from ${contributors.length} contributors)`
        );
        return totalCommits;
      }

      // Method 2: Fallback - use participation stats
      const { data: participation } =
        await this.octokit.rest.repos.getParticipationStats({
          owner,
          repo,
        });

      if (participation && participation.all) {
        const totalCommits = participation.all.reduce((a, b) => a + b, 0);
        console.log(`📊 True commit count (participation): ${totalCommits}`);
        return totalCommits;
      }

      return 0;
    } catch (error) {
      console.error("Error getting true commit count:", error.message);
      // Fallback: estimate from paginated fetch
      return null;
    }
  }

  /**
   * Get commits for a specific repo (paginated, for details)
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
            message: commit.commit.message.split("\n")[0],
            author: commit.commit.author?.name || "Unknown",
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
      console.error("Error fetching commits:", error.message);
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
        state: "open",
        per_page: 50,
      });

      return data.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        author: pr.user?.login,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        url: pr.html_url,
      }));
    } catch (error) {
      console.error("Error fetching PRs:", error.message);
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
        state: "open",
        per_page: 50,
      });

      // Filter out pull requests (GitHub includes them in issues API)
      return data
        .filter((issue) => !issue.pull_request)
        .map((issue) => ({
          number: issue.number,
          title: issue.title,
          labels: issue.labels.map((l) => l.name),
          assignee: issue.assignee?.login,
          createdAt: issue.created_at,
          url: issue.html_url,
        }));
    } catch (error) {
      console.error("Error fetching issues:", error.message);
      return [];
    }
  }

  /**
   * Get repository directory structure
   */
  async getRepoContents(owner, repo, path = "") {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(data)) {
        return data.map((item) => ({
          name: item.name,
          path: item.path,
          type: item.type, // 'file' or 'dir'
          size: item.size,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching repo contents:", error.message);
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
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return content.substring(0, 2000); // Limit to 2000 chars for AI
    } catch (error) {
      console.error("Error fetching README:", error.message);
      return null;
    }
  }

  /**
   * Get content of key project files for AI analysis
   */
  async getKeyFileContents(owner, repo) {
    const keyFiles = [
      "package.json",
      "pyproject.toml",
      "requirements.txt",
      "Cargo.toml",
      "go.mod",
      "pom.xml",
      "build.gradle",
      "composer.json",
      "Gemfile",
      "Makefile",
      "tsconfig.json",
      "vite.config.js",
      "vite.config.ts",
      "next.config.js",
      "next.config.mjs",
      "tailwind.config.js",
      "tailwind.config.ts",
      ".env.example",
      "docker-compose.yml",
      "Dockerfile",
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
          const decoded = Buffer.from(data.content, "base64").toString("utf-8");
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
          other: 0,
        },
        recentActivity: [],
      };

      for (const commit of commits) {
        const msg = commit.message.toLowerCase();
        stats.commitMessages.push(commit.message);

        // Categorize commits by message pattern
        if (
          msg.includes("feat") ||
          msg.includes("add") ||
          msg.includes("implement")
        ) {
          stats.commitPatterns.features++;
        } else if (
          msg.includes("fix") ||
          msg.includes("bug") ||
          msg.includes("resolve")
        ) {
          stats.commitPatterns.fixes++;
        } else if (msg.includes("doc") || msg.includes("readme")) {
          stats.commitPatterns.docs++;
        } else if (
          msg.includes("refactor") ||
          msg.includes("clean") ||
          msg.includes("improve")
        ) {
          stats.commitPatterns.refactors++;
        } else if (msg.includes("test")) {
          stats.commitPatterns.tests++;
        } else {
          stats.commitPatterns.other++;
        }

        // Track recent activity by date
        if (commit.date) {
          const dateKey = commit.date.split("T")[0];
          stats.recentActivity.push({
            date: dateKey,
            message: commit.message,
            author: commit.author,
          });
        }
      }

      return stats;
    } catch (error) {
      console.error("Error fetching commit stats:", error.message);
      return null;
    }
  }

  /**
   * Get file tree depth for project structure analysis
   */
  async getProjectStructure(owner, repo, path = "", depth = 0, maxDepth = 2) {
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
          size: item.size || 0,
        };

        if (item.type === "dir" && depth < maxDepth) {
          entry.children = await this.getProjectStructure(
            owner,
            repo,
            item.path,
            depth + 1,
            maxDepth
          );
        }

        structure.push(entry);
      }

      return structure;
    } catch (error) {
      console.error("Error fetching project structure:", error.message);
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
        console.log("⚠️ No contributions data from GraphQL");
        return null;
      }

      // Flatten the days from weeks
      const allDays = collection.contributionCalendar.weeks.flatMap(
        (w) => w.contributionDays
      );

      // Calculate streak using a Map for O(1) lookups
      let streak = 0;
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      // Create a map of date -> contribution count for fast lookup
      const contributionMap = new Map();
      allDays.forEach((day) => {
        contributionMap.set(day.date, day.contributionCount);
      });

      console.log(
        `📊 Contribution data: ${allDays.length} days, ${allDays.filter((d) => d.contributionCount > 0).length
        } with contributions`
      );
      console.log(
        `📅 Today (${today}): ${contributionMap.get(today) || 0} contributions`
      );
      console.log(
        `📅 Yesterday (${yesterday}): ${contributionMap.get(yesterday) || 0
        } contributions`
      );

      // Determine starting point - check recent activity more robustly
      const todayContributions = contributionMap.get(today) || 0;
      const yesterdayContributions = contributionMap.get(yesterday) || 0;

      // Also check local time "today" and "yesterday" just in case of timezone shift
      const local = new Date();
      const localToday = local.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      local.setDate(local.getDate() - 1);
      const localYesterday = local.toLocaleDateString('en-CA');

      const localTodayContributions = contributionMap.get(localToday) || 0;
      const localYesterdayContributions = contributionMap.get(localYesterday) || 0;

      // If we have contributions today (UTC or Local) or yesterday (UTC or Local), streak is alive/active
      const hasActivity = todayContributions > 0 || yesterdayContributions > 0 || localTodayContributions > 0 || localYesterdayContributions > 0;

      if (!hasActivity) {
        console.log("⚠️ No recent contributions found - streak is 0");
        streak = 0;
      } else {
        // Start counting!
        // We need to find the "start date" for the streak. 
        // If today has contributions, start today. Else start yesterday.
        let checkDate = new Date(); // Start with current time

        // Adjust checkDate to point to the most recent active day
        if (todayContributions > 0) {
          // checkDate is already today
        } else if (localTodayContributions > 0) {
          // Use local today
          // No adjustment needed to checkDate object since it represents "now", but we'll use checkStr carefully
        } else {
          // No contributions today, start checking from yesterday
          checkDate.setDate(checkDate.getDate() - 1);
        }

        console.log("🔄 Starting streak check backwards...");

        // Count backwards day by day
        while (true) {
          const checkStr = checkDate.toISOString().split("T")[0]; // UTC date string
          // Also check if this matches local date string which might be different
          const checkStrLocal = checkDate.toLocaleDateString('en-CA');

          const contributionsUTC = contributionMap.get(checkStr) || 0;
          const contributionsLocal = contributionMap.get(checkStrLocal) || 0;

          if (contributionsUTC > 0 || contributionsLocal > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            // Check if we are "in between" days due to timezone?
            // If we just started and found 0, but we verified `hasActivity` is true, 
            // it means we might be looking at the wrong specific "today" date string.
            // However, strictly speaking, a gap of a full day means broken streak.

            // One edge case: User contributed "yesterday" local time, but it's "today" UTC?
            // The map keys are from GitHub which are YYYY-MM-DD.
            // Let's rely on the fact that if we found a gap, we stop.
            // But give it ONE chance if it's the very first filtered day? No, `hasActivity` check handles start.

            console.log(`🛑 Streak broken at ${checkStr} / ${checkStrLocal} (0 contributions)`);
            break;
          }

          // Safety check: don't go back more than available data
          if (checkDate < new Date(Date.now() - (days + 2) * 86400000)) {
            break;
          }
        }
      }

      console.log(`✅ GraphQL contributions for ${username}:`, {
        totalCommits: collection.totalCommitContributions,
        totalPRs: collection.totalPullRequestContributions,
        totalIssues: collection.totalIssueContributions,
        streak,
        daysWithActivity: allDays.filter((d) => d.contributionCount > 0).length,
        dateRange: `${allDays[allDays.length - 1]?.date} to ${allDays[0]?.date
          }`,
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
      console.error("Error fetching contributions via GraphQL:", error.message);
      return null;
    }
  }

  /**
   * Get comprehensive GitHub insights for bento grid
   */
  async getGitHubInsights(username) {
    try {
      const query = `
                query($username: String!) {
                    user(login: $username) {
                        name
                        login
                        avatarUrl
                        bio
                        createdAt
                        followers { totalCount }
                        following { totalCount }
                        repositories(first: 100, ownerAffiliations: OWNER) {
                            totalCount
                            nodes {
                                isPrivate
                                isFork
                                stargazerCount
                                forkCount
                                languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
                                    edges {
                                        size
                                        node {
                                            name
                                            color
                                        }
                                    }
                                }
                            }
                        }
                        contributionsCollection {
                            totalCommitContributions
                            totalPullRequestContributions
                            totalIssueContributions
                            totalRepositoriesWithContributedCommits
                            totalPullRequestReviewContributions
                            contributionCalendar {
                                totalContributions
                            }
                        }
                        issues(states: CLOSED, first: 1) {
                            totalCount
                        }
                        pullRequests(states: MERGED, first: 1) {
                            totalCount
                        }
                        starredRepositories {
                            totalCount
                        }
                        watching {
                            totalCount
                        }
                    }
                }
            `;

      const response = await this.octokit.graphql(query, { username });
      const user = response.user;

      if (!user) return null;

      // Calculate total stars across user's repos
      const totalStars = user.repositories.nodes.reduce(
        (sum, repo) => sum + repo.stargazerCount,
        0
      );
      const totalForks = user.repositories.nodes.reduce(
        (sum, repo) => sum + repo.forkCount,
        0
      );
      const publicRepos = user.repositories.nodes.filter(
        (r) => !r.isPrivate
      ).length;
      const privateRepos = user.repositories.nodes.filter(
        (r) => r.isPrivate
      ).length;
      const sourceRepos = user.repositories.nodes.filter(
        (r) => !r.isFork
      ).length;

      // Aggregate languages
      const languageMap = {};
      user.repositories.nodes.forEach((repo) => {
        repo.languages.edges.forEach((edge) => {
          const name = edge.node.name;
          languageMap[name] = (languageMap[name] || 0) + edge.size;
        });
      });

      const totalBytes = Object.values(languageMap).reduce((a, b) => a + b, 0);
      const topLanguages = Object.entries(languageMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, size]) => ({
          name,
          size,
          percentage:
            totalBytes > 0 ? Math.round((size / totalBytes) * 100) : 0,
        }));

      // Calculate Grade/Rank (S, A, B, C)
      // Logic: based on commits, stars, followers, and PRs
      const commits = user.contributionsCollection.totalCommitContributions;
      const prs = user.pullRequests.totalCount;
      const reviews =
        user.contributionsCollection.totalPullRequestReviewContributions;
      const issuesSolved = user.issues.totalCount;
      const followers = user.followers.totalCount;

      const score =
        commits * 0.5 +
        prs * 2 +
        reviews * 1.5 +
        issuesSolved * 1 +
        totalStars * 5 +
        followers * 2;

      let grade = "C";
      if (score > 1000) grade = "S+";
      else if (score > 500) grade = "S";
      else if (score > 200) grade = "A";
      else if (score > 100) grade = "B";

      return {
        profile: {
          name: user.name,
          username: user.login,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          createdAt: user.createdAt,
          followers: user.followers.totalCount,
          following: user.following.totalCount,
        },
        stats: {
          totalRepos: user.repositories.totalCount,
          publicRepos,
          privateRepos,
          sourceRepos,
          totalStars,
          totalForks,
          totalCommits: commits,
          totalPRs: prs,
          totalReviews: reviews,
          totalIssuesSolved: issuesSolved,
          totalStarred: user.starredRepositories.totalCount,
          totalWatching: user.watching.totalCount,
          totalContributions:
            user.contributionsCollection.contributionCalendar
              .totalContributions,
        },
        rank: {
          score,
          grade,
          level: Math.floor(Math.sqrt(score / 10)) + 1,
        },
        languages: topLanguages,
        badges: this.calculateBadges(user, score),
      };
    } catch (error) {
      console.error("Error fetching GitHub insights:", error.message);
      throw error;
    }
  }

  /**
   * Calculate badges based on user milestones
   */
  calculateBadges(user, score) {
    const badges = [];
    const stats = user.contributionsCollection;

    if (stats.totalCommitContributions > 100)
      badges.push({
        id: "century_committer",
        name: "Century Committer",
        icon: "🏆",
      });
    if (user.pullRequests.totalCount > 10)
      badges.push({ id: "pr_master", name: "PR Master", icon: "🚢" });
    if (user.followers.totalCount > 50)
      badges.push({
        id: "community_leader",
        name: "Community Leader",
        icon: "🌟",
      });
    if (score > 500)
      badges.push({ id: "octo_ninja", name: "Octo Ninja", icon: "🥷" });

    return badges;
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
          .filter((d) => d.contributionCount > 0)
          .map((d) => ({
            date: d.date + "T12:00:00Z",
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
      console.log("GraphQL failed, falling back to REST:", err.message);
    }

    // Fallback to REST API
    const since = new Date();
    since.setDate(since.getDate() - days);

    try {
      const { data: events } =
        await this.octokit.rest.activity.listPublicEventsForUser({
          username,
          per_page: 100,
        });

      const commits = [];

      for (const event of events) {
        if (event.type === "PushEvent" && event.payload.commits) {
          for (const commit of event.payload.commits) {
            commits.push({
              sha: commit.sha.substring(0, 7),
              message: commit.message.split("\n")[0],
              repo: event.repo.name,
              date: event.created_at,
              url: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
            });
          }
        }
      }

      const filteredCommits = commits.filter((c) => new Date(c.date) >= since);

      return { commits: filteredCommits.slice(0, 50), streak: 0 };
    } catch (error) {
      console.error("Error fetching commits:", error.message);
      return { commits: [], streak: 0 };
    }
  }

  /**
   * Get user's contribution activity summary
   * Only includes events from the last 7 days for weekly report accuracy
   * Includes private repos and fetches accurate repo metadata from GitHub API
   */
  async getActivitySummary(username) {
    try {
      // Use authenticated events API to include private repos
      const { data: events } =
        await this.octokit.rest.activity.listEventsForAuthenticatedUser({
          username,
          per_page: 100,
        });

      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const summary = {
        totalEvents: 0, // Now counts only this week's events
        todayEvents: 0,
        pushEvents: 0,
        prEvents: 0,
        issueEvents: 0,
        reposWorkedOn: new Map(), // Map to store repo names temporarily
      };

      for (const event of events) {
        const eventDate = new Date(event.created_at);

        // Skip events older than 7 days
        if (eventDate < weekAgo) {
          continue;
        }

        summary.totalEvents++;

        if (eventDate >= today) {
          summary.todayEvents++;
        }

        switch (event.type) {
          case "PushEvent":
            summary.pushEvents++;
            // Track repo name for Active Repositories
            const repoFullName = event.repo.name; // e.g., "owner/repo"

            // Skip profile repository (username/username)
            if (repoFullName.toLowerCase() === `${username}/${username}`.toLowerCase()) {
              continue;
            }

            if (!summary.reposWorkedOn.has(repoFullName)) {
              summary.reposWorkedOn.set(repoFullName, {
                name: repoFullName,
                commitsThisWeek: event.payload?.commits?.length || 1,
              });
            } else {
              // Increment commit count
              const existing = summary.reposWorkedOn.get(repoFullName);
              existing.commitsThisWeek += event.payload?.commits?.length || 1;
            }
            break;
          case "PullRequestEvent":
            summary.prEvents++;
            break;
          case "IssuesEvent":
            summary.issueEvents++;
            break;
        }
      }

      // Fetch accurate repo details from GitHub API for each repo
      const repoNames = Array.from(summary.reposWorkedOn.keys());
      const reposWithDetails = [];

      for (const repoFullName of repoNames.slice(0, 6)) { // Limit to 6 repos for performance
        try {
          const [owner, repo] = repoFullName.split('/');
          const { data: repoData } = await this.octokit.rest.repos.get({
            owner,
            repo,
          });

          const repoInfo = summary.reposWorkedOn.get(repoFullName);
          reposWithDetails.push({
            name: repoFullName,
            shortName: repo,
            isPrivate: repoData.private,
            isOwner: repoData.owner.login.toLowerCase() === username.toLowerCase(),
            language: repoData.language || null,
            stars: repoData.stargazers_count || 0,
            commitsThisWeek: repoInfo.commitsThisWeek,
            description: repoData.description || null,
          });
        } catch (repoError) {
          // If we can't fetch repo details, use basic info from event
          console.warn(`Could not fetch details for ${repoFullName}:`, repoError.message);
          const [repoOwner, repoName] = repoFullName.split('/');
          const repoInfo = summary.reposWorkedOn.get(repoFullName);
          reposWithDetails.push({
            name: repoFullName,
            shortName: repoName,
            isPrivate: false, // Default to public if we can't determine
            isOwner: repoOwner.toLowerCase() === username.toLowerCase(),
            language: null,
            stars: 0,
            commitsThisWeek: repoInfo.commitsThisWeek,
            description: null,
          });
        }
      }

      return {
        totalEvents: summary.totalEvents,
        todayEvents: summary.todayEvents,
        pushEvents: summary.pushEvents,
        prEvents: summary.prEvents,
        issueEvents: summary.issueEvents,
        reposWorkedOn: reposWithDetails, // Array of objects with accurate metadata
        reposCount: reposWithDetails.length,
      };
    } catch (error) {
      console.error("Error fetching activity summary:", error.message);
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
      const { data: languagesData } =
        await this.octokit.rest.repos.listLanguages({
          owner,
          repo,
        });

      const totalBytes = Object.values(languagesData).reduce(
        (a, b) => a + b,
        0
      );

      if (totalBytes === 0) return [];

      return Object.entries(languagesData)
        .map(([name, bytes]) => ({
          name,
          bytes,
          percentage: Math.round((bytes / totalBytes) * 100),
        }))
        .sort((a, b) => b.percentage - a.percentage);
    } catch (error) {
      console.error("Error fetching repo languages:", error.message);
      return [];
    }
  }

  /**
   * Get top contributed repositories using GraphQL
   * Returns projects sorted by the user's commit contribution count
   */
  async getTopContributedRepos(username, limit = 5) {
    try {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              commitContributionsByRepository(maxRepositories: 100) {
                repository {
                  name
                  nameWithOwner
                  description
                  url
                  isPrivate
                  stargazerCount
                  primaryLanguage {
                    name
                    color
                  }
                  issues(states: OPEN) {
                    totalCount
                  }
                  owner {
                    login
                  }
                }
                contributions {
                  totalCount
                }
              }
            }
          }
        }
      `;

      const response = await this.octokit.graphql(query, { username });

      const contributions =
        response.user?.contributionsCollection
          ?.commitContributionsByRepository || [];

      // Map and sort by contribution count
      const sortedRepos = contributions
        .map((item) => ({
          name: item.repository.name,
          fullName: item.repository.nameWithOwner,
          description: item.repository.description,
          url: item.repository.url,
          isPrivate: item.repository.isPrivate,
          stars: item.repository.stargazerCount,
          language: item.repository.primaryLanguage?.name,
          languageColor: item.repository.primaryLanguage?.color,
          open_issues_count: item.repository.issues.totalCount,
          contributionCount: item.contributions.totalCount,
          owner: item.repository.owner.login,
        }))
        .sort((a, b) => b.contributionCount - a.contributionCount)
        .slice(0, limit);

      console.log(
        `📊 Found ${sortedRepos.length} top contributed repos for ${username}`
      );

      // Filter out the profile repository (e.g. username/username)
      const filteredRepos = sortedRepos.filter(
        (repo) => repo.name.toLowerCase() !== username.toLowerCase()
      );

      return filteredRepos;
    } catch (error) {
      console.error("Error fetching top contributed repos:", error.message);
      return []; // Return empty array to allow fallback
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
        commitStats,
        trueCommitCount,
        cloneData,
        viewData,
      ] = await Promise.all([
        this.octokit.rest.repos.get({ owner, repo }).then((r) => r.data),
        this.getAllCommitsForRepo(owner, repo, 100),
        this.getOpenPullRequests(owner, repo),
        this.getOpenIssues(owner, repo),
        this.getRepoContents(owner, repo),
        this.getReadme(owner, repo),
        this.octokit.rest.repos
          .listLanguages({ owner, repo })
          .then((r) => r.data),
        this.getKeyFileContents(owner, repo),
        this.getCommitStats(owner, repo, 30),
        this.getTrueCommitCount(owner, repo),
        this.getRepoClones(owner, repo),
        this.getRepoViews(owner, repo),
      ]);

      // Process languages
      const totalBytes = Object.values(languagesData).reduce(
        (a, b) => a + b,
        0
      );
      const languages = Object.entries(languagesData).map(([name, bytes]) => ({
        name,
        bytes,
        percentage: Math.round((bytes / totalBytes) * 100),
      }));

      // Calculate commit frequency (commits per week)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentCommits = commits.filter(
        (c) => new Date(c.date) > oneWeekAgo
      );

      // Use true commit count if available, otherwise fall back to fetched count
      const actualTotalCommits = trueCommitCount || commits.length;

      console.log(
        `✅ Fetched: ${actualTotalCommits} total commits (${commits.length
        } details), ${pullRequests.length} PRs, ${issues.length} issues, ${Object.keys(keyFiles).length
        } key files`
      );

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
        clones: cloneData.totalClones || 0,
        uniqueClones: cloneData.uniqueClones || 0,
        views: viewData.totalViews || 0,
        uniqueViews: viewData.uniqueViews || 0,
        cloneHistory: cloneData.cloneDays || [],
        viewHistory: viewData.viewDays || [],
        trafficRestricted: cloneData.restricted || viewData.restricted || false,

        // Dates
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,

        // Languages
        languages,
        primaryLanguage: repoData.language,

        // Activity data - USE ACCURATE COUNT
        totalCommits: actualTotalCommits,
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
      console.error("Error fetching complete repo info:", error.message);
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
   * Get clone traffic for a repository
   * Requires push access to the repository
   */
  async getRepoClones(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.getClones({
        owner,
        repo,
        per: "day",
      });
      return {
        totalClones: data.count,
        uniqueClones: data.uniques,
        cloneDays: data.clones,
        restricted: false,
      };
    } catch (error) {
      const isRestricted = error.message.includes("push access") || error.status === 403;
      console.warn(
        `Could not fetch clone data for ${owner}/${repo}:`,
        error.message
      );
      return { totalClones: 0, uniqueClones: 0, cloneDays: [], restricted: isRestricted };
    }
  }

  /**
   * Get view traffic (visitors) for a repository
   * Requires push access to the repository
   */
  async getRepoViews(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.getViews({
        owner,
        repo,
        per: "day",
      });
      return {
        totalViews: data.count,
        uniqueViews: data.uniques,
        viewDays: data.views,
        restricted: false,
      };
    } catch (error) {
      const isRestricted = error.message.includes("push access") || error.status === 403;
      console.warn(
        `Could not fetch view data for ${owner}/${repo}:`,
        error.message
      );
      return { totalViews: 0, uniqueViews: 0, viewDays: [], restricted: isRestricted };
    }
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
          repo: match[2].replace(/\.git$/, ""),
        };
      }
    }
    return null;
  }

  /**
   * Search for similar open-source projects on GitHub
   * @param {string[]} languages - Array of programming languages to search for
   * @param {string[]} topics - Array of topics/keywords to search for
   * @param {number} minStars - Minimum number of stars (default: 50)
   * @param {number} perPage - Number of results to return (default: 12)
   */
  async searchSimilarProjects(
    languages = [],
    topics = [],
    minStars = 50,
    perPage = 12
  ) {
    try {
      // Build the search query
      const queryParts = [];

      // Add language filters
      if (languages.length > 0) {
        // Use the top 3 languages
        const topLangs = languages.slice(0, 3);
        topLangs.forEach((lang) => {
          queryParts.push(`language:${lang}`);
        });
      }

      // Add topic/keyword filters
      if (topics.length > 0) {
        topics.slice(0, 5).forEach((topic) => {
          queryParts.push(topic);
        });
      }

      // Add star filter for quality repos
      queryParts.push(`stars:>=${minStars}`);

      // Only search public repos
      queryParts.push("is:public");

      // Exclude forks
      queryParts.push("fork:false");

      const searchQuery = queryParts.join(" ");
      console.log(`🔍 Searching GitHub for: ${searchQuery}`);

      const { data } = await this.octokit.rest.search.repos({
        q: searchQuery,
        sort: "stars",
        order: "desc",
        per_page: 50, // Fetch more to shuffle
      });

      console.log(
        `✅ Found ${data.total_count} repos, returning top ${data.items.length}`
      );

      // Shuffle the results to make it dynamic
      const shuffled = data.items.sort(() => 0.5 - Math.random());

      // Return only the requested number of items
      const selectedRepos = shuffled.slice(0, perPage);

      return {
        totalCount: data.total_count,
        repos: selectedRepos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          topics: repo.topics || [],
          updatedAt: repo.updated_at,
          owner: {
            login: repo.owner.login,
            avatarUrl: repo.owner.avatar_url,
          },
        })),
      };
    } catch (error) {
      console.error("Error searching similar projects:", error.message);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FILE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Create or update a file in a repository
   * Uses GitHub Contents API: PUT /repos/{owner}/{repo}/contents/{path}
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} path - File path in the repository (e.g., 'README.md')
   * @param {string} content - File content (will be base64 encoded)
   * @param {string} message - Commit message
   * @param {string} branch - Branch name (default: 'main')
   * @returns {object} - Commit information
   */
  async commitFile(owner, repo, path, content, message, branch = "main") {
    try {
      console.log(
        `📝 Committing ${path} to ${owner}/${repo} on branch ${branch}...`
      );

      // First, check if file already exists to get its SHA (required for updates)
      let sha = null;
      try {
        const { data: existingFile } = await this.octokit.rest.repos.getContent(
          {
            owner,
            repo,
            path,
            ref: branch,
          }
        );
        sha = existingFile.sha;
        console.log(
          `📄 File exists, will update (SHA: ${sha.substring(0, 7)})`
        );
      } catch (error) {
        if (error.status === 404) {
          console.log(`📄 File doesn't exist, will create new`);
        } else {
          throw error;
        }
      }

      // Base64 encode the content
      const contentBase64 = Buffer.from(content, "utf-8").toString("base64");

      // Create or update the file
      const requestData = {
        owner,
        repo,
        path,
        message,
        content: contentBase64,
        branch,
      };

      // Include SHA if updating existing file
      if (sha) {
        requestData.sha = sha;
      }

      const { data: result } =
        await this.octokit.rest.repos.createOrUpdateFileContents(requestData);

      console.log(`✅ Successfully committed ${path}`);
      console.log(
        `   Commit: ${result.commit.sha.substring(0, 7)} - ${result.commit.message
        }`
      );

      return {
        success: true,
        commit: {
          sha: result.commit.sha,
          message: result.commit.message,
          url: result.commit.html_url,
        },
        content: {
          path: result.content.path,
          sha: result.content.sha,
          url: result.content.html_url,
        },
      };
    } catch (error) {
      console.error(`❌ Error committing file ${path}:`, error.message);

      // Provide helpful error messages
      if (error.status === 404) {
        throw new Error("Repository not found or you do not have access");
      } else if (error.status === 403) {
        throw new Error(
          "You do not have permission to push to this repository"
        );
      } else if (error.status === 409) {
        throw new Error("Conflict: The file was modified. Please try again.");
      } else if (error.status === 422) {
        throw new Error(
          "Invalid request: Branch may not exist or file path is invalid"
        );
      }

      throw error;
    }
  }
}

module.exports = GitHubService;
