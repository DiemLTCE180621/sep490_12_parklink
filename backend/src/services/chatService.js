const chatRepository = require('../repositories/chatRepository');

class ChatService {
    //tìm hoặc tạo phòng chat
    async getOrCreateRoom(data) {
        const { customerId, providerId, facilityId } = data;
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
