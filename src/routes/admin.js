const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const auth = require('../middleware/auth');

// All admin routes require admin authentication
router.get('/news', auth('admin'), adminCtrl.getAllNews);

// Create news - accepts JSON payload. For images send a base64 string in the
// `image` field (data URL or raw base64). Example: { title, content, topic, image }
router.post('/news', auth('admin'), adminCtrl.createNews);

// Update news (optionally replace image). Same JSON format as create.
router.put('/news/:id', auth('admin'), adminCtrl.updateNews);

// Delete news
router.delete('/news/:id', auth('admin'), adminCtrl.deleteNews);

module.exports = router;
