const chatRepository = require('../repositories/chatRepository');

const prisma = require('../config/prisma');

class ChatService {
    async getOrCreateRoom(data) {
        const { customerId, facilityId } = data;
        let providerId = data.providerId;
        if (!providerId || providerId === 28) {
            const facility = await prisma.facility.findUnique({ where: { id: Number(facilityId) } });
            if (!facility) throw new Error('Bãi đỗ xe không tồn tại trong hệ thống');
            providerId = facility.provider_id;
        }

        return await chatRepository.findOrCreateRoom(Number(customerId), Number(providerId), Number(facilityId));
    }

    async getUserRooms(userId) {
        if (!userId) throw new Error('Không tìm thấy userId');
        return await chatRepository.getUserRooms(Number(userId));
    }

    async getRoomMessages(roomId) {
        if (!roomId) throw new Error('Không tìm thấy roomId');
        return await chatRepository.getRoomMessages(Number(roomId));
    }

    async markMessagesAsRead(roomId, userId) {
        return await chatRepository.markMessagesAsRead(Number(roomId), Number(userId));
    }

    async getUnreadCount(userId) {
        return await chatRepository.getUnreadCount(Number(userId));
    }
}

module.exports = new ChatService();
