// News model: stores title, content, topic and image info (Cloudinary)
const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        topic: { type: String, required: true, index: true },
        // image stored on Cloudinary: url and public_id so we can delete later
        image: {
            url: { type: String },
            public_id: { type: String },
        },
        // optional author reference (admin) for auditing
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('News', NewsSchema);
