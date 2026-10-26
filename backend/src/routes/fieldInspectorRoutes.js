const express = require('express');
const router = express.Router();
const fieldInspectorController = require('../controllers/fieldInspectorController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * Middleware: Chỉ ADMIN mới có quyền thực hiện các thao tác quản lý Field Inspector này
 */
router.use(authenticateToken, authorizeRoles('ADMIN'));

/**
 * UC-86: Create Field Inspector account (Tạo tài khoản Nhân viên khảo sát)
 */
router.post('/', fieldInspectorController.createFieldInspector);

/**
 * UC-87: View Field Inspector accounts list (Xem danh sách Nhân viên khảo sát)
 */
router.get('/', fieldInspectorController.getFieldInspectors);

/**
 * Lấy danh sách Nhân viên khảo sát đang hoạt động (ACTIVE) phục vụ phân công
 */
router.get('/active', fieldInspectorController.getActiveInspectors);

/**
 * UC-88: Update Field Inspector information (Cập nhật thông tin Nhân viên khảo sát)
 */
router.put('/:id', fieldInspectorController.updateFieldInspector);

module.exports = router;
