const mongoose = require('mongoose');

async function connectDatabase() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
    if (!process.env.MONGODB_DB_NAME) throw new Error('MONGODB_DB_NAME is not configured');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
    console.log('MongoDB connected successfully');
}

module.exports = connectDatabase;
