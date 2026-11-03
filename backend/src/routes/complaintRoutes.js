const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const {
  validateCreateComplaint,
  validateReplyComplaint,
  validateUpdateComplaintStatus,
  validateEscalateComplaint
} = require('../validations/complaintValidation');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get(
  '/my-complaints',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  complaintController.getMyComplaints
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateCreateComplaint,
  complaintController.createComplaint
);

// chuyển cấp khiếu nại lên Admin (Chỉ dành cho Customer)
router.post(
  '/:id/escalate',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateEscalateComplaint,
  complaintController.escalateComplaint
);

router.get(
  '/provider',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  complaintController.getProviderComplaints
);

router.get(
  '/admin',
  authenticateToken,
  authorizeRoles('ADMIN'),
  complaintController.getAllComplaints
);

router.post(
  '/:id/reply',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER'),
  validateReplyComplaint,
  complaintController.replyToComplaint
);

router.patch(
  '/:id/reply',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER'),
  validateReplyComplaint,
  complaintController.replyToComplaint
);

router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER'),
  validateUpdateComplaintStatus,
  complaintController.updateComplaintStatus
);

// Endpoint cập nhật trạng thái khiếu nại dành riêng cho Admin
router.patch(
  '/admin/:id/status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validateUpdateComplaintStatus,
  complaintController.updateComplaintStatusByAdmin
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'PROVIDER', 'CUSTOMER'),
  complaintController.getComplaintById
);

module.exports = router;
