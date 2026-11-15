const { Server } = require('socket.io');
const chatRepository = require('../repositories/chatRepository');

let ioInstance = null;

const initSocket = (server) => {
    // Khởi tạo Socket.IO với CORS
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    ioInstance = io;

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

            socket.user = decodedUser;
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Client kết nối: ${socket.id}`);
        const userId = socket.user?.id || socket.user?.userId;
        const userRole = socket.user?.role;
        if (userId) {
            socket.join(`user_${userId}`);
            console.log(`[Socket] User ${socket.id} (ID: ${userId}) đã vào phòng user_${userId}`);
        }
        if (userRole) {
            socket.join(`role_${userRole}`);
            console.log(`[Socket] User ${socket.id} (Role: ${userRole}) đã vào phòng role_${userRole}`);
        }

        socket.on('join_room', async (roomId) => {
            const currentUserId = socket.user?.id || socket.user?.userId;
            if (currentUserId && await chatRepository.isUserInRoom(roomId, currentUserId)) {
                socket.join(roomId.toString());
            }
        });

        socket.on('send_message', async (data) => {
            try {
                const { roomId, content, mediaUrl } = data;
                const senderId = socket.user?.id || socket.user?.userId;

                if (!senderId || !roomId || !(await chatRepository.isUserInRoom(roomId, senderId))) {
                    return socket.emit('message_error', { message: 'Không có quyền gửi tin nhắn vào phòng này' });
                }

                const newMessage = await chatRepository.createMessage(
                    Number(roomId),
                    Number(senderId),
                    content,
                    mediaUrl
                );

                if (data.tempId) {
                    newMessage.tempId = data.tempId;
                }

                let broadcaster = io.to(roomId.toString());
                if (newMessage.room) {
                    broadcaster = broadcaster
                        .to(`user_${newMessage.room.customer_id}`)
                        .to(`user_${newMessage.room.provider_id}`);
                }
                broadcaster.emit('receive_message', newMessage);

                if (newMessage.room) {
                    const recipientId = Number(senderId) === Number(newMessage.room.customer_id)
                        ? newMessage.room.provider_id
                        : newMessage.room.customer_id;
                    const recipientUnread = await chatRepository.getUnreadCount(recipientId);
                    io.to(`user_${recipientId}`).emit('unread_chat_count', recipientUnread);
                }
            } catch (error) {
                console.error('[Socket] Lỗi gửi tin nhắn:', error.message);
                socket.emit('message_error', { message: 'Không thể gửi tin nhắn' });
            }
        });

        socket.on('mark_read', async ({ roomId, readerId }) => {
            const currentUserId = socket.user?.id || socket.user?.userId || readerId;
            socket.to(roomId.toString()).emit('messages_read', { roomId, readerId: currentUserId });
            if (currentUserId) {
                const count = await chatRepository.getUnreadCount(Number(currentUserId));
                io.to(`user_${currentUserId}`).emit('unread_chat_count', count);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client ngắt kết nối: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => ioInstance;

module.exports = { initSocket, getIO };
