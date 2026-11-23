const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const uploadController = require('../controllers/uploadController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const uploadValidation = require('../validations/uploadValidation');

router.use(authenticateToken);
router.use(authorizeRoles('CUSTOMER', 'PROVIDER', 'FIELD_INSPECTOR', 'ADMIN'));

// Route xử lý upload NHIỀU file cùng lúc 
router.post(
    '/',
    upload.array('files', 10),
    uploadValidation.checkFilesExist,
    uploadController.uploadFile.bind(uploadController)
);

module.exports = router;
