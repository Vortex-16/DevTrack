/**
 * LeetCode Service
 * Fetches user data from LeetCode GraphQL API
 */

class LeetCodeService {
    constructor() {
        this.baseUrl = 'https://leetcode.com/graphql';
    }

    async makeRequest(query, variables) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            if (!response.ok) {
                throw new Error(`LeetCode API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            return data.data;
        } catch (error) {
            console.error('LeetCode request failed:', error);
            throw error;
        }
    }

    async getUserPublicProfile(username) {
        const query = `
            query getUserProfile($username: String!) {
                matchedUser(username: $username) {
                    username
                    githubUrl
                    twitterUrl
                    linkedinUrl
                    profile {
                        realName
                        userAvatar
                        aboutMe
                        ranking
                        reputation
                    }
                    submitStats: submitStatsGlobal {
                        acSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                    }
                }
                userContestRanking(username: $username) {
                    rating
                    globalRanking
                    topPercentage
                    attendedContestsCount
                }
            }
        `;

        const data = await this.makeRequest(query, { username });
        if (!data.matchedUser) {
            throw new Error('User not found on LeetCode');
        }
        return data;
    }

    async getRecentSubmissions(username) {
        const query = `
            query getRecentSubmissions($username: String!, $limit: Int!) {
                recentAcSubmissionList(username: $username, limit: $limit) {
                    id
                    title
                    titleSlug
                    timestamp
                }
            }
        `;

        return await this.makeRequest(query, { username, limit: 10 });
    }
}

module.exports = new LeetCodeService();
