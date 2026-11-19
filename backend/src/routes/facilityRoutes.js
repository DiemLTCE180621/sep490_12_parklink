const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

//view map and search
router.get('/search', authenticateToken, authorizeRoles('CUSTOMER'), facilityController.searchFacilities);

router.get('/amenities', facilityController.getAllAmenities);

router.get('/compare', authenticateToken, authorizeRoles('CUSTOMER'), facilityController.compareFacilities);

router.get('/:id', authenticateToken, authorizeRoles('CUSTOMER'), facilityController.getFacilityDetails);

router.get('/:id/availability', authenticateToken, authorizeRoles('CUSTOMER'), facilityController.getFacilityAvailability);

module.exports = router;
