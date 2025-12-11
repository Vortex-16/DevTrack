/**
 * Groq AI Service
 * Handles AI interactions using Groq API (Llama 3.1 70B)
 */

class GroqService {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            console.warn('⚠️ GROQ_API_KEY not found in environment variables. AI features will fail.');
        }

        this.apiKey = process.env.GROQ_API_KEY;
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama-3.3-70b-versatile';

        // System prompt for developer-focused assistance
        this.systemPrompt = `You are DevTrack AI Assistant, a helpful coding mentor integrated into a developer consistency tracking platform.

Your role is to:
1. Help developers with coding questions and debugging
2. Explain programming concepts clearly
3. Provide best practices and code reviews
4. Suggest learning resources and next steps
5. Motivate and encourage consistent learning habits

Guidelines:
- Be concise but thorough
- Use code examples when helpful
- Format responses with markdown for readability
- Be encouraging and supportive
- Focus on practical, actionable advice`;
    }

    /**
     * Make a request to Groq API
     * @param {Array} messages - Array of message objects {role, content}
     * @param {Object} options - Additional options (json_mode, etc.)
     */
    async makeRequest(messages, options = {}) {
        try {
            const body = {
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: options.max_tokens || 2048,
            };

            if (options.jsonMode) {
                body.response_format = { type: "json_object" };
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Groq Service Error:', error);
            throw error;
        }
    }

    /**
     * Generate a chat response
     * @param {string} userMessage - The user's question
     * @param {string} context - Optional context
     */
    async chat(userMessage, context = '') {
        try {
            const messages = [
                { role: "system", content: this.systemPrompt },
            ];

            if (context) {
                messages.push({ role: "system", content: `Context about what the user is working on:\n${context}` });
            }

            messages.push({ role: "user", content: userMessage });

            const responseText = await this.makeRequest(messages);

            return {
                success: true,
                message: responseText,
                model: this.model
            };

        } catch (error) {
            console.error('Chat error:', error);
            return {
                success: false,
                error: 'AI assistant is currently unavailable. Please check your connection or API key.',
                details: error.message
            };
        }
    }

    /**
     * Analyze project progress with comprehensive output
     * @param {object} repoInfo - Complete repository information from GitHub
     */
    async analyzeProjectProgress(repoInfo) {
        const prompt = `You are a DevTrack project analyzer. Analyze this GitHub repository data and provide a comprehensive progress report.

REPOSITORY DATA:
- Name: ${repoInfo.name}
- Description: ${repoInfo.description || 'No description'}
- Primary Language: ${repoInfo.primaryLanguage || 'Unknown'}
- Languages: ${repoInfo.languages?.map(l => `${l.name} (${l.percentage}%)`).join(', ') || 'None'}
- Total Commits: ${repoInfo.totalCommits || 0}
- Commits This Week: ${repoInfo.recentCommitsThisWeek || 0}
- Stars: ${repoInfo.stars || 0}
- Forks: ${repoInfo.forks || 0}
- Open Issues: ${repoInfo.openIssues?.length || 0}
- Open PRs: ${repoInfo.openPullRequests?.length || 0}
- Size: ${repoInfo.size || 0} KB
- Created: ${repoInfo.createdAt || 'Unknown'}
- Last Push: ${repoInfo.pushedAt || 'Unknown'}
- Topics: ${repoInfo.topics?.join(', ') || 'None'}

RECENT COMMITS (last 20):
${repoInfo.commits?.slice(0, 20).map(c => `- ${c.date?.split('T')[0] || 'Unknown'}: ${c.message}`).join('\n') || 'No commits'}

OPEN ISSUES:
${repoInfo.openIssues?.slice(0, 10).map(i => `- #${i.number}: ${i.title}`).join('\n') || 'No open issues'}

OPEN PULL REQUESTS:
${repoInfo.openPullRequests?.slice(0, 5).map(p => `- #${p.number}: ${p.title}`).join('\n') || 'No open PRs'}

DIRECTORY STRUCTURE:
${repoInfo.directoryStructure?.map(d => `- ${d.type === 'dir' ? '📁' : '📄'} ${d.name}`).join('\n') || 'Unknown'}

README EXCERPT:
${repoInfo.readme?.substring(0, 500) || 'No README found'}

---

Provide a detailed analysis in this EXACT JSON format:
{
  "progressSummary": "<2-3 sentence summary of overall project progress>",
  "progressPercentage": <0-100 estimate of project completion>,
  "commitFrequencyScore": <0-100 based on commit activity>,
  "productivityStreaks": {
    "currentStreak": <number of consecutive active days>,
    "assessment": "<brief assessment of coding consistency>"
  },
  "areasOfImprovement": [
    "<specific improvement 1>",
    "<specific improvement 2>",
    "<specific improvement 3>"
  ],
  "nextRecommendedTasks": [
    "<specific task 1 based on open issues/commits>",
    "<specific task 2>",
    "<specific task 3>"
  ],
  "fileAnalysis": [
    {"area": "<folder/area name>", "status": "<active|stale|needs-attention>", "note": "<brief note>"}
  ],
  "trends": "<observation about recent activity patterns>",
  "concerns": "<any red flags or risks identified>"
}`;

        try {
            const messages = [
                { role: "system", content: "You are an expert project analyzer. Always respond with valid JSON only." },
                { role: "user", content: prompt }
            ];

            const jsonResponse = await this.makeRequest(messages, { jsonMode: true, max_tokens: 2000 });
            const parsed = JSON.parse(jsonResponse);

            console.log('✅ AI Project Analysis complete');

            return {
                success: true,
                ...parsed
            };

        } catch (error) {
            console.error('Project analysis error:', error);
            return {
                success: false,
                progressSummary: "Analysis temporarily unavailable",
                progressPercentage: 0,
                commitFrequencyScore: 0,
                areasOfImprovement: [],
                nextRecommendedTasks: [],
                error: error.message
            };
        }
    }

    /**
     * Generate a motivational message
     * @param {object} stats 
     */
    async generateMotivation(stats) {
        const prompt = `Based on this developer's recent activity, generate a short (2-3 sentences) motivational message.
Stats:
- Days active: ${stats.daysActive || 0}
- Commits: ${stats.commits || 0}
- Streak: ${stats.streak || 0} days

Make it personal and encouraging.`;

        try {
            const messages = [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt }
            ];

            return await this.makeRequest(messages, { max_tokens: 150 });
        } catch (error) {
            return "Keep pushing forward! Every line of code counts.";
        }
    }

    /**
     * Review Code
     * @param {string} code 
     * @param {string} language 
     */
    async reviewCode(code, language = 'javascript') {
        const prompt = `Review this ${language} code for bugs, improvements, and best practices. Be concise.

Code:
\`\`\`${language}
${code}
\`\`\``;

        try {
            const messages = [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt }
            ];

            const review = await this.makeRequest(messages);
            return {
                success: true,
                review: review
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export singleton
let instance = null;
const getGroqService = () => {
    if (!instance) {
        instance = new GroqService();
    }
    return instance;
};

module.exports = {
    GroqService,
    getGroqService
};
