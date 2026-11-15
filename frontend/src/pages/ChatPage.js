import React, { useState, useEffect, useRef } from 'react';
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

    const activeRoomIdRef = useRef(activeRoomId);
    activeRoomIdRef.current = activeRoomId;

    const userRef = useRef(user);
    userRef.current = user;

    const tokenRef = useRef(token);
    tokenRef.current = token;

    const roomsRef = useRef(rooms);
    roomsRef.current = rooms;

    useEffect(() => {
        if (initialRoomId && rooms.length > 0 && !activeRoomId) {
            setActiveRoomId(initialRoomId);
        }
    }, [initialRoomId, rooms, activeRoomId]);

    useEffect(() => {
        if (!token) return;
        let isMounted = true;
        const fetchRooms = async () => {
            try {
                const res = await chatService.getUserRooms(token);
                if (isMounted && res.success) {
                    setRooms(res.data);
                }
            } catch (error) {
                console.error("Lỗi lấy danh sách phòng chat", error);
            }
        };
        fetchRooms();
        return () => {
            isMounted = false;
        };
    }, [token]);

    useEffect(() => {
        if (!activeRoomId || !token) return;
        let isMounted = true;

        const fetchMessages = async () => {
            try {
                const res = await chatService.getRoomMessages(activeRoomId, token);
                if (isMounted && res.success) {
                    setMessages(res.data);
                }
                await chatService.markMessagesAsRead(activeRoomId, token).catch(console.error);
                if (socket) {
                    socket.emit('mark_read', { roomId: activeRoomId, readerId: user?.id });
                }
            } catch (error) {
                console.error("Lỗi lấy tin nhắn", error);
            }
        };
        fetchMessages();

        setRooms(prevRooms => prevRooms.map(r => {
            if (Number(r.id) === Number(activeRoomId)) {
                return { ...r, _count: { ...r._count, messages: 0 } };
            }
            return r;
        }));

        return () => {
            isMounted = false;
        };
    }, [activeRoomId, token, socket, user?.id]);

    const bringRoomToTop = (roomId, latestMessage, isIncoming = false) => {
        setRooms(prevRooms => {
            const currentActiveRoomId = activeRoomIdRef.current;
            const currentUser = userRef.current;
            const currentToken = tokenRef.current;

            const roomIndex = prevRooms.findIndex(r => Number(r.id) === Number(roomId));

            if (roomIndex === -1) {
                if (currentToken) {
                    chatService.getUserRooms(currentToken).then(res => {
                        if (res.success) setRooms(res.data);
                    });
                }
                return prevRooms;
            }

            const targetRoom = prevRooms[roomIndex];
            const isMe = Number(latestMessage.sender_id) === Number(currentUser?.id);
            const currentCount = targetRoom._count?.messages || 0;

            const newCount = (isIncoming && !isMe && Number(roomId) !== Number(currentActiveRoomId))
                ? currentCount + 1
                : (Number(roomId) === Number(currentActiveRoomId) ? 0 : currentCount);

            const updatedTargetRoom = {
                ...targetRoom,
                messages: [latestMessage],
                _count: { ...targetRoom._count, messages: newCount }
            };

            const otherRooms = prevRooms.filter((_, idx) => idx !== roomIndex);
            return [updatedTargetRoom, ...otherRooms];
        });
    };

    useEffect(() => {
        if (socket && socket.connected && rooms.length > 0) {
            rooms.forEach(room => socket.emit('join_room', room.id));
        }
    }, [rooms, socket]);

    useEffect(() => {
        if (!socket) return;

        const joinRooms = () => {
            roomsRef.current.forEach(room => socket.emit('join_room', room.id));
        };

        if (socket.connected && roomsRef.current.length > 0) {
            joinRooms();
        }

        const handleReceiveMessage = (newMessage) => {
            const currentActiveRoomId = activeRoomIdRef.current;
            const currentUser = userRef.current;
            const currentToken = tokenRef.current;

            if (currentActiveRoomId && Number(newMessage.room_id) === Number(currentActiveRoomId)) {
                setMessages(prev => {
                    if (newMessage.id && prev.some(m => m.id === newMessage.id)) {
                        return prev;
                    }

                    let wasRead = false;
                    const filtered = prev.filter(m => {
                        const isMatch = (newMessage.tempId && m.id === newMessage.tempId) ||
                            (m.is_sending && m.content === newMessage.content && Number(m.sender_id) === Number(newMessage.sender_id));
                        if (isMatch) {
                            if (m.is_read) wasRead = true; // Giữ lại trạng thái Đã xem
                            return false;
                        }
                        return true;
                    });
                    return [...filtered, { ...newMessage, is_read: wasRead || newMessage.is_read }];
                });

                if (Number(newMessage.sender_id) !== Number(currentUser?.id)) {
                    chatService.markMessagesAsRead(currentActiveRoomId, currentToken).catch(console.error);
                    socket.emit('mark_read', { roomId: currentActiveRoomId, readerId: currentUser?.id });
                }
            }

            bringRoomToTop(newMessage.room_id, newMessage, true);
        };

        const handleMessagesRead = ({ roomId }) => {
            const currentActiveRoomId = activeRoomIdRef.current;
            if (currentActiveRoomId && Number(roomId) === Number(currentActiveRoomId)) {
                setMessages(prev => {
                    const hasUnread = prev.some(m => !m.is_read);
                    if (!hasUnread) return prev;
                    return prev.map(m => m.is_read ? m : { ...m, is_read: true });
                });
            }
        };

        socket.on('connect', joinRooms);
        socket.on('receive_message', handleReceiveMessage);
        socket.on('messages_read', handleMessagesRead);

        return () => {
            socket.off('connect', joinRooms);
            socket.off('receive_message', handleReceiveMessage);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket]);

    const handleSendMessage = async (text, files) => {
        if (!activeRoomId || !socket) return;

        let localPreviewUrls = [];
        if (files && files.length > 0) {
            localPreviewUrls = Array.from(files).map(file => {
                const isImg = file.type?.startsWith('image/');
                const isVid = file.type?.startsWith('video/');
                const tag = isImg ? 'image' : (isVid ? 'video' : 'doc');
                const safeName = encodeURIComponent(file.name);
                return `${URL.createObjectURL(file)}#type=${tag}&name=${safeName}`;
            });
        }

        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const fakeMessage = {
            id: tempId,
            room_id: activeRoomId,
            sender_id: user.id,
            content: text,
            media_url: localPreviewUrls.length > 0 ? localPreviewUrls.join(',') : null,
            created_at: new Date().toISOString(),
            is_sending: true
        };

        setMessages(prev => [...prev, fakeMessage]);
        bringRoomToTop(activeRoomId, fakeMessage, false);

        try {
            let finalMediaUrl = null;
            if (files && files.length > 0) {
                const uploadRes = await uploadService.uploadFiles(files, token);
                if (uploadRes.success) {
                    finalMediaUrl = uploadRes.data.mediaUrls.join(',');
                }
            }

            socket.emit('send_message', {
                roomId: activeRoomId,
                senderId: user.id,
                content: text,
                mediaUrl: finalMediaUrl,
                tempId: tempId
            });
        } catch (error) {
            console.error("Lỗi gửi tin nhắn:", error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert(error.message || 'Không thể tải file lên. Vui lòng thử lại.');
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
