const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');

// API Public: Tìm kiếm bãi đỗ xe theo keyword, location (Guest/Customer)
router.get('/search', facilityController.searchFacilities);

// API Public: Lấy danh sách tiện ích để filter
router.get('/amenities', facilityController.getAllAmenities);

module.exports = router;
