/**
 * Showcase Controller
 * Handles project showcase operations - public project display, starring, and comments
 */

const { collections, admin } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const cloudinary = require('cloudinary').v2;
const { Resend } = require('resend');

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Escape HTML to prevent XSS in emails
const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

/**
 * Get all showcases (optionally excluding current user's for discovery)
 * GET /api/showcase
 */
const getShowcases = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { excludeOwn, technology, search, limit = 50 } = req.query;

        let query = collections.showcases()
            .orderBy('createdAt', 'desc')
            .limit(parseInt(limit));

        const snapshot = await query.get();
        let showcases = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            // Exclude own showcases if requested
            if (excludeOwn === 'true' && data.userId === userId) {
                return;
            }
            showcases.push({
                id: doc.id,
                ...data,
                isOwner: data.userId === userId,
                hasStarred: data.stars?.includes(userId) || false,
                starCount: data.stars?.length || 0,
                commentCount: data.comments?.length || 0,
            });
        });

        // Filter by technology if specified
        if (technology) {
            const techLower = technology.toLowerCase();
            showcases = showcases.filter(s =>
                s.technologies?.some(t => t.toLowerCase().includes(techLower))
            );
        }

        // Filter by search term if specified
        if (search) {
            const searchLower = search.toLowerCase();
            showcases = showcases.filter(s =>
                s.projectName?.toLowerCase().includes(searchLower) ||
                s.summary?.toLowerCase().includes(searchLower) ||
                s.ownerName?.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            success: true,
            data: showcases,
            count: showcases.length,
        });
    } catch (error) {
        next(new APIError(error.message, 500));
    }
};

/**
 * Get current user's showcased projects
 * GET /api/showcase/mine
 */
const getMyShowcases = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        // Simple query without orderBy to avoid requiring a composite index
        const snapshot = await collections.showcases()
            .where('userId', '==', userId)
            .get();

        const showcases = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            showcases.push({
                id: doc.id,
                ...data,
                starCount: data.stars?.length || 0,
                commentCount: data.comments?.length || 0,
            });
        });

        // Sort in JavaScript instead of Firestore
        showcases.sort((a, b) => {
            const aDate = a.createdAt?.seconds || 0;
            const bDate = b.createdAt?.seconds || 0;
            return bDate - aDate; // Descending
        });

        res.json({
            success: true,
            data: showcases,
            count: showcases.length,
        });
    } catch (error) {
        next(new APIError(error.message, 500));
    }
};

/**
 * Check if a project is already showcased
 * GET /api/showcase/check/:projectId
 */
const checkShowcaseStatus = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { projectId } = req.params;

        const snapshot = await collections.showcases()
            .where('userId', '==', userId)
            .where('projectId', '==', projectId)
            .limit(1)
            .get();

        res.json({
            success: true,
            isShowcased: !snapshot.empty,
            showcaseId: snapshot.empty ? null : snapshot.docs[0].id,
        });
    } catch (error) {
        next(new APIError(error.message, 500));
    }
};

/**
 * Create a new showcase
 * POST /api/showcase
 */
const createShowcase = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const {
            projectId,
            projectName,
            summary,
            liveUrl,
            githubUrl,
            technologies,
            template,
            imageBase64,
            ownerName,
            ownerAvatar,
            ownerEmail,
            ownerGithub,
        } = req.body;

        if (!projectName || !summary) {
            throw new APIError('Project name and summary are required', 400);
        }

        // Check if project is already showcased
        const existingCheck = await collections.showcases()
            .where('userId', '==', userId)
            .where('projectId', '==', projectId)
            .limit(1)
            .get();

        if (!existingCheck.empty) {
            throw new APIError('This project is already in your showcase', 400);
        }

        let imageUrl = null;

        // Upload image to Cloudinary if provided
        if (imageBase64) {
            try {
                const uploadResult = await cloudinary.uploader.upload(imageBase64, {
                    folder: 'devtrack-showcase',
                    transformation: [
                        { width: 1200, height: 630, crop: 'fill' },
                        { quality: 'auto' },
                    ],
                });
                imageUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                // Continue without image if upload fails
            }
        }

        const showcaseData = {
            userId,
            projectId: projectId || null,
            projectName,
            summary,
            liveUrl: liveUrl || null,
            githubUrl: githubUrl || null,
            technologies: technologies || [],
            template: template || 'general',
            imageUrl,
            ownerName: ownerName || 'Anonymous',
            ownerAvatar: ownerAvatar || null,
            ownerEmail: ownerEmail || null,
            ownerGithub: ownerGithub || null,
            stars: [],
            comments: [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await collections.showcases().add(showcaseData);

        res.status(201).json({
            success: true,
            message: 'Project added to showcase',
            data: {
                id: docRef.id,
                ...showcaseData,
                starCount: 0,
                commentCount: 0,
            },
        });
    } catch (error) {
        next(error instanceof APIError ? error : new APIError(error.message, 500));
    }
};

/**
 * Delete a showcase
 * DELETE /api/showcase/:id
 */
