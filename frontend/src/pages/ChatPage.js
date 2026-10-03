import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import chatService from '../services/chatService';
import uploadService from '../services/uploadService';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';

const ChatPage = () => {
    const { token, user } = useAuth();
    const socket = useSocket();
    const [rooms, setRooms] = useState([]);
    const [activeRoomId, setActiveRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    
    const location = useLocation();
    const initialRoomId = location.state?.activeRoomId;

    // Tự động chọn phòng nếu có truyền state từ trang khác sang
    useEffect(() => {
        if (initialRoomId && rooms.length > 0) {
            setActiveRoomId(initialRoomId);
        }
    }, [initialRoomId, rooms]);

    // 1. Lấy danh sách phòng chat khi vừa vào trang
    useEffect(() => {
        if (!token) return;
        const fetchRooms = async () => {
            try {
                const res = await chatService.getUserRooms(token);
                if (res.success) {
                    setRooms(res.data);
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách phòng chat", error);
            }
        };
        fetchRooms();
    }, [token]);

    // 2. Lấy lịch sử tin nhắn khi bấm chọn 1 phòng bên cột trái
    useEffect(() => {
        if (!activeRoomId || !token) return;
        const fetchMessages = async () => {
            try {
                const res = await chatService.getRoomMessages(activeRoomId, token);
                if (res.success) {
                    setMessages(res.data);
                }
            } catch (error) {
                console.error("Lỗi lấy tin nhắn", error);
            }
        };
        fetchMessages();
    }, [activeRoomId, token]);

    // 3. Lắng nghe tin nhắn mới tới qua màng nhĩ Socket
    useEffect(() => {
        if (!socket) return;

        // Báo cho Server biết mình muốn tham gia nhận tin nhắn của tất cả các phòng mình có
        rooms.forEach(room => socket.emit('join_room', room.id));

        const handleReceiveMessage = (newMessage) => {
            // Nếu tin nhắn thuộc về phòng MÌNH ĐANG MỞ -> Cập nhật hiển thị lên màn hình
            if (activeRoomId && Number(newMessage.room_id) === Number(activeRoomId)) {
                setMessages(prev => [...prev, newMessage]);
                
                // Nếu mình đang mở phòng và đối phương gửi tới -> Đánh dấu Đã xem ngay lập tức
                if (newMessage.sender_id !== user.id) {
                    chatService.markMessagesAsRead(activeRoomId, token).catch(console.error);
                    socket.emit('mark_read', { roomId: activeRoomId, readerId: user.id });
                }
            } else {
                // Nếu tin nhắn nằm ở phòng khác -> Có thể làm hiệu ứng nháy đỏ thông báo chưa đọc ở đây
                console.log("Có tin nhắn mới từ phòng khác", newMessage.room_id);
            }
        };

        const handleMessagesRead = ({ roomId, readerId }) => {
            if (activeRoomId && Number(roomId) === Number(activeRoomId)) {
                setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('messages_read', handleMessagesRead);

        // Cleanup function: Tắt lắng nghe khi tắt trang
        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket, rooms, activeRoomId, user?.id, token]);

    // 4. Xử lý hành động bấm nút GỬI (chữ hoặc file)
    const handleSendMessage = async (text, files) => {
        if (!activeRoomId || !socket) return;

        let mediaUrls = [];
        
        // BƯỚC A: NẾU CÓ FILE -> Đẩy lên mây qua API Upload trước
        if (files && files.length > 0) {
            const uploadRes = await uploadService.uploadFiles(files, token);
            if (uploadRes.success) {
                mediaUrls = uploadRes.data.mediaUrls;
            }
        }

        // BƯỚC B: Bắn tin nhắn (chữ + link mây) qua Socket
        // Backend đang nhận chuỗi, nên mình ghép mảng URL thành chuỗi cách nhau bởi dấu phẩy
        const finalMediaUrl = mediaUrls.length > 0 ? mediaUrls.join(',') : null;
        
        socket.emit('send_message', {
            roomId: activeRoomId,
            senderId: user.id,
            content: text,
            mediaUrl: finalMediaUrl
        });
    };

    // Tìm thông tin phòng đang mở để truyền cho ChatWindow
    const activeRoom = rooms.find(r => r.id === activeRoomId);

    return (
        <div className="max-w-7xl mx-auto py-8 h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8">
            <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <ChatList 
                    rooms={rooms} 
                    activeRoomId={activeRoomId} 
                    onSelectRoom={setActiveRoomId} 
                />
                <ChatWindow 
                    room={activeRoom} 
                    messages={messages} 
                    onSendMessage={handleSendMessage} 
                />
            </div>
        </div>
    );
};

export default ChatPage;
