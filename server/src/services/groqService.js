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

        // System prompt for specialized coding assistance
        this.systemPrompt = `You are DevTrack AI Assistant, a helpful coding mentor.

Identity & Origin:
- You were created by the alpha4coders core team.
- You were developed during the techSprint Hackathon.
- The core team consists of: Vikash, Ayush, Rajdeep & Rajbeer.
- If asked "who created you" or similar identity questions, you MUST mention the alpha4coders core team and the specific members: Vikash, Ayush, Rajdeep & Rajbeer.

Your expertise is strictly limited to software development, programming, system architecture, and technical debugging.

Safety & Guidelines:
1. Provide precise, production-grade code solutions and debugging help.
2. Explain complex computer science concepts clearly.
3. Review code for bugs, efficiency, and security vulnerabilities.
4. Focus exclusively on technical implementation.
5. Strictly avoid sensitive topics including politics, adult content, or any non-technical controversial subjects.

Guidelines:
- ALWAYS prioritize correctness and performance.
- Be concise. Use modern syntax and patterns.
- Format all code blocks with appropriate language tags.
- If a question is not related to coding or technology, politely steer the conversation back to development.`;
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
     * @param {Array} history - Optional previous messages
     */
    async chat(userMessage, context = '', history = []) {
        try {
            const lowerMsg = userMessage.toLowerCase();

            // Identity Interceptor (Robust check)
            if (/who.*creat|who.*made|your.*creator|who.*built/i.test(lowerMsg)) {
                return {
                    success: true,
                    message: "I was created by the **alpha4coders core team** in the **techSprint Hackathon** by the group of **Vikash, Ayush, Rajdeep & Rajbeer**. 🚀",
                    model: 'custom-identity-handler',
                };
            }

            // Safety Filter
            const sensitiveKeywords = ['politics', 'election', 'religion', 'adult', 'nsfw', 'racist', 'hate', 'suicide', 'kill', 'drug'];
            if (sensitiveKeywords.some(keyword => lowerMsg.includes(keyword))) {
                return {
                    success: true,
                    message: "I'm specialized as a coding and developer consistency assistant. I avoid discussing sensitive or controversial topics to stay focused on helping you build great software! 💻✨",
                    model: 'safety-filter',
                };
            }

            const messages = [
                { role: "system", content: this.systemPrompt },
            ];

            // Add history if provided
            if (history && history.length > 0) {
                history.forEach(msg => {
                    messages.push({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    });
                });
            }

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
        // Format key files for the prompt
        const keyFilesSection = repoInfo.keyFiles && Object.keys(repoInfo.keyFiles).length > 0
            ? Object.entries(repoInfo.keyFiles)
                .map(([filename, content]) => `### ${filename}\n\`\`\`\n${content.substring(0, 800)}\n\`\`\``)
                .join('\n\n')
            : 'No key configuration files found';

        // Format commit patterns
        const commitPatternSection = repoInfo.commitStats?.commitPatterns
            ? `
- Feature commits: ${repoInfo.commitStats.commitPatterns.features}
- Bug fix commits: ${repoInfo.commitStats.commitPatterns.fixes}
- Documentation commits: ${repoInfo.commitStats.commitPatterns.docs}
- Refactoring commits: ${repoInfo.commitStats.commitPatterns.refactors}
- Test commits: ${repoInfo.commitStats.commitPatterns.tests}
- Other commits: ${repoInfo.commitStats.commitPatterns.other}`
            : 'Commit pattern analysis not available';

        const prompt = `You are a DevTrack project analyzer. Analyze this GitHub repository data and provide a comprehensive progress report.

IMPORTANT: Progress percentage should be calculated based on:
1. Code structure completeness (folders, files, organization)
2. Feature implementation evidence from commits
3. Documentation quality (README completeness)
4. Test coverage indicators
5. Configuration maturity (env files, docker, CI/CD)
6. Open issues vs resolved patterns
DO NOT base progress solely on commit count!

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
- Is Private: ${repoInfo.isPrivate ? 'Yes' : 'No'}

COMMIT ANALYSIS:
${commitPatternSection}

RECENT COMMITS (analyzing work done):
${repoInfo.commits?.slice(0, 25).map(c => `- ${c.date?.split('T')[0] || 'Unknown'}: ${c.message}`).join('\n') || 'No commits'}

OPEN ISSUES (remaining work):
${repoInfo.openIssues?.slice(0, 10).map(i => `- #${i.number}: ${i.title} [${i.labels.join(', ') || 'no labels'}]`).join('\n') || 'No open issues'}

OPEN PULL REQUESTS (work in progress):
${repoInfo.openPullRequests?.slice(0, 5).map(p => `- #${p.number}: ${p.title}`).join('\n') || 'No open PRs'}

DIRECTORY STRUCTURE:
${repoInfo.directoryStructure?.map(d => `- ${d.type === 'dir' ? '📁' : '📄'} ${d.name}${d.type === 'dir' ? '/' : ''}`).join('\n') || 'Unknown'}

KEY PROJECT FILES (actual code/config):
${keyFilesSection}

README EXCERPT:
${repoInfo.readme?.substring(0, 800) || 'No README found'}

---

Based on the ACTUAL CODE and COMMITS above (not just commit count), provide analysis in this EXACT JSON format:
{
  "progressSummary": "<2-3 sentence summary explaining WHAT has been built and what remains>",
  "progressPercentage": <0-100 based on actual features implemented vs project scope>,
  "commitFrequencyScore": <0-100 based on commit regularity and quality>,
  "productivityStreaks": {
    "currentStreak": <estimated consecutive active days>,
    "assessment": "<brief assessment of coding consistency>"
  },
  "areasOfImprovement": [
    "<specific improvement 1 based on code analysis>",
    "<specific improvement 2>",
    "<specific improvement 3>"
  ],
  "nextRecommendedTasks": [
    "<specific actionable task 1 based on open issues/code gaps>",
    "<specific task 2>",
    "<specific task 3>"
  ],
  "fileAnalysis": [
    {"area": "<folder/area name>", "status": "<active|stale|needs-attention>", "note": "<brief note>"}
  ],
  "codeQuality": {
    "hasTests": <true|false based on evidence>,
    "hasDocumentation": <true|false>,
    "hasCI": <true|false>,
    "configurationMaturity": "<basic|intermediate|advanced>"
  },
  "trends": "<observation about recent activity patterns from commit dates>",
  "concerns": "<any red flags or risks identified from code/commits>"
}`;

        try {
            const messages = [
                { role: "system", content: "You are an expert project analyzer. Analyze the actual code and commits to determine real progress. Always respond with valid JSON only." },
                { role: "user", content: prompt }
            ];

            const jsonResponse = await this.makeRequest(messages, { jsonMode: true, max_tokens: 2500 });
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
