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
 * Route: GET /api/reservations/provider-requests & /api/reservations/provider/requests
 * 1. [PROVIDER] View customer reservation requests (Xem danh sách yêu cầu thuê của khách hàng gửi tới bãi xe)
 */
router.get(
  '/provider-requests',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  reservationController.getProviderReservations
);

router.get(
  '/provider/requests',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  reservationController.getProviderReservations
);

/**
 * Route: GET /api/reservations/:id
 * [CUSTOMER / PROVIDER / ADMIN] View detail reservation requests (Xem chi tiết 1 yêu cầu thuê)
 */
router.get(
  '/:id',
  authenticateToken,
  reservationController.getReservationById
);

/**
 * Route: PATCH /api/reservations/:id/cancel & PUT /api/reservations/:id/cancel
 * [CUSTOMER] Cancel pending reservation request (Hủy yêu cầu thuê đang chờ duyệt)
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
 * Route: PATCH & PUT /api/reservations/:id/accept
 * 2. [PROVIDER] Accept reservation request (Chấp nhận yêu cầu thuê)
 */
router.patch(
  '/:id/accept',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  reservationController.acceptReservation
);

router.put(
  '/:id/accept',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  reservationController.acceptReservation
);

/**
 * Route: PATCH & PUT /api/reservations/:id/reject
 * 3. [PROVIDER] Reject reservation request (Từ chối yêu cầu thuê)
 */
router.patch(
  '/:id/reject',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  reservationController.rejectReservation
);

router.put(
  '/:id/reject',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  reservationController.rejectReservation
);

/**
 * Route: PATCH /api/reservations/:id/status
 * [PROVIDER] Phản hồi yêu cầu thuê tùy chọn (APPROVED / REJECTED)
 */
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  validateRespondReservation,
  reservationController.respondReservation
);

module.exports = router;
