const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const providerController = require('../controllers/providerController');

router.use(authenticateToken, authorizeRoles('PROVIDER'));

router.put('/facilities/:id/payment-confirm', adminController.confirmPayment);
router.put('/my-facility', providerController.updateMyFacility);

module.exports = router;
