const prisma = require('../config/prisma');

class ChatRepository {
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

    async isUserInRoom(roomId, userId) {
        if (!roomId || !userId) return false;
        return Boolean(await prisma.chat_Room.findFirst({
            where: { id: Number(roomId), OR: [{ customer_id: Number(userId) }, { provider_id: Number(userId) }] },
            select: { id: true }
        }));
    }

    async getUserRooms(userId) {
        const rooms = await prisma.chat_Room.findMany({
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
            }
        });

        // sort tin nhắn mới lên đầu
        return rooms.sort((a, b) => {
            const timeA = a.messages?.[0]?.created_at
                ? new Date(a.messages[0].created_at).getTime()
                : new Date(a.created_at).getTime();
            const timeB = b.messages?.[0]?.created_at
                ? new Date(b.messages[0].created_at).getTime()
                : new Date(b.created_at).getTime();
            return timeB - timeA;
        });
    }

    async getRoomMessages(roomId) {
        return await prisma.message.findMany({
            where: { room_id: roomId },
            orderBy: { created_at: 'asc' },
            include: {
                sender: { select: { id: true, full_name: true } }
            }
        });
    }

    // save tin nhắn mới vào db
    async createMessage(roomId, senderId, content, mediaUrl = null) {
        return await prisma.message.create({
            data: {
                room_id: roomId,
                sender_id: senderId,
                content,
                media_url: mediaUrl
            },
            include: {
                sender: { select: { id: true, full_name: true } },
                room: { select: { customer_id: true, provider_id: true } }
            }
        });
    }

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

    // lấy tổng chat chưa đọc của user
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
