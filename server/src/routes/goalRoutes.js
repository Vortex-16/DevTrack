const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { requireAuth } = require('../middleware/auth');

// All routes are protected
router.use(requireAuth);

router.get('/', goalController.getAll);
router.post('/', goalController.create);
router.put('/:id', goalController.update);
router.delete('/:id', goalController.delete);

module.exports = router;
