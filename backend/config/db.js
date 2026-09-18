const mongoose = require('mongoose');

async function connectDatabase() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
    if (!process.env.MONGODB_DB_NAME) throw new Error('MONGODB_DB_NAME is not configured');
    const maxAttempts = 5;
    const retryableErrors = new Set(['ECONNREFUSED', 'EAI_AGAIN', 'ENETUNREACH', 'ETIMEDOUT']);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
            console.log('MongoDB connected successfully');
            return;
        } catch (error) {
            if (!retryableErrors.has(error.code) || attempt === maxAttempts) throw error;
            const delay = attempt * 1000;
            console.warn(`MongoDB connection attempt ${attempt}/${maxAttempts} failed (${error.code}); retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

module.exports = connectDatabase;