const deleteShowcase = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;

        const docRef = collections.showcases().doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new APIError('Showcase not found', 404);
        }

        if (doc.data().userId !== userId) {
            throw new APIError('Not authorized to delete this showcase', 403);
        }

        // Delete image from Cloudinary if exists
        const imageUrl = doc.data().imageUrl;
        if (imageUrl && imageUrl.includes('cloudinary')) {
            try {
                const publicId = imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`devtrack-showcase/${publicId}`);
            } catch (deleteError) {
                console.error('Cloudinary delete error:', deleteError);
            }
        }

        await docRef.delete();

        res.json({
            success: true,
            message: 'Showcase removed successfully',
        });
    } catch (error) {
        next(error instanceof APIError ? error : new APIError(error.message, 500));
    }
};

/**
 * Toggle star on a showcase
 * POST /api/showcase/:id/star
 */
const toggleStar = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;

        const docRef = collections.showcases().doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new APIError('Showcase not found', 404);
        }

        const data = doc.data();
        const stars = data.stars || [];
        const hasStarred = stars.includes(userId);

        if (hasStarred) {
            // Remove star
            await docRef.update({
                stars: admin.firestore.FieldValue.arrayRemove(userId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        } else {
            // Add star
            await docRef.update({
                stars: admin.firestore.FieldValue.arrayUnion(userId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        res.json({
            success: true,
            starred: !hasStarred,
            starCount: hasStarred ? stars.length - 1 : stars.length + 1,
        });
    } catch (error) {
        next(error instanceof APIError ? error : new APIError(error.message, 500));
    }
};

/**
 * Add a comment to a showcase
 * POST /api/showcase/:id/comments
 */
const addComment = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;
        const { content, authorName, authorAvatar } = req.body;

        if (!content || content.trim().length === 0) {
            throw new APIError('Comment content is required', 400);
        }

        if (content.length > 2000) {
            throw new APIError('Comment must not exceed 2000 characters', 400);
        }

        const docRef = collections.showcases().doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new APIError('Showcase not found', 404);
        }

        const showcaseData = doc.data();

        const comment = {
            id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            content: content.trim(),
            authorName: authorName || 'Anonymous',
            authorAvatar: authorAvatar || null,
            createdAt: new Date().toISOString(),
        };

        await docRef.update({
            comments: admin.firestore.FieldValue.arrayUnion(comment),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send email notification to owner (if not commenting on own project)
        if (showcaseData.userId !== userId && showcaseData.ownerEmail) {
            try {
                await resend.emails.send({
                    from: 'DevTrack <notifications@resend.dev>',
                    to: showcaseData.ownerEmail,
                    subject: `💬 New comment on "${showcaseData.projectName}"`,
                    html: `
                        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #7c3aed;">New Comment on Your Showcase</h2>
                            <p><strong>${authorName || 'Someone'}</strong> commented on your project <strong>"${showcaseData.projectName}"</strong>:</p>
                            <blockquote style="border-left: 4px solid #7c3aed; padding-left: 16px; margin: 16px 0; color: #374151;">
                                ${escapeHtml(content)}
                            </blockquote>
                            <p style="color: #6b7280; font-size: 14px;">
                                View your showcase on DevTrack to reply.
                            </p>
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error('Failed to send comment notification email:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.status(201).json({
            success: true,
            message: 'Comment added',
            data: comment,
        });
    } catch (error) {
        next(error instanceof APIError ? error : new APIError(error.message, 500));
    }
};

/**
 * Get trending showcases (most starred this week)
 * GET /api/showcase/trending
 */
const getTrending = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const snapshot = await collections.showcases()
            .where('createdAt', '>=', oneWeekAgo)
            .get();

        let showcases = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            showcases.push({
                id: doc.id,
                ...data,
                isOwner: data.userId === userId,
                hasStarred: data.stars?.includes(userId) || false,
                starCount: data.stars?.length || 0,
                commentCount: data.comments?.length || 0,
            });
        });

        // Sort by star count descending
        showcases.sort((a, b) => b.starCount - a.starCount);

        // Return top 10
        showcases = showcases.slice(0, 10);

        res.json({
            success: true,
            data: showcases,
        });
    } catch (error) {
        next(new APIError(error.message, 500));
    }
};

/**
 * Delete a comment from a showcase
 * DELETE /api/showcase/:id/comments/:commentId
 */
const deleteComment = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { id, commentId } = req.params;

        const docRef = collections.showcases().doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new APIError('Showcase not found', 404);
        }

        const showcaseData = doc.data();
        const comments = showcaseData.comments || [];

        // Find the comment
        const commentToDelete = comments.find(c => c.id === commentId);

        if (!commentToDelete) {
            throw new APIError('Comment not found', 404);
        }

        // Check if user is the comment author or showcase owner
        if (commentToDelete.userId !== userId && showcaseData.userId !== userId) {
            throw new APIError('Not authorized to delete this comment', 403);
        }

        // Remove the comment from the array
        const updatedComments = comments.filter(c => c.id !== commentId);

        await docRef.update({
            comments: updatedComments,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
            success: true,
            message: 'Comment deleted',
        });
    } catch (error) {
        next(error instanceof APIError ? error : new APIError(error.message, 500));
    }
};

module.exports = {
    getShowcases,
    getMyShowcases,
    checkShowcaseStatus,
    createShowcase,
    deleteShowcase,
    toggleStar,
    addComment,
    deleteComment,
    getTrending,
};
