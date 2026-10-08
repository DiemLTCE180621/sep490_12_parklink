const { Server } = require('socket.io');
const chatRepository = require('../repositories/chatRepository');

const initSocket = (server) => {
    // Khởi tạo Socket.IO với CORS
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'parklink_secret_key_2026';

    // Middleware bảo mật Socket
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
            if (err) {
                return next(new Error('Authentication error: Invalid token'));
            }

            // Kiểm tra phân quyền: Chỉ cho phép CUSTOMER và PROVIDER
            const role = decodedUser.role;
            if (role !== 'CUSTOMER' && role !== 'PROVIDER') {
                return next(new Error('Authorization error: You do not have permission to chat'));
            }

            socket.user = decodedUser;
            next();
        });
    });

    // Lắng nghe kết nối từ client
    io.on('connection', (socket) => {
        console.log(`[Socket] Client kết nối: ${socket.id}`);

        // Client yêu cầu tham gia phòng chat
        socket.on('join_room', (roomId) => {
            socket.join(roomId.toString());
            console.log(`[Socket] User ${socket.id} đã vào phòng: ${roomId}`);
        });

        // Client gửi tin nhắn mới
        socket.on('send_message', async (data) => {
            try {
                const { roomId, senderId, content, mediaUrl } = data;

                const newMessage = await chatRepository.createMessage(
                    Number(roomId),
                    Number(senderId),
                    content,
                    mediaUrl
                );

                if (data.tempId) {
                    newMessage.tempId = data.tempId;
                }

                io.to(roomId.toString()).emit('receive_message', newMessage);

                console.log(`[Socket] Đã phát tin nhắn vào phòng ${roomId}`);
            } catch (error) {
                console.error('[Socket] Lỗi gửi tin nhắn:', error.message);
                socket.emit('message_error', { message: 'Không thể gửi tin nhắn' });
            }
        });

        // Lắng nghe sự kiện người dùng báo đã xem
        socket.on('mark_read', ({ roomId, readerId }) => {
            socket.to(roomId.toString()).emit('messages_read', { roomId, readerId });
            console.log(`[Socket] Đã báo Đã xem cho phòng ${roomId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client ngắt kết nối: ${socket.id}`);
        });
    });

    return io;
};

module.exports = { initSocket };
