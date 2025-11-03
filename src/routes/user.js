const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const auth = require('../middleware/auth');
const protect = auth; // The auth middleware is the protect function

// Public endpoints to view news
router.get('/news', userCtrl.getAllNews);
router.get('/news/topic/:topic', userCtrl.getNewsByTopic);
router.get('/news/:id', userCtrl.getNewsById);

// Protected user profile and subscription routes
router.use(protect('user'));

// Profile management
router.route('/profile')
    .get(userCtrl.getProfile)          // Get user profile
    .put(userCtrl.updateProfile);       // Update profile

// Subscription management
router.route('/preferences')
    .put(userCtrl.updatePreferences);   // Update preferences

router.post('/subscribe', userCtrl.subscribeToNewsletter);          // Subscribe to newsletter
router.post('/unsubscribe', userCtrl.unsubscribeFromNewsletter);    // Unsubscribe from newsletter

module.exports = router;
