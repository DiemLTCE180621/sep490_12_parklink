const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const providerController = require('../controllers/providerController');
const { validateUpdateFacility } = require('../validations/providerValidation');

// Phân quyền: CHỈ người dùng có Role là PROVIDER mới có quyền truy cập
router.use(authenticateToken, authorizeRoles('PROVIDER'));

// Các endpoint nghiệp vụ của Provider
router.get('/my-facility', providerController.getMyFacility);
router.put('/my-facility', validateUpdateFacility, providerController.updateMyFacility);
router.put('/facilities/:id/payment-confirm', adminController.confirmPayment);

module.exports = router;
