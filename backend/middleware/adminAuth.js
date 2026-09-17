const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

async function adminAuth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        if (!header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Admin authentication required', error: 'Missing bearer token' });
        const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        if (payload.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required', error: 'Insufficient role' });
        const admin = await Admin.findById(payload.sub).select('-passwordHash');
        if (!admin || admin.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required', error: 'Admin not found' });
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Admin authentication required', error: 'Invalid or expired token' });
    }
}

module.exports = adminAuth;
