const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    image: { type: String, default: '' },
    imageCaption: { type: String, trim: true, maxlength: 300, default: '' },
    category: { type: String, required: true, trim: true, lowercase: true },
    type: { type: String, trim: true, lowercase: true, default: 'deeksha' },
    available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Dish', dishSchema);
