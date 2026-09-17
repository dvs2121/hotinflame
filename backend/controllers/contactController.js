const Contact = require('../models/Contact');

async function createContact(req, res, next) { try { const { name, email, phone, message } = req.body; if (!name || !email || !phone || !message) return res.status(400).json({ success: false, message: 'Name, email, phone, and message are required', error: 'Validation failed' }); const contact = await Contact.create({ name, email, phone, message }); res.status(201).json({ success: true, message: 'Contact message submitted', data: { id: contact._id } }); } catch (error) { next(error); } }
module.exports = { createContact };
