const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const uploadController = require('../controllers/uploadController');

const { authenticateToken } = require('../middlewares/authMiddleware');
const uploadValidation = require('../validations/uploadValidation');

// Chỉ user đã đăng nhập (có token) mới được gọi API này
router.use(authenticateToken);

// Route xử lý upload NHIỀU file cùng lúc 
router.post(
    '/',
    upload.array('files', 4),
    uploadValidation.checkFilesExist,
    uploadController.uploadFile.bind(uploadController)
);

module.exports = router;
