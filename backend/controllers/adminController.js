const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Quotation = require('../models/Quotation');

const publicAdmin = admin => ({ id: admin._id, name: admin.name, email: admin.email, role: admin.role });
const signToken = admin => jwt.sign({ sub: admin._id.toString(), role: admin.role, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });

async function login(req, res, next) {
    try {
        const { email: identifier, password } = req.body;
        const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
        const email = normalizedIdentifier === 'admin' ? String(process.env.ADMIN_EMAIL || '').trim().toLowerCase() : normalizedIdentifier;
        const admin = await Admin.findOne({ email }).select('+passwordHash');
        if (!admin || !(await bcrypt.compare(password || '', admin.passwordHash))) return res.status(401).json({ success: false, message: 'Invalid admin credentials', error: 'Authentication failed' });
        res.json({ success: true, message: 'Admin login successful', data: { token: signToken(admin), admin: publicAdmin(admin) } });
    } catch (error) { next(error); }
}

async function me(req, res) { res.json({ success: true, message: 'Admin profile retrieved', data: { admin: publicAdmin(req.admin) } }); }
async function listQuotations(req, res, next) { try { const quotations = await Quotation.find().populate('user', 'name email phone').sort({ createdAt: -1 }); res.json({ success: true, message: 'Quotations retrieved', data: quotations }); } catch (error) { next(error); } }
module.exports = { login, me, listQuotations };
