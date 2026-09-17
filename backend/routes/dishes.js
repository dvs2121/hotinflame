const express = require('express');
const { listDishes, getDish } = require('../controllers/dishController');
const router = express.Router();
router.get('/', listDishes);
router.get('/:id', getDish);
module.exports = router;
