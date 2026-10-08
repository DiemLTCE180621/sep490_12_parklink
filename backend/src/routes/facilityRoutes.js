const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');

// API Public: Tìm kiếm bãi đỗ xe theo keyword, location (Guest/Customer)
router.get('/search', facilityController.searchFacilities);

// API Public: Lấy danh sách tiện ích để filter
router.get('/amenities', facilityController.getAllAmenities);

// API Public: So sánh 2–4 bãi đỗ xe (Function 3.41)
// Query param: ?ids=1,2,3
router.get('/compare', facilityController.compareFacilities);

// API Public: Lấy chi tiết 1 bãi đỗ xe
router.get('/:id', facilityController.getFacilityById);

module.exports = router;
