const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { validateCreateReview, validateUpdateReview } = require('../validations/reviewValidation');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * Guest/Customer/Owner/Admin đều xem được (View facility reviews)
 */
router.get('/facility/:facility_id', reviewController.getReviewsByFacilityId);

router.use(authenticateToken); // Bắt buộc đăng nhập
router.use(authorizeRoles('CUSTOMER')); //  chỉ Customer mới được Viết/Sửa/Xóa review 

router.post(
  '/',
  validateCreateReview,
  reviewController.createReview
);

router.put(
  '/:id',
  validateUpdateReview,
  reviewController.updateReview
);

router.delete(
  '/:id',
  reviewController.deleteReview
);

module.exports = router;
