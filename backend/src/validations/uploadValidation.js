class UploadValidation {
    // Kiểm tra xem request có đính kèm file hay chưa
    checkFilesExist(req, res, next) {
        // req.files có được là nhờ middleware upload.array() của multer chạy trước đó
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Chưa đính kèm file nào hoặc file không hợp lệ'
            });
        }
        next(); //cho phép đi tiếp vào Controller
    }
}

module.exports = new UploadValidation();
