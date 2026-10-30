const chatRepository = require('../repositories/chatRepository');

const prisma = require('../config/prisma');

class ChatService {
    //tìm hoặc tạo phòng chat
    async getOrCreateRoom(data) {
        const { customerId, facilityId } = data;
        let providerId = data.providerId;

        // Tự động tìm provider_id thật từ Database nếu Frontend không gửi lên (hoặc gửi sai)
        if (!providerId || providerId === 28) {
            const facility = await prisma.facility.findUnique({ where: { id: Number(facilityId) } });
            if (!facility) throw new Error('Bãi đỗ xe không tồn tại trong hệ thống');
            providerId = facility.provider_id;
        }

        return await chatRepository.findOrCreateRoom(Number(customerId), Number(providerId), Number(facilityId));
    }

    //lấy danh sách phòng chat của người dùng
    async getUserRooms(userId) {
        if (!userId) throw new Error('Không tìm thấy userId');
        return await chatRepository.getUserRooms(Number(userId));
    }

    // lấy lịch sử tin nhắn trong phòng
    async getRoomMessages(roomId) {
        if (!roomId) throw new Error('Không tìm thấy roomId');
        return await chatRepository.getRoomMessages(Number(roomId));
    }

    //đánh dấu đã đọc
    async markMessagesAsRead(roomId, userId) {
        return await chatRepository.markMessagesAsRead(Number(roomId), Number(userId));
    }
}

module.exports = new ChatService();
