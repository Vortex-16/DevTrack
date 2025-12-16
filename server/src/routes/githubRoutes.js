/**
 * GitHub Routes
 * Routes for GitHub data fetching
 */

const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const githubController = require('../controllers/githubController');

// Get GitHub activity summary
router.get('/activity', requireAuth, githubController.getActivity);

// Get recent commits
router.get('/commits', requireAuth, githubController.getCommits);

// Get repositories
router.get('/repos', requireAuth, githubController.getRepos);

// Get languages used
router.get('/languages', requireAuth, githubController.getLanguages);

// Get GitHub profile (uses PAT, not user-specific)
router.get('/profile', githubController.getProfile);

// Analyze a specific repository by owner/repo (optionalAuth allows private repo access when logged in)
router.get('/repo/:owner/:repo', optionalAuth, githubController.analyzeRepo);

// Get languages for a specific repository
router.get('/repo/:owner/:repo/languages', optionalAuth, githubController.getRepoLanguages);

// Create a new GitHub repository
router.post('/repo', requireAuth, githubController.createRepo);

module.exports = router;

