const chatService = require('../services/chatService');

class ChatController {
    async getUserRooms(req, res) {
        try {
            const userId = req.user?.userId || req.query.userId;
            console.log("=> API getUserRooms called for userId:", userId);
            if (!userId) throw new Error('Không có thông tin userId');

            const rooms = await chatService.getUserRooms(userId);
            console.log("=> Returning rooms count:", rooms.length);
            res.json({ success: true, data: rooms });
        } catch (error) {
            console.error("=> API getUserRooms Error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getRoomMessages(req, res) {
        try {
            const { roomId } = req.params;
            const messages = await chatService.getRoomMessages(roomId);
            res.json({ success: true, data: messages });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // Tìm hoặc tạo phòng chat mới
    async getOrCreateRoom(req, res) {
        try {
            const data = req.body; // { customerId, providerId, facilityId }
            console.log("=> API getOrCreateRoom called with:", data);
            const room = await chatService.getOrCreateRoom(data);
            console.log("=> Room created/found:", room.id);
            res.json({ success: true, data: room });
        } catch (error) {
            console.error("=> API getOrCreateRoom Error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async markMessagesAsRead(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user?.userId || req.body.userId;
            await chatService.markMessagesAsRead(roomId, userId);

            if (userId) {
                const { getIO } = require('../config/socket');
                const io = getIO();
                if (io) {
                    const count = await chatService.getUnreadCount(userId);
                    io.to(`user_${userId}`).emit('unread_chat_count', count);
                }
            }

            res.json({ success: true, message: 'Đã cập nhật trạng thái đã xem' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.userId || req.user?.id;
            if (!userId) throw new Error('Không có thông tin userId');
            const count = await chatService.getUnreadCount(userId);
            res.json({ success: true, count });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ChatController();
