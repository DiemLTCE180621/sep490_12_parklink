const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const vehicleTypeController = require('../controllers/vehicleTypeController');
const {
  validateRegisterCustomer,
  validateRegisterProvider,
  validateLogin,
  validateChangePassword,
  validateForgotPasswordRequest,
  validateVerifyResetPassword,
  validateUpdateProfile,
  validateGoogleLogin
} = require('../validations/authValidation');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/amenities', authController.getAmenities);

// Lấy danh mục loại phương tiện hệ thống (Bảng vehicle_types)
router.get('/vehicle-types', vehicleTypeController.getActiveVehicleTypes);

// Lấy thông tin liên hệ hệ thống (Email, Hotline Admin)
router.get('/contact-info', authController.getContactInfo);

router.post('/register/customer', validateRegisterCustomer, authController.registerCustomer);

router.post('/register/provider', validateRegisterProvider, authController.registerProvider);

router.post('/login', validateLogin, authController.login);

router.post('/google-login', validateGoogleLogin, authController.googleLogin);

router.post('/forgot-password/request', validateForgotPasswordRequest, authController.requestPasswordReset);

router.post('/forgot-password/verify-reset', validateVerifyResetPassword, authController.verifyAndResetPassword);

router.post('/change-password', authenticateToken, validateChangePassword, authController.changePassword);

router.get('/profile', authenticateToken, authController.getMe);
router.get('/me', authenticateToken, authController.getMe);

router.put('/profile', authenticateToken, validateUpdateProfile, authController.updateProfile);

router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
