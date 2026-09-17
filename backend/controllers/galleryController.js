const fs = require('fs');
const path = require('path');
const Gallery = require('../models/Gallery');

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
        ...(image ? { image: `/uploads/gallery/${image.filename}` } : {})
    };
}

function removeStoredImage(filePath) {
    if (!filePath) return;
    const safePath = path.join(__dirname, '..', filePath.replace(/^\/+/, ''));
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
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Please select an image to upload', error: 'Validation failed' });

        const item = await Gallery.create(normalizeGalleryPayload(req.body, req.file));
        res.status(201).json({ success: true, message: 'Gallery image added', data: item });
    } catch (error) {
        next(error);
    }
}

async function updateGallery(req, res, next) {
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found', error: 'Not found' });

        const nextPayload = normalizeGalleryPayload(req.body, req.file);
        if (req.file && item.image) removeStoredImage(item.image);
        if (!req.file) delete nextPayload.image;

        Object.assign(item, nextPayload);
        await item.save();
        res.json({ success: true, message: 'Gallery image updated', data: item });
    } catch (error) {
        next(error);
    }
}

async function deleteGallery(req, res, next) {
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found', error: 'Not found' });

        if (item.image) removeStoredImage(item.image);
        await item.deleteOne();

        res.json({ success: true, message: 'Gallery image deleted', data: {} });
    } catch (error) {
        next(error);
    }
}

module.exports = { listGallery, getGallery, createGallery, updateGallery, deleteGallery };
