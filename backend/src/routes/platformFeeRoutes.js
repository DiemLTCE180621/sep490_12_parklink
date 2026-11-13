const express = require('express');
const router = express.Router();
const platformFeeController = require('../controllers/platformFeeController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreatePlatformFee,
  validateUpdatePlatformFee
} = require('../validations/platformFeeValidation');

/**
 * Tính phí dựa trên số slot
 */
router.get(
  '/calculate',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER'),
  platformFeeController.calculateFee
);

router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER'),
  platformFeeController.getAllFees
);

router.get(
  '/active',
  platformFeeController.getActiveFees
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER'),
  platformFeeController.getFeeById
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateCreatePlatformFee,
  platformFeeController.createFee
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateUpdatePlatformFee,
  platformFeeController.updateFee
);

router.patch(
  '/:id/toggle-status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  platformFeeController.toggleFeeStatus
);

module.exports = router;
