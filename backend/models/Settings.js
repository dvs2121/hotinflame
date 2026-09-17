const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: String, trim: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);