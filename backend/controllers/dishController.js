const fs = require('fs');
const Dish = require('../models/Dish');
const Category = require('../models/Category');
const { resolveStoredUpload } = require('../config/uploads');
const { uploadImage, deleteImage } = require('../config/cloudinary');

function removeStoredImage(filePath) {
    if (!filePath) return;
    const safePath = resolveStoredUpload(filePath);
    if (safePath) fs.unlink(safePath, () => {});
}

function cleanDish(body, image) {
    const data = { name: body.name, description: body.description, category: body.category, type: body.type || 'deeksha', imageCaption: body.imageCaption || '', available: body.available === undefined ? true : body.available === true || body.available === 'true' };
    if (image) {
        data.image = image.url;
        data.imagePublicId = image.publicId;
    }
    return data;
}
async function removePreviousImage(image, publicId) {
    if (publicId) return deleteImage(publicId);
    if (image) removeStoredImage(image);
}
async function listDishes(req, res, next) { try { const filter = {}; if (req.query.type) filter.type = req.query.type; if (req.query.available !== undefined) filter.available = req.query.available === 'true'; const dishes = await Dish.find(filter).populate('category').sort({ createdAt: -1 }); res.json({ success: true, message: 'Dishes retrieved', data: dishes }); } catch (error) { next(error); } }
async function getDish(req, res, next) { try { const dish = await Dish.findById(req.params.id).populate('category'); if (!dish) return res.status(404).json({ success: false, message: 'Dish not found', error: 'Not found' }); res.json({ success: true, message: 'Dish retrieved', data: dish }); } catch (error) { next(error); } }
async function createDish(req, res, next) {
    let uploadedImage;
    try {
        if (!req.body.name || !req.body.description || !req.body.category) return res.status(400).json({ success: false, message: 'Name, description, and category are required', error: 'Validation failed' });
        if (req.file) uploadedImage = await uploadImage(req.file.buffer, 'deeksha-caterers/dishes');
        const dish = await Dish.create(cleanDish(req.body, uploadedImage));
        res.status(201).json({ success: true, message: 'Dish created', data: dish });
    } catch (error) {
        if (uploadedImage) await deleteImage(uploadedImage.publicId);
        next(error);
    }
}
async function updateDish(req, res, next) {
    let uploadedImage;
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) return res.status(404).json({ success: false, message: 'Dish not found', error: 'Not found' });
        const previousImage = dish.image;
        const previousPublicId = dish.imagePublicId;
        if (req.file) uploadedImage = await uploadImage(req.file.buffer, 'deeksha-caterers/dishes');
        const data = cleanDish(req.body, uploadedImage);
        if (!uploadedImage) {
            delete data.image;
            delete data.imagePublicId;
        }
        Object.assign(dish, data);
        await dish.save();
        if (uploadedImage) await removePreviousImage(previousImage, previousPublicId);
        res.json({ success: true, message: 'Dish updated', data: dish });
    } catch (error) {
        if (uploadedImage) await deleteImage(uploadedImage.publicId);
        next(error);
    }
}
async function deleteDish(req, res, next) {
    try {
        const dish = await Dish.findByIdAndDelete(req.params.id);
        if (!dish) return res.status(404).json({ success: false, message: 'Dish not found', error: 'Not found' });
        await removePreviousImage(dish.image, dish.imagePublicId);
        res.json({ success: true, message: 'Dish deleted', data: {} });
    } catch (error) { next(error); }
}
async function listCategories(req, res, next) { try { res.json({ success: true, message: 'Categories retrieved', data: await Category.find().sort({ name: 1 }) }); } catch (error) { next(error); } }
async function createCategory(req, res, next) { try { const category = await Category.create({ name: req.body.name, description: req.body.description }); res.status(201).json({ success: true, message: 'Category created', data: category }); } catch (error) { next(error); } }
async function updateCategory(req, res, next) { try { const category = await Category.findByIdAndUpdate(req.params.id, { name: req.body.name, description: req.body.description }, { new: true, runValidators: true }); if (!category) return res.status(404).json({ success: false, message: 'Category not found', error: 'Not found' }); res.json({ success: true, message: 'Category updated', data: category }); } catch (error) { next(error); } }
async function deleteCategory(req, res, next) { try { const category = await Category.findByIdAndDelete(req.params.id); if (!category) return res.status(404).json({ success: false, message: 'Category not found', error: 'Not found' }); res.json({ success: true, message: 'Category deleted', data: {} }); } catch (error) { next(error); } }
module.exports = { listDishes, getDish, createDish, updateDish, deleteDish, listCategories, createCategory, updateCategory, deleteCategory };
