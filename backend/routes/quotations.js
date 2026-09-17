const express = require('express');
const { createQuotation } = require('../controllers/quotationController');
const router = express.Router();
router.post('/', createQuotation);
module.exports = router;
