const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const {
  validateCreateReview,
  validateUpdateReview,
  validateReplyReview
} = require('../validations/reviewValidation');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/facility/:facility_id', reviewController.getReviewsByFacilityId);

router.get(
  '/my-review/:facility_id',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  reviewController.getMyReview
);

router.get(
  '/admin',
  authenticateToken,
  authorizeRoles('ADMIN'),
  reviewController.getAllReviewsAdmin
);

router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  reviewController.updateReviewStatus
);

router.patch(
  '/:id/unhide',
  authenticateToken,
  authorizeRoles('ADMIN'),
  reviewController.unhideReview
);

router.get(
  '/provider',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  reviewController.getProviderReviews
);

router.post(
  '/:id/reply',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateReplyReview,
  reviewController.replyToReview
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateCreateReview,
  reviewController.createReview
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateUpdateReview,
  reviewController.updateReview
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  reviewController.deleteReview
);

module.exports = router;
