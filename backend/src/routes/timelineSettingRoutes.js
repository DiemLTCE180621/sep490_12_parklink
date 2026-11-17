const express = require('express');
const router = express.Router();
const timelineSettingController = require('../controllers/timelineSettingController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, timelineSettingController.getSettings);
router.put('/', authenticateToken, authorizeRoles('ADMIN'), timelineSettingController.updateSettings);

module.exports = router;
