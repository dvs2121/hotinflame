const express = require('express');
const { listCategories } = require('../controllers/dishController');
const router = express.Router();
router.get('/', listCategories);
module.exports = router;
