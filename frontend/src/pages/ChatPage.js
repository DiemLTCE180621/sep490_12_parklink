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

    // Tự động chọn phòng nếu có truyền state từ trang khác sang (chỉ chọn lần đầu tiên)
    useEffect(() => {
        if (initialRoomId && rooms.length > 0 && !activeRoomId) {
            setActiveRoomId(initialRoomId);
        }
    }, [initialRoomId, rooms, activeRoomId]);

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

        // Xóa số đếm tin nhắn chưa đọc khi mở phòng này
        setRooms(prevRooms => prevRooms.map(r => {
            if (Number(r.id) === Number(activeRoomId)) {
                return { ...r, _count: { ...r._count, messages: 0 } };
            }
            return r;
        }));
    }, [activeRoomId, token]);

    // Ref để lưu danh sách phòng mới nhất cho socket (tránh re-render liên tục làm rớt sự kiện)
    const roomsRef = React.useRef(rooms);
    useEffect(() => {
        roomsRef.current = rooms;
    }, [rooms]);

    // 3. Lắng nghe tin nhắn mới tới qua màng nhĩ Socket
    useEffect(() => {
        if (!socket) return;

        const joinRooms = () => {
            roomsRef.current.forEach(room => socket.emit('join_room', room.id));
        };

        // Chạy ngay lần đầu
        if (socket.connected) joinRooms();

        // Chạy mỗi khi socket bị rớt và kết nối lại
        socket.on('connect', joinRooms);
        const handleReceiveMessage = (newMessage) => {
            if (activeRoomId && Number(newMessage.room_id) === Number(activeRoomId)) {
                // Xóa đúng tin nhắn giả (is_sending) dựa vào tempId trước khi thêm tin thật
                setMessages(prev => {
                    let wasRead = false;
                    const filtered = prev.filter(m => {
                        const isMatch = (newMessage.tempId && m.id === newMessage.tempId) || 
                                        (m.is_sending && m.content === newMessage.content);
                        if (isMatch) {
                            if (m.is_read) wasRead = true; // Lưu lại trạng thái Đã xem nếu bị chênh lệch nhịp Socket
                            return false;
                        }
                        return true;
                    });
                    return [...filtered, { ...newMessage, is_read: wasRead || newMessage.is_read }];
                });

                // Nếu mình đang mở phòng và đối phương gửi tới -> Đánh dấu Đã xem ngay lập tức
                if (newMessage.sender_id !== user.id) {
                    chatService.markMessagesAsRead(activeRoomId, token).catch(console.error);
                    socket.emit('mark_read', { roomId: activeRoomId, readerId: user.id });
                }
            }

            // Cập nhật lại danh sách phòng bên trái (Nhảy lên đầu + hiển thị tin nhắn mới nhất)
            setRooms(prevRooms => {
                const updatedRooms = prevRooms.map(r => {
                    if (Number(r.id) === Number(newMessage.room_id)) {
                        const isMe = newMessage.sender_id === user.id;
                        // Nếu đối phương gửi và mình ĐANG KHÔNG mở phòng đó -> Tăng số tin chưa đọc lên 1
                        const currentCount = r._count?.messages || 0;
                        const newCount = (!isMe && Number(newMessage.room_id) !== Number(activeRoomId)) 
                                         ? currentCount + 1 : currentCount;
                        
                        return {
                            ...r,
                            messages: [newMessage], // Cập nhật tin nhắn mới nhất
                            _count: { ...r._count, messages: newCount }
                        };
                    }
                    return r;
                });
                
                // Sắp xếp lại: Phòng nào có tin nhắn mới nhất thì đưa lên đầu tiên
                return updatedRooms.sort((a, b) => {
                    const timeA = a.messages?.[0]?.created_at || a.created_at;
                    const timeB = b.messages?.[0]?.created_at || b.created_at;
                    return new Date(timeB) - new Date(timeA);
                });
            });
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
            socket.off('connect', joinRooms);
            socket.off('receive_message', handleReceiveMessage);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket, activeRoomId, user?.id, token]);

    // 4. Xử lý hành động bấm nút GỬI (chữ hoặc file) theo kiểu Optimistic UI
    const handleSendMessage = async (text, files) => {
        if (!activeRoomId || !socket) return;

        // BƯỚC 1: TẠO FAKE MESSAGE CHO GIAO DIỆN (CHẠY TỨC THÌ)
        let localPreviewUrls = [];
        if (files && files.length > 0) {
            localPreviewUrls = Array.from(files).map(file => URL.createObjectURL(file));
        }

        const tempId = 'temp_' + Date.now();
        const fakeMessage = {
            id: tempId,
            room_id: activeRoomId,
            sender_id: user.id,
            content: text,
            media_url: localPreviewUrls.length > 0 ? localPreviewUrls.join(',') : null,
            created_at: new Date().toISOString(),
            is_sending: true // Đánh dấu tin nhắn đang được gửi
        };

        // Đẩy ra màn hình ngay lập tức
        setMessages(prev => [...prev, fakeMessage]);

        // BƯỚC 2: ÂM THẦM CHẠY BACKGROUND ĐỂ UP LÊN SERVER
        try {
            let finalMediaUrl = null;
            if (files && files.length > 0) {
                const uploadRes = await uploadService.uploadFiles(files, token);
                if (uploadRes.success) {
                    finalMediaUrl = uploadRes.data.mediaUrls.join(',');
                }
            }

            // Gửi qua Socket khi đã có link thật
            socket.emit('send_message', {
                roomId: activeRoomId,
                senderId: user.id,
                content: text,
                mediaUrl: finalMediaUrl,
                tempId: tempId
            });
        } catch (error) {
            console.error("Lỗi gửi tin nhắn:", error);
        }
    };

    // Tìm thông tin phòng đang mở để truyền cho ChatWindow
    const activeRoom = rooms.find(r => r.id === activeRoomId);

    return (
        <div className="w-full bg-white border-b border-slate-200">
            <div className="flex w-full h-[75vh] min-h-[600px]">
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
