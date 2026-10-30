const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { validateCreateReview, validateUpdateReview } = require('../validations/reviewValidation');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * 1. Guest/Customer/Owner/Admin đều xem được (View facility reviews)
 */
router.get('/facility/:facility_id', reviewController.getReviewsByFacilityId);

/**
 * 1.1 Customer lấy bài đánh giá của chính mình tại bãi xe (kể cả khi đang bị ẩn chờ duyệt)
 */
router.get(
  '/my-review/:facility_id',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  reviewController.getMyReview
);

/**
 * 2. Admin xem toàn bộ đánh giá cơ sở
 */
router.get(
  '/admin',
  authenticateToken,
  authorizeRoles('ADMIN'),
  reviewController.getAllReviewsAdmin
);

/**
 * 2.1 Admin cập nhật trạng thái hiển thị (Ẩn/Hiện) hoặc gỡ cắm cờ
 */
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  reviewController.updateReviewStatus
);

/**
 * 3. Provider xem đánh giá các bãi xe của mình
 */
router.get(
  '/provider',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  reviewController.getProviderReviews
);

/**
 * 4. Chỉ Customer mới được Viết / Sửa / Xóa review
 */
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
