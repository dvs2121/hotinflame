const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    message: { type: String, required: true, trim: true, maxlength: 3000 }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('Contact', contactSchema);
