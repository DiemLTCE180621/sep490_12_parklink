const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateBroadcastPush,
  validateBroadcastEmail,
  validateGetMyNotifications,
  validateMarkAsRead
} = require('../validations/notificationValidation');

//web push noti
router.post(
  '/broadcast-push',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateBroadcastPush,
  notificationController.broadcastPush
);

//email noti
router.post(
  '/broadcast-email',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateBroadcastEmail,
  notificationController.broadcastEmail
);

//get current account noti
router.get(
  '/my',
  authenticateToken,
  validateGetMyNotifications,
  notificationController.getMyNotifications
);

router.put(
  '/read-all',
  authenticateToken,
  notificationController.markAllAsRead
);

//makr one as read
router.put(
  '/:id/read',
  authenticateToken,
  validateMarkAsRead,
  notificationController.markAsRead
);

module.exports = router;
