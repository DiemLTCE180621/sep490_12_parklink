class ChatValidation {
    // Kiểm tra dữ liệu đầu vào khi tạo phòng chat
    validateCreateRoom(req, res, next) {
        const { customerId, facilityId } = req.body;
        if (!customerId || !facilityId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin customerId hoặc facilityId'
            });
        }
        next();
    }

    // Kiểm tra dữ liệu đầu vào khi đánh dấu đã xem
    validateMarkAsRead(req, res, next) {
        const { roomId } = req.params;
        const userId = req.user.id;

        if (!roomId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin roomId hoặc không xác định được người dùng'
            });
        }
        next();
    }
}

module.exports = new ChatValidation();
