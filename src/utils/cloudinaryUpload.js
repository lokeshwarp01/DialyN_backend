// Helper to upload buffer to Cloudinary using uploader.upload_stream
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

function uploadBuffer(buffer, folder = 'dailynews') {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
}

module.exports = { uploadBuffer };
