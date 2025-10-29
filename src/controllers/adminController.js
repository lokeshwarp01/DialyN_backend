// Admin controller: manage news (CRUD)
const News = require('../models/News');
const { uploadBuffer } = require('../utils/cloudinaryUpload');
const cloudinary = require('../config/cloudinary');

// helper: convert data URL or base64 string to Buffer
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

// Get all news (admin)
exports.getAllNews = async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json({ count: news.length, news });
    } catch (err) {
        console.error('getAllNews', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create news (image optional) - expects multipart/form-data with field 'image'
exports.createNews = async (req, res) => {
    try {
        const { title, content, topic, image, imageUrl } = req.body;
        if (!title || !content || !topic) return res.status(400).json({ message: 'Missing fields' });

        const newsData = { title, content, topic };

        // If client provided an image as base64/data URL in `image`, upload it
        if (image) {
            const buf = base64ToBuffer(image);
            if (!buf) return res.status(400).json({ message: 'Invalid base64 image' });
            const result = await uploadBuffer(buf, 'dailynews');
            newsData.image = { url: result.secure_url, public_id: result.public_id };
        } else if (imageUrl) {
            // If client provided an image URL, attach it directly (no Cloudinary public_id)
            newsData.image = { url: imageUrl };
        }

        // Optionally attach admin author
        if (req.admin) newsData.author = req.admin._id || undefined;

        const news = await News.create(newsData);
        res.status(201).json({ message: 'News created', news });
    } catch (err) {
        console.error('createNews', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update news by id (image can be replaced)
exports.updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, topic, image, imageUrl } = req.body;
        const news = await News.findById(id);
        if (!news) return res.status(404).json({ message: 'News not found' });

        // Update fields if provided
        if (title) news.title = title;
        if (content) news.content = content;
        if (topic) news.topic = topic;

        // If client provided a new image in JSON (base64/data URL), replace it
        if (image) {
            const buf = base64ToBuffer(image);
            if (!buf) return res.status(400).json({ message: 'Invalid base64 image' });

            // delete old image from Cloudinary if we have a public_id
            if (news.image && news.image.public_id) {
                try {
                    await cloudinary.uploader.destroy(news.image.public_id);
                } catch (e) {
                    console.warn('Failed to delete previous image', e.message);
                }
            }
            const result = await uploadBuffer(buf, 'dailynews');
            news.image = { url: result.secure_url, public_id: result.public_id };
        } else if (imageUrl) {
            // Replace image with provided URL (no cloudinary public_id)
            if (news.image && news.image.public_id) {
                try {
                    await cloudinary.uploader.destroy(news.image.public_id);
                } catch (e) {
                    console.warn('Failed to delete previous image', e.message);
                }
            }
            news.image = { url: imageUrl };
        }

        await news.save();
        res.json({ message: 'News updated', news });
    } catch (err) {
        console.error('updateNews', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete news and its image from Cloudinary
exports.deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findById(id);
        if (!news) return res.status(404).json({ message: 'News not found' });

        // Delete image from Cloudinary if exists
        if (news.image && news.image.public_id) {
            try {
                await cloudinary.uploader.destroy(news.image.public_id);
            } catch (err) {
                console.warn('Failed to delete image from Cloudinary', err.message);
            }
        }

        await news.deleteOne();
        res.json({ message: 'News deleted' });
    } catch (err) {
        console.error('deleteNews', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
