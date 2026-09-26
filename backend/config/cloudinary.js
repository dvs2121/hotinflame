const { v2: cloudinary } = require('cloudinary');

function validateCloudinaryConfig() {
    const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) throw new Error(`Missing Cloudinary configuration: ${missing.join(', ')}`);

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
    return cloudinary;
}

async function uploadImage(buffer, folder) {
    validateCloudinaryConfig();
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
            if (error || !result?.secure_url || !result.public_id) {
                if (error) console.error('Cloudinary upload failed:', error);
                const uploadError = new Error('Image upload failed. Please try again.');
                uploadError.statusCode = 502;
                reject(uploadError);
                return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
        }).end(buffer);
    });
}

async function deleteImage(publicId) {
    if (!publicId) return;
    try {
        validateCloudinaryConfig();
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        if (!['ok', 'not found'].includes(result.result)) console.error(`Cloudinary deletion was not confirmed for ${publicId}:`, result);
    } catch (error) {
        console.error(`Cloudinary deletion failed for ${publicId}:`, error);
    }
}

module.exports = { cloudinary, validateCloudinaryConfig, uploadImage, deleteImage };