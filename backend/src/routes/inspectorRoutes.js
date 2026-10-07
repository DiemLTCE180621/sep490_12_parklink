const express = require('express');
const router = express.Router();
const inspectorController = require('../controllers/inspectorController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * Middleware: Chỉ FIELD_INSPECTOR mới có quyền truy cập
 */
router.use(authenticateToken, authorizeRoles('FIELD_INSPECTOR'));

/**
 * Lấy danh sách bãi đỗ xe đang chờ khảo sát
 */
router.get('/facilities/preparing', inspectorController.getPreparingFacilities);

/**
 * Submit kết quả khảo sát
 */
router.put('/facilities/:id/inspect', inspectorController.submitInspection);

module.exports = router;
