const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    eventType: { type: String, required: true, trim: true, maxlength: 100 },
    eventDate: { type: Date, required: true },
    guestCount: { type: Number, required: true, min: 1, max: 100000 },
    selectedDishes: [{ name: String, quantity: { type: Number, min: 1, default: 1 } }],
    customRequirements: { type: String, trim: true, maxlength: 3000, default: '' },
    message: { type: String, trim: true, maxlength: 3000, default: '' },
    status: { type: String, enum: ['pending', 'contacted', 'confirmed', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Quotation', quotationSchema);
