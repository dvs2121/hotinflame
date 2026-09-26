require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const mongoose = require('mongoose');
const connectDatabase = require('./config/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const dishRoutes = require('./routes/dishes');
const galleryRoutes = require('./routes/gallery');
const categoryRoutes = require('./routes/categories');
const quotationRoutes = require('./routes/quotations');
const contactRoutes = require('./routes/contact');
const adminAuth = require('./middleware/adminAuth');
const dishController = require('./controllers/dishController');
const galleryController = require('./controllers/galleryController');
const Settings = require('./models/Settings');
const { uploadsRoot } = require('./config/uploads');
const { validateCloudinaryConfig } = require('./config/cloudinary');

const app = express();
const port = Number(process.env.PORT || 5000);
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://hotinflamee.vercel.app,http://localhost:3000,http://localhost:5002,http://localhost:5500,http://127.0.0.1:5500').split(',').map(origin => origin.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (origin, callback) => {
    const isLocalDevelopmentOrigin = !isProduction && origin && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    return !origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin ? callback(null, true) : callback(new Error('Origin is not allowed by CORS'));
} }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(uploadsRoot, { dotfiles: 'deny', index: false }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many authentication attempts', error: 'Rate limit exceeded' } });
const publicWriteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many submissions', error: 'Rate limit exceeded' } });
const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => imageMimeTypes.has(file.mimetype) && imageExtensions.has(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'))
});

function validateProductionConfig() {
    if (!isProduction) return;
    const missing = ['MONGODB_URI', 'MONGODB_DB_NAME', 'JWT_SECRET', 'CORS_ORIGINS'].filter(key => !process.env[key]);
    if (missing.length) throw new Error(`Missing production configuration: ${missing.join(', ')}`);
    if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
}

app.get('/', (req, res) => res.json({ success: true, message: 'API is running' }));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Deeksha Caterers API is running', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', authLimiter, adminRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/quotations', publicWriteLimiter, quotationRoutes);
app.use('/api/contact', publicWriteLimiter, contactRoutes);
app.post('/api/admin/dishes', adminAuth, upload.single('image'), dishController.createDish);
app.put('/api/admin/dishes/:id', adminAuth, upload.single('image'), dishController.updateDish);
app.delete('/api/admin/dishes/:id', adminAuth, dishController.deleteDish);
app.get('/api/admin/gallery', adminAuth, galleryController.listGallery);
app.post('/api/admin/gallery', adminAuth, upload.single('image'), galleryController.createGallery);
app.put('/api/admin/gallery/:id', adminAuth, upload.single('image'), galleryController.updateGallery);
app.delete('/api/admin/gallery/:id', adminAuth, galleryController.deleteGallery);
app.get('/api/settings/whatsapp', async (req, res, next) => {
    try {
        const setting = await Settings.findOne({ key: 'whatsappOrderNumber' });
        res.json({ success: true, message: 'WhatsApp order number retrieved', data: { number: setting?.value || '' } });
    } catch (error) { next(error); }
});
app.get('/api/admin/settings/whatsapp', adminAuth, async (req, res, next) => {
    try {
        const setting = await Settings.findOne({ key: 'whatsappOrderNumber' });
        res.json({ success: true, message: 'WhatsApp order number retrieved', data: { number: setting?.value || '' } });
    } catch (error) { next(error); }
});
app.put('/api/admin/settings/whatsapp', adminAuth, async (req, res, next) => {
    try {
        const number = String(req.body.number || '').replace(/[^0-9]/g, '');
        if (number.length < 8 || number.length > 15) return res.status(400).json({ success: false, message: 'Enter a valid WhatsApp number with country code' });
        const setting = await Settings.findOneAndUpdate({ key: 'whatsappOrderNumber' }, { key: 'whatsappOrderNumber', value: number }, { new: true, upsert: true, runValidators: true });
        res.json({ success: true, message: 'WhatsApp order number updated', data: { number: setting.value } });
    } catch (error) { next(error); }
});
app.post('/api/admin/categories', adminAuth, dishController.createCategory);
app.put('/api/admin/categories/:id', adminAuth, dishController.updateCategory);
app.delete('/api/admin/categories/:id', adminAuth, dishController.deleteCategory);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found', error: `${req.method} ${req.originalUrl}` }));
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError || error.message.includes('Only JPG')) return res.status(400).json({ success: false, message: 'Invalid image upload', error: error.message });
    if (error.statusCode === 502) return res.status(502).json({ success: false, message: error.message, error: 'Image upload failed' });
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Validation failed', error: Object.values(error.errors).map(item => item.message).join(', ') });
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'A record with that value already exists', error: 'Duplicate value' });
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid resource id', error: 'Validation failed' });
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error', error: 'Unexpected server error' });
});

async function start() {
    try {
        validateCloudinaryConfig();
        validateProductionConfig();
        await connectDatabase();
        app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
    } catch (error) {
        console.error(`Server startup failed: ${error.message}`);
        process.exitCode = 1;
    }
}

if (require.main === module) start();
module.exports = { app, start };
