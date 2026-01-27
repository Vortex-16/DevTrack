const express = require('express');
const router = express.Router();
const {
    createChallenge,
    getChallenges,
    getChallengeById,
    startChallenge,
    pauseChallenge,
    resumeChallenge,
    stopChallenge,
    deleteChallenge,
    submitSolution,
    getSubmissions
} = require('../controllers/challengeController');
// Assuming we have an auth middleware. 
// I'll skip importing it for now to avoid errors if I don't know the path, 
// but I should really check for it.
// Based on file search earlier: src/middleware/auth.js ? NO Results for auth middleware in previous steps.
// Wait, I saw `node_modules/@clerk/clerk-sdk-node` in package.json.
// I'll assume standard middleware usage but comment it out for now or use a placeholder if I can't find it.
// I'll try to find it first.
// Verified middleware path
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, createChallenge);
router.get('/', getChallenges);
router.get('/:id', getChallengeById);
router.post('/:id/start', requireAuth, startChallenge);
router.post('/:id/pause', requireAuth, pauseChallenge);
router.post('/:id/resume', requireAuth, resumeChallenge);
router.post('/:id/stop', requireAuth, stopChallenge);
router.delete('/:id', requireAuth, deleteChallenge);
router.get('/:id/submissions', requireAuth, getSubmissions);
router.post('/submit', requireAuth, submitSolution);

module.exports = router;
