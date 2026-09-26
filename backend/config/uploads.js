const path = require('path');

const uploadsRoot = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'));

function resolveStoredUpload(imagePath) {
    if (typeof imagePath !== 'string' || !imagePath.startsWith('/uploads/')) return null;

    const relativePath = imagePath.slice('/uploads/'.length);
    if (!relativePath) return null;

    const resolvedPath = path.resolve(uploadsRoot, relativePath);
    return resolvedPath.startsWith(`${uploadsRoot}${path.sep}`) ? resolvedPath : null;
}

module.exports = { uploadsRoot, resolveStoredUpload };