const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenityController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreateAmenity,
  validateUpdateAmenity
} = require('../validations/amenityValidation');

router.get('/active', amenityController.getActiveAmenities);

router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  amenityController.getAllAmenities
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateCreateAmenity,
  amenityController.createAmenity
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateUpdateAmenity,
  amenityController.updateAmenity
);

router.patch(
  '/:id/toggle-status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  amenityController.toggleAmenityStatus
);

module.exports = router;
