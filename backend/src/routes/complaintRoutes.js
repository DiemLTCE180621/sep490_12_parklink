const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { validateCreateComplaint } = require('../validations/complaintValidation');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Route lấy danh sách khiếu nại của khách hàng
router.get(
  '/my-complaints',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  complaintController.getMyComplaints
);

// Route chỉ dành cho Customer tạo khiếu nại
router.post(
  '/',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  validateCreateComplaint,
  complaintController.createComplaint
);

// Route lấy danh sách khiếu nại liên quan đến cơ sở của Provider
router.get(
  '/provider',
  authenticateToken,
  authorizeRoles('PROVIDER'),
  complaintController.getProviderComplaints
);

// Route lấy toàn bộ danh sách khiếu nại cho Admin
router.get(
  '/admin',
  authenticateToken,
  authorizeRoles('ADMIN'),
  complaintController.getAllComplaints
);

module.exports = router;
