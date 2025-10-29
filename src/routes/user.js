const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');

// Public endpoints to view news
router.get('/news', userCtrl.getAllNews);
router.get('/news/topic/:topic', userCtrl.getNewsByTopic);
router.get('/news/:id', userCtrl.getNewsById);

module.exports = router;
