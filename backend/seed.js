require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDatabase = require('./config/db');
const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Dish = require('./models/Dish');

async function seed() {
    await connectDatabase();
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD === 'change_this_password') throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and a non-default ADMIN_PASSWORD in backend/.env before seeding');
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await Admin.findOneAndUpdate({ email }, { name: ADMIN_NAME, email, passwordHash, role: 'admin' }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await Category.bulkWrite(['starter', 'main', 'sweet', 'snack', 'drink'].map(name => ({ updateOne: { filter: { name }, update: { $setOnInsert: { name } }, upsert: true } })));
    const dishes = [
        { name: 'Dhokla', description: 'Steamed fermented batter, soft and spongy with a tangy kick', category: 'starter', type: 'deeksha' },
        { name: 'Khandvi', description: 'Rolled gram flour delicacy tempered with sesame and mustard', category: 'starter', type: 'deeksha' },
        { name: 'Undhiyu', description: 'Winter mixed vegetable curry, the crown jewel of Gujarati cuisine', category: 'main', type: 'deeksha' },
        { name: 'Gujarati Thali', description: 'Complete traditional thali, the ultimate Gujarati experience', category: 'main', type: 'deeksha' },
        { name: 'Tandoori Platter', description: 'Smoked and grilled specialties marinated in fiery spices', category: 'starter', type: 'flamein' },
        { name: 'Butter Chicken', description: 'Rich, creamy tomato curry with tender chicken', category: 'main', type: 'flamein' },
        { name: 'Biryani', description: 'Aromatic basmati rice layered with spices and saffron', category: 'main', type: 'flamein' }
    ];
    for (const dish of dishes) await Dish.findOneAndUpdate({ name: dish.name, type: dish.type }, { $setOnInsert: dish }, { upsert: true, new: true });
    console.log('Admin, initial categories, and starter dishes seeded successfully');
    await require('mongoose').connection.close();
}
seed().catch(async error => { console.error(`Seed failed: ${error.message}`); try { await require('mongoose').connection.close(); } catch {} process.exitCode = 1; });
