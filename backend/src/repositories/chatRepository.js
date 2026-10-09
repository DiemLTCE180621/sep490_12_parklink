const prisma = require('../config/prisma');

class ChatRepository {
    // Tìm hoặc tạo phòng chat giữa customer và provider cho 1 facility cụ thể
    async findOrCreateRoom(customerId, providerId, facilityId) {
        let room = await prisma.chat_Room.findFirst({
            where: {
                customer_id: customerId,
                provider_id: providerId,
                facility_id: facilityId
            }
        });

        if (!room) {
            room = await prisma.chat_Room.create({
                data: {
                    customer_id: customerId,
                    provider_id: providerId,
                    facility_id: facilityId
                }
            });
        }
        return room;
    }

    // Lấy danh sách phòng chat của 1 user (dù là customer hay provider)
    async getUserRooms(userId) {
        return await prisma.chat_Room.findMany({
            where: {
                OR: [
                    { customer_id: userId },
                    { provider_id: userId }
                ]
            },
            include: {
                customer: { select: { id: true, full_name: true } },
                provider: { select: { id: true, full_name: true } },
                facility: { select: { id: true, name: true } },
                messages: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                is_read: false,
                                sender_id: { not: userId }
                            }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });
    }

    // Lấy lịch sử tin nhắn của 1 phòng
    async getRoomMessages(roomId) {
        return await prisma.message.findMany({
            where: { room_id: roomId },
            orderBy: { created_at: 'asc' },
            include: {
                sender: { select: { id: true, full_name: true } }
            }
        });
    }

    // Lưu tin nhắn mới vào database
    async createMessage(roomId, senderId, content, mediaUrl = null) {
        return await prisma.message.create({
            data: {
                room_id: roomId,
                sender_id: senderId,
                content,
                media_url: mediaUrl
            },
            include: {
                sender: { select: { id: true, full_name: true } }
            }
        });
    }

    // Đánh dấu tất cả tin nhắn trong phòng (của người kia gửi) là đã đọc
    async markMessagesAsRead(roomId, currentUserId) {
        return await prisma.message.updateMany({
            where: {
                room_id: roomId,
                sender_id: { not: currentUserId },
                is_read: false
            },
            data: {
                is_read: true
            }
        });
    }

    // Lấy tổng số tin nhắn chưa đọc của một user
    async getUnreadCount(userId) {
        return await prisma.message.count({
            where: {
                is_read: false,
                sender_id: { not: userId },
                room: {
                    OR: [
                        { customer_id: userId },
                        { provider_id: userId }
                    ]
                }
            }
        });
    }
}

module.exports = new ChatRepository();
