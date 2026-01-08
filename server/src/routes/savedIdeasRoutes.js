const express = require('express');
const router = express.Router();
const savedIdeasController = require('../controllers/savedIdeasController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', savedIdeasController.getSavedIdeas);
router.post('/', savedIdeasController.saveIdea);
router.post('/check', savedIdeasController.checkStatus);
router.delete('/:ideaId', savedIdeasController.removeIdea);

module.exports = router;
