/**
 * AI Controller (Groq-powered)
 * Handles AI chat and assistance features using Groq Service
 */

const { getGroqService } = require('../services/groqService');
const { APIError } = require('../middleware/errorHandler');
const { collections, getFirestore } = require('../config/firebase');

/**
 * Chat with AI
 * POST /api/gemini/chat
 */
const chat = async (req, res, next) => {
    try {
        const { message, context } = req.body;
        const userId = req.auth?.userId;

        console.log('Chat request received:', { message: message?.substring(0, 50), hasContext: !!context });

        if (!message || message.trim().length === 0) {
            throw new APIError('Message is required', 400);
        }

        const groqService = getGroqService();

        // Fetch recent history for context (last 5 rounds of conversation)
        let history = [];
        let memorySummary = '';
        if (userId) {
            try {
                // Fetch chat history
                const historySnapshot = await collections.users()
                    .doc(userId)
                    .collection('chatHistory')
                    .orderBy('timestamp', 'desc')
                    .limit(10)
                    .get();

                history = historySnapshot.docs
                    .map(doc => doc.data())
                    .reverse(); // Chronological order

                // Fetch memory summary for persistent context
                const userDoc = await collections.users().doc(userId).get();
                memorySummary = userDoc.data()?.memorySummary || '';
            } catch (historyFetchError) {
                console.error('Failed to fetch history for context:', historyFetchError);
            }
        }

        // Build enhanced context with memory summary
        let enhancedContext = context || '';
        if (memorySummary) {
            console.log('📝 Memory summary found for user:', memorySummary.substring(0, 100) + '...');
            enhancedContext = `## 🧠 Memory (What you know about this user from previous conversations):\n${memorySummary}\n\n---\n\n${enhancedContext}`;
        } else {
            console.log('📝 No memory summary found for user');
        }

        const response = await groqService.chat(message, enhancedContext, history);

        console.log('AI response:', { success: response.success, hasMessage: !!response.message });

        const aiMessage = response.success ? response.message : (response.error || 'AI request failed. Please try again.');

        // Save history if user is authenticated
        if (userId && response.success) {
            try {
                const historyRef = collections.users().doc(userId).collection('chatHistory');

                // Save user message
                await historyRef.add({
                    role: 'user',
                    content: message,
                    timestamp: new Date(),
                });

                // Save AI message
                await historyRef.add({
                    role: 'assistant',
                    content: aiMessage,
                    timestamp: new Date(),
                });
            } catch (historyError) {
                console.error('Failed to save chat history:', historyError);
            }
        }

        // Return the AI message or error message
        res.status(200).json({
            success: response.success,
            data: {
                message: aiMessage,
                model: 'DevTrack AI',
            },
        });
    } catch (error) {
        console.error('Chat error:', error);
        next(error);
    }
};

/**
 * Get motivational message based on user activity
 * POST /api/gemini/motivation
 */
const getMotivation = async (req, res, next) => {
    try {
        const stats = req.body;

        const groqService = getGroqService();
        const motivation = await groqService.generateMotivation(stats);

        res.status(200).json({
            success: true,
            data: {
                message: motivation,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get code review from AI
 * POST /api/gemini/review
 */
const reviewCode = async (req, res, next) => {
    try {
        const { code, language } = req.body;

        if (!code || code.trim().length === 0) {
            throw new APIError('Code is required', 400);
        }

        if (code.length > 20000) {
            throw new APIError('Code too long for review.', 400);
        }

        const groqService = getGroqService();
        const result = await groqService.reviewCode(code, language || 'javascript');

        if (!result.success) {
            throw new APIError(result.error || 'Code review failed', 500);
        }

        res.status(200).json({
            success: true,
            data: {
                review: result.review,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Health check for AI service
 * GET /api/gemini/health
 */
const healthCheck = async (req, res, next) => {
    try {
        const groqService = getGroqService();

        // Quick test to verify API is working
        const response = await groqService.chat('Say "OK" if you are working.');

        res.status(200).json({
            success: true,
            status: response.success ? 'healthy' : 'degraded',
            model: 'llama-3.3-70b-versatile',
        });
    } catch (error) {
        res.status(200).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
        });
    }
};

/**
 * Analyze project progress
 * POST /api/gemini/analyze-project
 */
const analyzeProject = async (req, res, next) => {
    try {
        const { repoInfo } = req.body;

        if (!repoInfo) {
            throw new APIError('Repository info is required', 400);
        }

        const groqService = getGroqService();
        const result = await groqService.analyzeProjectProgress(repoInfo);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get chat history for user
 * GET /api/gemini/history
 */
const getChatHistory = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        const historySnapshot = await collections.users()
            .doc(userId)
            .collection('chatHistory')
            .orderBy('timestamp', 'asc')
            .limit(50)
            .get();

        const history = historySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json({
            success: true,
            data: {
                history
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Clear chat history for user (with memory summarization)
 * DELETE /api/gemini/history
 */
const deleteChatHistory = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        console.log('🗑️ Clearing chat history for user:', userId);

        // Fetch current history to summarize (without orderBy to avoid index requirement)
        const historyRef = collections.users().doc(userId).collection('chatHistory');
        const historySnapshot = await historyRef.get();

        const messages = historySnapshot.docs.map(doc => doc.data());
        console.log(`📜 Found ${messages.length} messages to process`);

        // Try to summarize if there are messages
        let newSummary = '';
        if (messages.length > 0) {
            try {
                const groqService = getGroqService();

                // Fetch existing memory summary
                const userDoc = await collections.users().doc(userId).get();
                const existingSummary = userDoc.data()?.memorySummary || '';

                const summaryResult = await groqService.summarizeConversation(messages, existingSummary);
                if (summaryResult.success && summaryResult.summary) {
                    newSummary = summaryResult.summary;
                    console.log('✅ Summary created:', newSummary.substring(0, 100) + '...');

                    // Store the updated memory summary
                    await collections.users().doc(userId).set({
                        memorySummary: newSummary,
                        memorySummaryUpdatedAt: new Date()
                    }, { merge: true });
                }
            } catch (summaryError) {
                console.error('⚠️ Summarization failed (continuing with delete):', summaryError.message);
                // Continue with delete even if summarization fails
            }
        }

        // Delete the chat history - use Promise.all for individual deletes
        const deletePromises = historySnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        console.log('✅ Chat history deleted');

        res.status(200).json({
            success: true,
            message: 'Chat history cleared and summarized',
            hasSummary: !!newSummary
        });
    } catch (error) {
        console.error('❌ Delete chat history error:', error);
        next(error);
    }
};

module.exports = {
    chat,
    getMotivation,
    reviewCode,
    healthCheck,
    analyzeProject,
    getChatHistory,
    deleteChatHistory
};
