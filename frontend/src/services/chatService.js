import axios from 'axios';

const API_URL = 'http://localhost:5000/api/chats'; // Hoặc lấy từ biến môi trường

const chatService = {
    // Lấy danh sách các cuộc trò chuyện của user hiện tại
    getUserRooms: async (token) => {
        const response = await axios.get(API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Lấy lịch sử tin nhắn của một phòng cụ thể
    getRoomMessages: async (roomId, token) => {
        const response = await axios.get(`${API_URL}/${roomId}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Tìm hoặc tạo phòng chat mới khi bấm từ trang Chi tiết bãi đỗ
    getOrCreateRoom: async (customerId, providerId, facilityId, token) => {
        const response = await axios.post(
            `${API_URL}/room`,
            { customerId, providerId, facilityId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    },

    // Cập nhật trạng thái tin nhắn thành "Đã xem"
    markMessagesAsRead: async (roomId, token) => {
        const response = await axios.put(
            `${API_URL}/${roomId}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    }
};

export default chatService;
