const express = require('express');
const router = express.Router();
const bookmarksController = require('../controllers/bookmarksController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', bookmarksController.getBookmarks);
router.post('/', bookmarksController.addBookmark);
router.post('/check', bookmarksController.checkStatus);
router.delete('/:repoId', bookmarksController.removeBookmark);

module.exports = router;
