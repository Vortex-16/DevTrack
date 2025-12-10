/**
 * Input Validation Middleware
 * Using Joi for schema validation
 */

const Joi = require('joi');
const { APIError } = require('./errorHandler');

// ======================
// VALIDATION SCHEMAS
// ======================

const schemas = {
    // User sync schema
    userSync: Joi.object({
        githubUsername: Joi.string().max(39).optional(),
        email: Joi.string().email().optional(),
        name: Joi.string().max(100).optional(),
        avatarUrl: Joi.string().uri().optional(),
    }),

    // Learning log schema
    createLog: Joi.object({
        date: Joi.date().iso().required(),
        startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        learnedToday: Joi.string().max(2000).required(),
        tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
        mood: Joi.string().valid('great', 'good', 'okay', 'tired').optional(),
    }),

    updateLog: Joi.object({
        date: Joi.date().iso().optional(),
        startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        learnedToday: Joi.string().max(2000).optional(),
        tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
        mood: Joi.string().valid('great', 'good', 'okay', 'tired').optional(),
    }).min(1),

    // Gemini chat schema
    geminiChat: Joi.object({
        message: Joi.string().min(1).max(4000).required(),
        context: Joi.string().max(10000).allow('').optional(),
    }),

    // GitHub username
    githubUsername: Joi.object({
        username: Joi.string().max(39).required(),
    }),

    // Pagination
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
    }),

    // Project schemas
    createProject: Joi.object({
        name: Joi.string().min(1).max(100).required(),
        description: Joi.string().max(1000).allow('').optional(),
        status: Joi.string().valid('Planning', 'Active', 'On Hold', 'Completed').optional(),
        repositoryUrl: Joi.string().uri().allow('').optional(),
        technologies: Joi.array().items(Joi.string().max(50)).max(20).optional(),
        progress: Joi.number().min(0).max(100).optional(),
        commits: Joi.number().min(0).optional(),
        githubData: Joi.object().optional(),
        aiAnalysis: Joi.object().optional(),
    }),

    updateProject: Joi.object({
        name: Joi.string().min(1).max(100).optional(),
        description: Joi.string().max(1000).optional(),
        status: Joi.string().valid('Planning', 'Active', 'On Hold', 'Completed').optional(),
        repositoryUrl: Joi.string().uri().allow('').optional(),
        technologies: Joi.array().items(Joi.string().max(50)).max(20).optional(),
        progress: Joi.number().min(0).max(100).optional(),
        commits: Joi.number().min(0).optional(),
    }).min(1),
};

// ======================
// VALIDATION MIDDLEWARE
// ======================

/**
 * Creates a validation middleware for the specified schema
 * @param {string} schemaName - Name of the schema to validate against
 * @param {string} source - 'body', 'query', or 'params'
 */
const validate = (schemaName, source = 'body') => {
    return (req, res, next) => {
        const schema = schemas[schemaName];

        if (!schema) {
            return next(new APIError(`Validation schema '${schemaName}' not found`, 500));
        }

        const dataToValidate = req[source];
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessages = error.details.map((detail) => detail.message).join(', ');
            return next(new APIError(errorMessages, 400));
        }

        // Replace with validated and sanitized data
        req[source] = value;
        next();
    };
};

/**
 * Sanitize string input to prevent XSS
 */
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
};

module.exports = {
    validate,
    schemas,
    sanitizeInput,
};
