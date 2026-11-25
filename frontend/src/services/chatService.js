import api from './api';

const chatService = {
    getUserRooms: async (token) => {
        return api.get('/chats', {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    getRoomMessages: async (roomId, token) => {
        return api.get(`/chats/${roomId}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    getOrCreateRoom: async (customerId, providerId, facilityId, token) => {
        return api.post(
            '/chats/room',
            { customerId, providerId, facilityId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    markMessagesAsRead: async (roomId, token) => {
        return api.put(
            `/chats/${roomId}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },

    // Lấy tổng số tin nhắn chưa đọc
    getUnreadCount: async (token) => {
        return api.get('/chats/unread-count', {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};

export default chatService;
