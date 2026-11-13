const express = require('express');
const router = express.Router();

const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateReservationId,
  validateCreateReservation,
  validateRespondReservation
} = require('../validations/reservationValidation');

router.get('/available-facilities', reservationController.getAvailableFacilities);

router.post('/',authenticateToken,authorizeRoles('CUSTOMER'), validateCreateReservation, reservationController.createReservation);

router.get('/',authenticateToken,authorizeRoles('CUSTOMER'),reservationController.getMyReservations);

router.get('/my-requests',authenticateToken,authorizeRoles('CUSTOMER'),reservationController.getMyReservations);

router.get('/provider-requests',authenticateToken,authorizeRoles('PROVIDER'),reservationController.getProviderReservations);

router.get('/provider/requests',authenticateToken,authorizeRoles('PROVIDER'),reservationController.getProviderReservations);

router.get('/:id',authenticateToken,validateReservationId,reservationController.getReservationById);

router.patch('/:id/cancel', authenticateToken, authorizeRoles('CUSTOMER'), validateReservationId, reservationController.cancelReservation);

router.patch('/:id/accept', authenticateToken, authorizeRoles('PROVIDER'), validateReservationId, reservationController.acceptReservation);

router.patch('/:id/reject', authenticateToken, authorizeRoles('PROVIDER'), validateReservationId, reservationController.rejectReservation);

router.patch('/:id/status',authenticateToken,authorizeRoles('PROVIDER'),validateReservationId,validateRespondReservation,reservationController.respondReservation);

module.exports = router;
