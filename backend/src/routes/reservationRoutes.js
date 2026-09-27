const express = require('express');
const router = express.Router();

const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreateReservation,
  validateRespondReservation
} = require('../validations/reservationValidation');

/**
  * Route: GET /api/reservations/available-facilities
  * Lấy danh sách các bãi đỗ xe công khai đã được duyệt ở Ninh Kiều, Cần Thơ cho Customer chọn gửi yêu cầu
  */
 router.get('/available-facilities', reservationController.getAvailableFacilities);

/**
 * Route: POST /api/reservations
 * 1. [CUSTOMER] Send reservation request (Gửi yêu cầu thuê bãi đỗ xe)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateCreateReservation,
  reservationController.createReservation
);

/**
 * Route: GET /api/reservations và GET /api/reservations/my-requests
 * 2. [CUSTOMER] View reservation requests (Xem danh sách yêu cầu thuê của mình)
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  reservationController.getMyReservations
);

router.get(
  '/my-requests',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  reservationController.getMyReservations
);

/**
 * Route: GET /api/reservations/provider-requests
 * [PROVIDER / ADMIN] Xem danh sách Yêu cầu thuê gửi tới bãi của mình
 */
router.get(
  '/provider-requests',
  authenticateToken,
  authorizeRoles('PROVIDER', 'ADMIN'),
  reservationController.getProviderReservations
);

/**
 * Route: GET /api/reservations/:id
 * 3. [CUSTOMER / PROVIDER / ADMIN] View detail reservation requests (Xem chi tiết 1 yêu cầu thuê)
 */
router.get(
  '/:id',
  authenticateToken,
  reservationController.getReservationById
);

/**
 * Route: PATCH /api/reservations/:id/cancel & PUT /api/reservations/:id/cancel
 * 4. [CUSTOMER] Cancel pending reservation request (Hủy yêu cầu thuê đang chờ duyệt)
 */
router.patch(
  '/:id/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  reservationController.cancelReservation
);

router.put(
  '/:id/cancel',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  reservationController.cancelReservation
);

/**
 * Route: PATCH /api/reservations/:id/status
 * Chủ bãi đỗ xe (PROVIDER / ADMIN) chấp nhận (APPROVED) hoặc từ chối (REJECTED) Yêu cầu thuê
 */
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('PROVIDER', 'ADMIN'),
  validateRespondReservation,
  reservationController.respondReservation
);

module.exports = router;
