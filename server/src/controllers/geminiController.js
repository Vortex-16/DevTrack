/**
 * AI Controller (Groq-powered)
 * Handles AI chat and assistance features using Groq Service
 */

const { getGroqService } = require('../services/groqService');
const { APIError } = require('../middleware/errorHandler');

/**
 * Chat with AI
 * POST /api/gemini/chat
 */
const chat = async (req, res, next) => {
    try {
        const { message, context } = req.body;

        console.log('Chat request received:', { message: message?.substring(0, 50), hasContext: !!context });

        if (!message || message.trim().length === 0) {
            throw new APIError('Message is required', 400);
        }

        const groqService = getGroqService();
        const response = await groqService.chat(message, context);

        console.log('AI response:', { success: response.success, hasMessage: !!response.message });

        // Return the AI message or error message
        res.status(200).json({
            success: response.success,
            data: {
                message: response.success ? response.message : (response.error || 'AI request failed. Please try again.'),
                model: response.model || 'llama-3.3-70b-versatile',
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

module.exports = {
    chat,
    getMotivation,
    reviewCode,
    healthCheck,
    analyzeProject,
};
