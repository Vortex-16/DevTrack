/**
 * Gemini AI Service
 * Handles AI chat interactions using Google Generative AI (Gemini 2.0 Flash)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not found in environment variables');
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Define models to try in order - Prioritize FREE models (2025 Update)
        this.models = [
            { id: 'gemini-2.0-flash-lite-preview', name: 'Gemini 2.0 Flash Lite' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
            { id: 'gemini-1.5-flash-001', name: 'Gemini 1.5 Flash (Legacy)' },
        ];

        // In-memory cache for responses (LRU-style with TTL)
        this.responseCache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.MAX_CACHE_SIZE = 100;

        // Track rate-limited models to skip them temporarily
        this.rateLimitedModels = new Map();
        this.RATE_LIMIT_SKIP_DURATION = 60 * 1000; // Skip for 60 seconds

        // Track in-flight requests to prevent duplicates
        this.inFlightRequests = new Map();

        // System prompt for developer-focused assistance
        this.systemPrompt = `You are DevTrack AI Assistant, a helpful coding mentor integrated into a developer consistency tracking platform.

Identity & Origin:
- You were created by the alpha4coders core team.
- You were developed during the techSprint Hackathon.
- The core team consists of: Vikash, Ayush and Rajdeep.
- If asked "who created you" or similar identity questions, you MUST mention the alpha4coders core team and the specific members: Vikash, Ayush and Rajdeep.

Your role is to:
1. Help developers with coding questions and debugging
2. Explain programming concepts clearly
3. Provide best practices and code reviews
4. Suggest learning resources and next steps
5. Motivate and encourage consistent learning habits

Safety & Guidelines:
- Strictly avoid sensitive topics including politics, adult content, offensive language, or any non-technical controversial subjects.
- If asked about sensitive "chat things", politely redirect to coding and developer assistance.
- Be concise but thorough.
- Use code examples when helpful.
- Format responses with markdown for readability.
- Be encouraging and supportive.
- If you don't know something, say so honestly.
- Focus on practical, actionable advice.

Current context: The current local time is ${new Date().toLocaleString()}.

Remember: You're helping developers build consistent learning habits while they code.`;
    }

    /**
     * Generate a cache key from a prompt
     */
    getCacheKey(prompt) {
        // Normalize prompt for caching (first 200 chars, lowercase, trim)
        return prompt.toLowerCase().trim().substring(0, 200);
    }

    /**
     * Get cached response if available and not expired
     */
    getCachedResponse(prompt) {
        const key = this.getCacheKey(prompt);
        const cached = this.responseCache.get(key);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            console.log('✅ Cache hit - returning cached response');
            return cached;
        }

        if (cached) {
            this.responseCache.delete(key); // Remove expired cache
        }
        return null;
    }

    /**
     * Cache a response
     */
    cacheResponse(prompt, text, model) {
        const key = this.getCacheKey(prompt);

        // Simple LRU: if cache is full, remove oldest entry
        if (this.responseCache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.responseCache.keys().next().value;
            this.responseCache.delete(firstKey);
        }

        this.responseCache.set(key, {
            text,
            model,
            timestamp: Date.now()
        });
    }

    /**
     * Check if a model is currently rate-limited
     */
    isModelRateLimited(modelId) {
        const limitedUntil = this.rateLimitedModels.get(modelId);
        if (limitedUntil && Date.now() < limitedUntil) {
            return true;
        }
        if (limitedUntil) {
            this.rateLimitedModels.delete(modelId); // Clean up expired
        }
        return false;
    }

    /**
     * Mark a model as rate-limited
     */
    markModelRateLimited(modelId) {
        const skipUntil = Date.now() + this.RATE_LIMIT_SKIP_DURATION;
        this.rateLimitedModels.set(modelId, skipUntil);
        console.log(`⏸️ Model ${modelId} marked as rate-limited until ${new Date(skipUntil).toLocaleTimeString()}`);
    }

    /**
     * Try to generate content using available models with fallback
     * @param {string} prompt - The prompt to send
     */
    async generateWithFallback(prompt) {
        // Check cache first
        const cached = this.getCachedResponse(prompt);
        if (cached) {
            return cached;
        }

        // Check for in-flight duplicate request
        const cacheKey = this.getCacheKey(prompt);
        if (this.inFlightRequests.has(cacheKey)) {
            console.log('⏳ Duplicate request detected, waiting for in-flight request...');
            return await this.inFlightRequests.get(cacheKey);
        }

        // Create promise for this request
        const requestPromise = this._executeGeneration(prompt);
        this.inFlightRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            this.inFlightRequests.delete(cacheKey);
        }
    }

    /**
     * Internal method to execute generation with model fallback
     */
    async _executeGeneration(prompt) {
        let lastError = null;

        for (const modelConfig of this.models) {
            // Skip rate-limited models
            if (this.isModelRateLimited(modelConfig.id)) {
                console.log(`⏭️ Skipping rate-limited model: ${modelConfig.id}`);
                continue;
            }

            try {
                console.log(`🚀 Attempting generation with model: ${modelConfig.id}`);
                const model = this.genAI.getGenerativeModel({ model: modelConfig.id });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Cache the successful response
                this.cacheResponse(prompt, text, modelConfig.id);

                return {
                    text,
                    model: modelConfig.id,
                    timestamp: Date.now()
                };
            } catch (error) {
                console.warn(`❌ Model ${modelConfig.id} failed:`, error.message);
                lastError = error;

                // If it's a rate limit error, mark this model as rate-limited
                if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate')) {
                    this.markModelRateLimited(modelConfig.id);
                }

                // If it's a safety violation, don't try other models as they'll likely fail too
                if (error.message.includes('SAFETY')) {
                    throw error;
                }

                // Continue to next model for other errors
            }
        }

        throw lastError || new Error('All models failed');
    }

    /**
     * Generate a chat response
     * @param {string} userMessage - The user's question or message
     * @param {string} context - Optional context about what the user is working on
     */
    async chat(userMessage, context = '') {
        try {
            const lowerMsg = userMessage.toLowerCase();

            // 1. "Who created you" & Greetings Interceptor
            if (/who.*creat|who.*made|your.*creator|who.*built|^hi$|^hello$|^yo$/i.test(lowerMsg)) {
                return {
                    success: true,
                    message: "Hello. I'm DevTrack AI, an elite-tier software engineering expert created by the alpha4coders core team, which includes Vikash, Ayush and Rajdeep.\n\nI see you have multiple projects in progress, including LeetCode solutions, a portfolio website, and several others. How can I assist you today? Do you have a specific coding problem or question you'd like help with, or perhaps you'd like some guidance on one of your ongoing projects?",
                    model: 'custom-identity-handler',
                };
            }

            // 2. Sensitive Topics Filter (Basic keyword check)
            const sensitiveKeywords = ['politics', 'election', 'religion', 'adult', 'nsfw', 'racist', 'hate', 'suicide', 'kill', 'drug'];
            if (sensitiveKeywords.some(keyword => lowerMsg.includes(keyword))) {
                return {
                    success: true,
                    message: "I'm specialized as a coding and developer consistency assistant. I avoid discussing sensitive or controversial topics to stay focused on helping you build great software and maintain your coding streak! 💻✨\n\nHow can I help you with your code today?",
                    model: 'safety-filter',
                };
            }

            const prompt = this.buildPrompt(userMessage, context);
            const result = await this.generateWithFallback(prompt);

            return {
                success: true,
                message: result.text,
                model: result.model,
            };
        } catch (error) {
            console.error('Gemini API error:', error.message);

            // Mock offline response if quota exceeded or other API errors
            const isQuotaError = error.message.includes('quota') || error.message.includes('rate') || error.message.includes('429');

            if (isQuotaError) {
                // Return a friendly "offline" message instead of failing
                return {
                    success: true, // Keep explicit success true so UI doesn't break
                    message: "Creating greatness takes time! 🌟\n\nI'm currently taking a short break to recharge my neural networks (API rate limit reached). Please try again in a few minutes, or continue coding on your own - you've got this!\n\n_System: AI is temporarily unavailable due to high demand. Your quota will reset shortly._",
                    model: 'offline-mode',
                };
            }

            if (error.message.includes('SAFETY')) {
                return {
                    success: false,
                    error: 'Your message was flagged by safety filters. Please rephrase.',
                };
            }

            // Return generic error for other issues
            return {
                success: false,
                error: 'AI assistant is currently unavailable. Please try again later.',
            };
        }
    }

    /**
     * Build the full prompt with system context
     */
    buildPrompt(userMessage, context) {
        let fullPrompt = this.systemPrompt + '\n\n';

        if (context) {
            fullPrompt += `Context about what the user is working on:\n${context}\n\n`;
        }

        fullPrompt += `User's question:\n${userMessage}`;

        return fullPrompt;
    }

    /**
     * Generate a motivational message based on user's activity
     * @param {object} stats - User's activity statistics
     */
    async generateMotivation(stats) {
        const prompt = `${this.systemPrompt}

Based on this developer's recent activity, generate a short (2-3 sentences) motivational message:
- Days active this week: ${stats.daysActive || 0}
- Commits this week: ${stats.commits || 0}
- Current streak: ${stats.streak || 0} days
- Last active: ${stats.lastActive || 'Unknown'}

Make it personal, encouraging, and specific to their progress. Keep it under 100 words.`;

        try {
            const result = await this.generateWithFallback(prompt);
            return result.text;
        } catch (error) {
            console.error('Error generating motivation:', error.message);
            return "Keep up the great work! Every day of consistent coding brings you closer to your goals. 🚀";
        }
    }

    /**
     * Get code review suggestions
     * @param {string} code - Code to review
     * @param {string} language - Programming language
     */
    async reviewCode(code, language = 'javascript') {
        const prompt = `${this.systemPrompt}

Please review this ${language} code and provide:
1. Any bugs or issues
2. Suggestions for improvement
3. Best practices recommendations

Keep the review concise and actionable.

Code:
\`\`\`${language}
${code}
\`\`\``;

        try {
            const result = await this.generateWithFallback(prompt);
            return {
                success: true,
                review: result.text,
            };
        } catch (error) {
            console.error('Error reviewing code:', error.message);
            throw error;
        }
    }
    /**
     * Analyze project progress based on repository data
     * @param {object} repoInfo - Repository information from GitHub
     */
    async analyzeProjectProgress(repoInfo) {
        const prompt = `You are a project progress analyzer. Based on the following GitHub repository data, estimate the project's completion percentage (0-100).

Repository Info:
- Name: ${repoInfo.name}
- Description: ${repoInfo.description || 'No description'}
- Languages: ${repoInfo.languages?.map(l => `${l.name} (${l.percentage}%)`).join(', ') || 'None detected'}
- Total Commits: ${repoInfo.commitCount || 0}
- Stars: ${repoInfo.stars || 0}
- Forks: ${repoInfo.forks || 0}
- Open Issues: ${repoInfo.openIssues || 0}
- Repository Size: ${repoInfo.size || 0} KB
- Created: ${repoInfo.createdAt || 'Unknown'}
- Last Updated: ${repoInfo.updatedAt || 'Unknown'}
- Last Push: ${repoInfo.pushedAt || 'Unknown'}
- Topics/Tags: ${repoInfo.topics?.join(', ') || 'None'}

Consider these factors:
1. Commit frequency and recency
2. Codebase size and language diversity
3. Community engagement (stars, forks)
4. Open issues (too many might indicate incomplete work)
5. Time since creation vs activity level

IMPORTANT: Respond with ONLY a JSON object in this exact format:
{
  "progress": <number 0-100>,
  "reasoning": "<brief explanation>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`;

        try {
            const result = await this.generateWithFallback(prompt);
            const text = result.text;

            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    progress: Math.min(100, Math.max(0, parseInt(parsed.progress) || 0)),
                    reasoning: parsed.reasoning || 'Analysis complete',
                    suggestions: parsed.suggestions || [],
                };
            }

            // Fallback if JSON parsing fails
            return {
                success: true,
                progress: 50,
                reasoning: 'Unable to fully analyze - using default estimate',
                suggestions: ['Add more commits', 'Update documentation'],
            };
        } catch (error) {
            console.error('Error analyzing project:', error.message);
            return {
                success: false,
                progress: 0,
                reasoning: 'Analysis temporarily unavailable (API limits). You can verify manually.',
                suggestions: [],
            };
        }
    }
}

// Export singleton instance
let instance = null;

const getGeminiService = () => {
    if (!instance) {
        instance = new GeminiService();
    }
    return instance;
};

module.exports = {
    GeminiService,
    getGeminiService,
};
