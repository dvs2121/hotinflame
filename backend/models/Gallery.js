const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: { type: String, trim: true, maxlength: 120, default: 'Gallery image' },
    caption: { type: String, trim: true, maxlength: 500, default: '' },
    image: { type: String, required: true, trim: true },
    type: { type: String, trim: true, lowercase: true, default: 'deeksha' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
