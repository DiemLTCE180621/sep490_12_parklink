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

// API Public: Lấy chi tiết bãi đỗ xe
router.get('/:id', facilityController.getFacilityDetails);

// API Protected: Lấy thông tin số chỗ còn trống (yêu cầu Customer login)
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
router.get('/:id/availability', authenticateToken, authorizeRoles('CUSTOMER'), facilityController.getFacilityAvailability);

module.exports = router;
