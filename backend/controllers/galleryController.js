const fs = require('fs');
const Gallery = require('../models/Gallery');
const { resolveStoredUpload } = require('../config/uploads');
const { uploadImage, deleteImage } = require('../config/cloudinary');

function sanitizeTitle(value) {
    const next = String(value || '').trim();
    return next || 'Gallery image';
}

function sanitizeCaption(value) {
    return String(value || '').trim();
}

function normalizeGalleryPayload(body, image) {
    return {
        title: sanitizeTitle(body.title),
        caption: sanitizeCaption(body.caption || body.imageCaption),
        type: String(body.type || 'deeksha').trim().toLowerCase(),
        ...(image ? { image: image.url, imagePublicId: image.publicId } : {})
    };
}

function removeStoredImage(filePath) {
    if (!filePath) return;
    const safePath = resolveStoredUpload(filePath);
    if (!safePath) return;
    fs.access(safePath, fs.constants.F_OK, (error) => {
        if (!error) fs.unlink(safePath, () => {});
    });
}

async function listGallery(req, res, next) {
    try {
        const filter = {};
        if (req.query.type) filter.type = String(req.query.type).trim().toLowerCase();
        const items = await Gallery.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, message: 'Gallery retrieved', data: items });
    } catch (error) {
        next(error);
    }
}

async function removePreviousImage(image, publicId) {
    if (publicId) return deleteImage(publicId);
    if (image) removeStoredImage(image);
}

async function getGallery(req, res, next) {
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found', error: 'Not found' });
        res.json({ success: true, message: 'Gallery item retrieved', data: item });
    } catch (error) {
        next(error);
    }
}

async function createGallery(req, res, next) {
    let uploadedImage;
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Please select an image to upload', error: 'Validation failed' });

        uploadedImage = await uploadImage(req.file.buffer, 'deeksha-caterers/gallery');
        const item = await Gallery.create(normalizeGalleryPayload(req.body, uploadedImage));
        res.status(201).json({ success: true, message: 'Gallery image added', data: item });
    } catch (error) {
        if (uploadedImage) await deleteImage(uploadedImage.publicId);
        next(error);
    }
}

async function updateGallery(req, res, next) {
    let uploadedImage;
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found', error: 'Not found' });

        const previousImage = item.image;
        const previousPublicId = item.imagePublicId;
        if (req.file) uploadedImage = await uploadImage(req.file.buffer, 'deeksha-caterers/gallery');
        const nextPayload = normalizeGalleryPayload(req.body, uploadedImage);
        if (!uploadedImage) {
            delete nextPayload.image;
            delete nextPayload.imagePublicId;
        }

        Object.assign(item, nextPayload);
        await item.save();
        if (uploadedImage) await removePreviousImage(previousImage, previousPublicId);
        res.json({ success: true, message: 'Gallery image updated', data: item });
    } catch (error) {
        if (uploadedImage) await deleteImage(uploadedImage.publicId);
        next(error);
    }
}

async function deleteGallery(req, res, next) {
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found', error: 'Not found' });

        await item.deleteOne();
        await removePreviousImage(item.image, item.imagePublicId);

        res.json({ success: true, message: 'Gallery image deleted', data: {} });
    } catch (error) {
        next(error);
    }
}

module.exports = { listGallery, getGallery, createGallery, updateGallery, deleteGallery };
