const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const publicUser = user => ({ id: user._id, name: user.name, email: user.email, phone: user.phone });
const signToken = user => jwt.sign({ sub: user._id.toString(), type: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

async function register(req, res, next) {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password || password.length < 8) return res.status(400).json({ success: false, message: 'Name, email, phone, and a password of at least 8 characters are required', error: 'Validation failed' });
        const normalizedEmail = email.trim().toLowerCase();
        if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: 'Email is already registered', error: 'Duplicate email' });
        const user = await User.create({ name, email: normalizedEmail, phone, passwordHash: await bcrypt.hash(password, 12) });
        res.status(201).json({ success: true, message: 'Registration successful', data: { token: signToken(user), user: publicUser(user) } });
    } catch (error) { next(error); }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: String(email || '').trim().toLowerCase() }).select('+passwordHash');
        if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ success: false, message: 'Invalid email or password', error: 'Authentication failed' });
        res.json({ success: true, message: 'Login successful', data: { token: signToken(user), user: publicUser(user) } });
    } catch (error) { next(error); }
}

async function me(req, res) { res.json({ success: true, message: 'User profile retrieved', data: { user: publicUser(req.user) } }); }
module.exports = { register, login, me };
