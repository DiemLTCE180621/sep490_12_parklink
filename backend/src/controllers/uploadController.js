class UploadController {
    // Trả về link Cloudinary sau khi upload thành công
    async uploadFile(req, res) {
        try {
            // Duyệt qua mảng req.files để lấy toàn bộ đường link Cloudinary
            const mediaUrls = req.files.map(file => file.path);

            // Trả mảng link ảnh/file về cho Frontend
            res.json({
                success: true,
                message: 'Tải file lên thành công',
                data: {
                    mediaUrls: mediaUrls // Trả về dạng mảng link
                }
            });
        } catch (error) {
            console.error("[Upload] Lỗi:", error);
            res.status(500).json({ success: false, message: 'Lỗi upload file lên mây' });
        }
    }
}

module.exports = new UploadController();
