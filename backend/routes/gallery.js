const express = require('express');
const { listGallery, getGallery } = require('../controllers/galleryController');
const router = express.Router();

router.get('/', listGallery);
router.get('/:id', getGallery);

module.exports = router;
