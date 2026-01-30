const express = require('express');
const router = express.Router();
const leetCodeController = require('../controllers/leetCodeController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/stats', leetCodeController.getStats);
router.post('/config', leetCodeController.updateConfig);

module.exports = router;
