// User-facing controllers for profile management and news
const News = require('../models/News');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// Helper: convert base64 string to Buffer
function base64ToBuffer(data) {
    if (!data) return null;
    // data may be a data URL like: data:image/png;base64,....
    const matches = data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    let base64 = data;
    if (matches) {
        base64 = matches[2];
    }
    try {
        return Buffer.from(base64, 'base64');
    } catch (e) {
        return null;
    }
}

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (err) {
        console.error('getProfile', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, bio, location, website, avatar } = req.body;
        const updates = {};
        
        if (name) updates.name = name;
        if (bio !== undefined) updates['profile.bio'] = bio;
        if (location !== undefined) updates['profile.location'] = location;
        if (website !== undefined) updates['profile.website'] = website;

        // Handle avatar upload if provided
        if (avatar) {
            const { uploadBuffer } = require('../utils/cloudinaryUpload');
            const cloudinary = require('../config/cloudinary');
            
            // If user already has an avatar, delete the old one from Cloudinary
            const user = await User.findById(req.user.id);
            if (user.profile.avatar && user.profile.avatar.public_id) {
                try {
                    await cloudinary.uploader.destroy(user.profile.avatar.public_id);
                } catch (e) {
                    console.warn('Failed to delete previous avatar', e.message);
                }
            }

            // Upload new avatar
            const buf = base64ToBuffer(avatar);
            if (!buf) return res.status(400).json({ message: 'Invalid base64 image' });
            
            const result = await uploadBuffer(buf, 'user-avatars');
            updates['profile.avatar'] = {
                url: result.secure_url,
                public_id: result.public_id
            };
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json({ user: updatedUser });
    } catch (err) {
        console.error('updateProfile', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
    try {
        const { subscribeToNewsletter, emailNotifications, topics } = req.body;
        const updates = {};
        
        if (subscribeToNewsletter !== undefined) updates['preferences.subscribeToNewsletter'] = subscribeToNewsletter;
        if (emailNotifications !== undefined) updates['preferences.emailNotifications'] = emailNotifications;
        if (topics !== undefined) updates['preferences.topics'] = topics;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (err) {
        console.error('updatePreferences', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Subscribe to newsletter
exports.subscribeToNewsletter = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 
                $set: { 
                    'preferences.subscribeToNewsletter': true,
                    'preferences.emailNotifications': true 
                } 
            },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Send welcome email
        await sendEmail({
            to: user.email,
            subject: 'Welcome to Our Newsletter!',
            text: `Hi ${user.name},\n\nThank you for subscribing to our newsletter! You'll now receive the latest news and updates.\n\nBest regards,\nThe News Team`
        });

        res.json({ message: 'Successfully subscribed to newsletter', user });
    } catch (err) {
        console.error('subscribeToNewsletter', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Unsubscribe from newsletter
exports.unsubscribeFromNewsletter = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { 'preferences.subscribeToNewsletter': false } },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Successfully unsubscribed from newsletter', user });
    } catch (err) {
        console.error('unsubscribeFromNewsletter', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get all news (public)
exports.getAllNews = async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json({ count: news.length, news });
    } catch (err) {
        console.error('user getAllNews', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get news by topic (case-insensitive)
exports.getNewsByTopic = async (req, res) => {
    try {
        const { topic } = req.params;
        if (!topic) return res.status(400).json({ message: 'Topic is required' });

        // Use case-insensitive regex to match topic
        const news = await News.find({ topic: { $regex: `^${topic}$`, $options: 'i' } }).sort({ createdAt: -1 });
        res.json({ count: news.length, news });
    } catch (err) {
        console.error('getNewsByTopic', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get single news by id
exports.getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findById(id);
        if (!news) return res.status(404).json({ message: 'News not found' });
        res.json({ news });
    } catch (err) {
        console.error('getNewsById', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
