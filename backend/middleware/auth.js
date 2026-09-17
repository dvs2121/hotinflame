const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        if (!header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Authentication required', error: 'Missing bearer token' });
        const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        const user = await User.findById(payload.sub).select('-passwordHash');
        if (!user) return res.status(401).json({ success: false, message: 'Authentication required', error: 'User not found' });
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: 'Invalid or expired token' });
    }
}

module.exports = auth;
