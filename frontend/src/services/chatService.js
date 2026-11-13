import axios from 'axios';

const API_URL = 'http://localhost:5000/api/chats'; 

const chatService = {
    getUserRooms: async (token) => {
        const response = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getRoomMessages: async (roomId, token) => {
        const response = await axios.get(`${API_URL}/${roomId}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getOrCreateRoom: async (customerId, providerId, facilityId, token) => {
        const response = await axios.post(
            `${API_URL}/room`,
            { customerId, providerId, facilityId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    },

    markMessagesAsRead: async (roomId, token) => {
        const response = await axios.put(
            `${API_URL}/${roomId}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    },

    // Lấy tổng số tin nhắn chưa đọc
    getUnreadCount: async (token) => {
        const response = await axios.get(`${API_URL}/unread-count`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default chatService;
