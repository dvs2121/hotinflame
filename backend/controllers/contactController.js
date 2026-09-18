const Contact = require('../models/Contact');

async function createContact(req, res, next) { try { const { name, email, phone, message } = req.body; if (!name || !email || !phone || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return res.status(400).json({ success: false, message: 'Enter valid contact details and email', error: 'Validation failed' }); const contact = await Contact.create({ name: String(name).trim(), email: String(email).trim().toLowerCase(), phone: String(phone).trim(), message: String(message).trim() }); res.status(201).json({ success: true, message: 'Contact message submitted', data: { id: contact._id } }); } catch (error) { next(error); } }
module.exports = { createContact };
