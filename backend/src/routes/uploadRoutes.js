const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const uploadController = require('../controllers/uploadController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const uploadValidation = require('../validations/uploadValidation');

// Chỉ user đã đăng nhập (có token) mới được gọi API này
router.use(authenticateToken);
// Phân quyền cho upload file/ảnh chat và ảnh khảo sát của Field Inspector
router.use(authorizeRoles('CUSTOMER', 'PROVIDER', 'FIELD_INSPECTOR'));

// Route xử lý upload NHIỀU file cùng lúc 
router.post(
    '/',
    upload.array('files', 10),
    uploadValidation.checkFilesExist,
    uploadController.uploadFile.bind(uploadController)
);

module.exports = router;
