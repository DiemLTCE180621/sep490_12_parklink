import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import chatService from '../../services/chatService';

const ChatWindow = ({ room, messages, onSendMessage }) => {
    const { user, token } = useAuth();
    const socket = useSocket();
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Gọi API đánh dấu đã xem khi vừa mở phòng hoặc có tin nhắn mới tới
    useEffect(() => {
        if (room && token) {
            chatService.markMessagesAsRead(room.id, token).catch(console.error);
            // Báo qua màng nhĩ Socket cho người kia biết chữ "Đã xem"
            if (socket) {
                socket.emit('mark_read', { roomId: room.id, readerId: user.id });
            }
        }
    }, [room, token, messages.length, socket, user?.id]); 

    if (!room) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50">
                <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-teal-600 text-4xl">💬</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Chào mừng đến với ParkLink Chat</h3>
                <p className="text-slate-500">Hãy chọn một cuộc trò chuyện ở cột bên trái để bắt đầu nhắn tin</p>
            </div>
        );
    }

    const isCustomer = user.role === 'CUSTOMER';
    const otherName = isCustomer ? room.provider.full_name : room.customer.full_name;

    return (
        <div className="flex-1 flex flex-col bg-slate-50/30 h-full relative">
            {/* Header phòng chat */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                        {otherName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 leading-tight">{otherName}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Bãi đỗ: <span className="font-medium">{room.facility.name}</span></p>
                    </div>
                </div>
            </div>

            {/* Vùng hiển thị tin nhắn (Cuộn) */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <p className="bg-white px-4 py-2 rounded-full shadow-sm text-sm border border-slate-100">
                            Chưa có tin nhắn nào. Hãy gửi lời chào! 👋
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatMessage 
                            key={msg.id} 
                            message={msg} 
                            isMine={msg.sender_id === user.id} 
                        />
                    ))
                )}
                {/* Phần neo để tự động cuộn xuống */}
                <div ref={messagesEndRef} />
            </div>

            {/* Khu vực nhập tin nhắn nằm ở dưới cùng */}
            <div className="sticky bottom-0 z-10">
                <ChatInput onSendMessage={onSendMessage} />
            </div>
        </div>
    );
};

export default ChatWindow;
