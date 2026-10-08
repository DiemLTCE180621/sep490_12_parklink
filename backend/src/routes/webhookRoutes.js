const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

/**
 * Endpoint nhận Webhook từ SePay / Casso
 * (Không cần Authentication vì ngân hàng gọi vào đây)
 */
router.post('/sepay', webhookController.handlePaymentWebhook);

module.exports = router;
