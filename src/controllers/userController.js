// User-facing controllers for fetching news
const News = require('../models/News');

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
