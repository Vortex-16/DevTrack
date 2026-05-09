/**
 * Preferences Controller
 * Handles user onboarding preferences management
 */

const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const { resolveGithubAccessDays } = require('../services/githubAccessService');

// Default preferences for users who skip onboarding
const DEFAULT_PREFERENCES = {
    commitPattern: 'frequent',
    autoEndDuration: 'midnight',
    reminderMode: 'adaptive',
    fixedTime: null,
    breakDetection: true,
    githubAccessRetentionDays: 7,
};

/**
 * Save user preferences after onboarding
 * POST /api/preferences
 */
const savePreferences = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { preferences, userGoal } = req.body;

        if (!preferences) {
            throw new APIError('Preferences object is required', 400);
        }

        const userRef = collections.users().doc(userId);
        const userDoc = await userRef.get();

        // Validate and sanitize preferences
        const sanitizedPreferences = {
            commitPattern: ['frequent', 'end-only'].includes(preferences.commitPattern)
                ? preferences.commitPattern
                : DEFAULT_PREFERENCES.commitPattern,
            autoEndDuration: ['midnight', '12h', '24h', '48h'].includes(preferences.autoEndDuration)
                ? preferences.autoEndDuration
                : DEFAULT_PREFERENCES.autoEndDuration,
            reminderMode: ['adaptive', 'fixed'].includes(preferences.reminderMode)
                ? preferences.reminderMode
                : DEFAULT_PREFERENCES.reminderMode,
            fixedTime: preferences.reminderMode === 'fixed' && preferences.fixedTime
                ? preferences.fixedTime
                : null,
            breakDetection: typeof preferences.breakDetection === 'boolean'
                ? preferences.breakDetection
                : DEFAULT_PREFERENCES.breakDetection,
            githubAccessRetentionDays: resolveGithubAccessDays(preferences.githubAccessRetentionDays),
        };

        const updateData = {
            preferences: sanitizedPreferences,
            userGoal: userGoal || null,
            onboardingCompleted: true,
            onboardingCompletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Create or update user document
        if (!userDoc.exists) {
            // User doesn't exist, create them with preferences
            await userRef.set({
                ...updateData,
                createdAt: new Date().toISOString(),
            });
        } else {
            // User exists, update their preferences
            await userRef.update(updateData);
        }

        const updatedUser = await userRef.get();

        res.status(200).json({
            success: true,
            message: 'Preferences saved successfully',
            data: {
                preferences: updatedUser.data().preferences,
                userGoal: updatedUser.data().userGoal,
                onboardingCompleted: updatedUser.data().onboardingCompleted,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user preferences
 * GET /api/preferences
 */
const getPreferences = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const userRef = collections.users().doc(userId);
        const userDoc = await userRef.get();

        // If user doesn't exist, return default data (not completed onboarding)
        if (!userDoc.exists) {
            return res.status(200).json({
                success: true,
                data: {
                    preferences: DEFAULT_PREFERENCES,
                    userGoal: null,
                    onboardingCompleted: false,
                },
            });
        }

        const userData = userDoc.data();

        res.status(200).json({
            success: true,
            data: {
                preferences: userData.preferences || DEFAULT_PREFERENCES,
                reportPreferences: userData.reportPreferences || { dayOfWeek: 1, hour: 15, frequency: 'weekly', enabled: true },
                userGoal: userData.userGoal || null,
                onboardingCompleted: userData.onboardingCompleted || false,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update specific preferences (partial update)
 * PUT /api/preferences
 */
const updatePreferences = async (req, res, next) => {
    try {
        const { userId } = req.auth;
        const { preferences, reportPreferences, userGoal } = req.body;

        const userRef = collections.users().doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }

        const currentPreferences = userDoc.data().preferences || DEFAULT_PREFERENCES;

        // Merge with existing preferences
        const updatedPreferences = {
            ...currentPreferences,
        };

        if (preferences) {
            if (preferences.commitPattern && ['frequent', 'end-only'].includes(preferences.commitPattern)) {
                updatedPreferences.commitPattern = preferences.commitPattern;
            }
            if (preferences.autoEndDuration && ['midnight', '12h', '24h', '48h'].includes(preferences.autoEndDuration)) {
                updatedPreferences.autoEndDuration = preferences.autoEndDuration;
            }
            if (preferences.reminderMode && ['adaptive', 'fixed'].includes(preferences.reminderMode)) {
                updatedPreferences.reminderMode = preferences.reminderMode;
                // Clear fixedTime if switching to adaptive
                if (preferences.reminderMode === 'adaptive') {
                    updatedPreferences.fixedTime = null;
                }
            }
            if (preferences.fixedTime !== undefined) {
                updatedPreferences.fixedTime = preferences.fixedTime;
            }
            if (typeof preferences.breakDetection === 'boolean') {
                updatedPreferences.breakDetection = preferences.breakDetection;
            }
            if (preferences.githubAccessRetentionDays !== undefined) {
                updatedPreferences.githubAccessRetentionDays = resolveGithubAccessDays(preferences.githubAccessRetentionDays);
            }
            if (preferences.reportSchedule !== undefined) {
                updatedPreferences.reportSchedule = preferences.reportSchedule;
            }

            // Public Profile Customization
            if (preferences.publicProfile) {
                updatedPreferences.publicProfile = {
                    ...(updatedPreferences.publicProfile || {}),
                    ...(preferences.publicProfile.bio !== undefined && { bio: preferences.publicProfile.bio }),
                    ...(preferences.publicProfile.headline !== undefined && { headline: preferences.publicProfile.headline }),
                    ...(preferences.publicProfile.showcasedProjectIds !== undefined && { showcasedProjectIds: preferences.publicProfile.showcasedProjectIds }),
                    ...(preferences.publicProfile.showSkills !== undefined && { showSkills: preferences.publicProfile.showSkills }),
                    ...(preferences.publicProfile.theme !== undefined && { theme: preferences.publicProfile.theme }),
                    ...(preferences.publicProfile.accentColor !== undefined && { accentColor: preferences.publicProfile.accentColor }),
                    ...(preferences.publicProfile.socials !== undefined && { socials: preferences.publicProfile.socials }),
                    ...(preferences.publicProfile.bannerUrl !== undefined && { bannerUrl: preferences.publicProfile.bannerUrl }),
                };
            }
        }

        const updateData = {
            preferences: updatedPreferences,
            updatedAt: new Date().toISOString(),
        };

        if (userGoal !== undefined) {
            updateData.userGoal = userGoal;
        }

        if (reportPreferences !== undefined) {
            // Basic validation for report preferences
            const VALID_DAYS = [0, 1, 2, 3, 4, 5, 6];
            const VALID_HOURS = Array.from({ length: 24 }, (_, i) => i);

            const schedule = {
                dayOfWeek: VALID_DAYS.includes(Number(reportPreferences.dayOfWeek)) ? Number(reportPreferences.dayOfWeek) : 1,
                hour: VALID_HOURS.includes(Number(reportPreferences.hour)) ? Number(reportPreferences.hour) : 15,
                frequency: ['weekly', 'biweekly'].includes(reportPreferences.frequency) ? reportPreferences.frequency : 'weekly',
                enabled: reportPreferences.enabled !== undefined ? Boolean(reportPreferences.enabled) : true,
            };
            updateData.reportPreferences = schedule;
        }

        await userRef.update(updateData);

        const updatedUser = await userRef.get();

        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            data: {
                preferences: updatedUser.data().preferences,
                reportPreferences: updatedUser.data().reportPreferences,
                userGoal: updatedUser.data().userGoal,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Skip onboarding with default preferences
 * POST /api/preferences/skip
 */
const skipOnboarding = async (req, res, next) => {
    try {
        const { userId } = req.auth;

        const userRef = collections.users().doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new APIError('User not found', 404);
        }

        await userRef.update({
            preferences: DEFAULT_PREFERENCES,
            onboardingCompleted: true,
            onboardingSkipped: true,
            onboardingCompletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        res.status(200).json({
            success: true,
            message: 'Onboarding skipped with default preferences',
            data: {
                preferences: DEFAULT_PREFERENCES,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    savePreferences,
    getPreferences,
    updatePreferences,
    skipOnboarding,
    DEFAULT_PREFERENCES,
};
