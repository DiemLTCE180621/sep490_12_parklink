import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import chatService from '../../services/chatService';
import { MessageSquareText, MapPin } from 'lucide-react';

const ChatWindow = ({ room, messages, onSendMessage }) => {
    const { user, token } = useAuth();
    const socket = useSocket();
    const scrollContainerRef = useRef(null);

    // Tự động cuộn xuống tin nhắn mới nhất mà không làm trang web bị cuộn theo
    useEffect(() => {
        const scrollToBottom = () => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
        };
        
        // Đợi DOM render xong mới cuộn xuống cuối
        const timeoutId = setTimeout(scrollToBottom, 50);
        return () => clearTimeout(timeoutId);
    }, [messages]);

    // Đánh dấu đã xem khi có tin nhắn chưa đọc từ người khác (tối ưu: không gọi API thừa khi gửi tin của mình)
    useEffect(() => {
        if (!room || !token || !user) return;

        const hasUnreadFromOther = (room._count?.messages > 0) || 
            messages.some(m => !m.is_read && Number(m.sender_id) !== Number(user.id));

        if (hasUnreadFromOther) {
            chatService.markMessagesAsRead(room.id, token).catch(console.error);
            if (socket) {
                socket.emit('mark_read', { roomId: room.id, readerId: user.id });
            }
        }
    }, [room?.id, token, messages, socket, user?.id, room?._count?.messages]); 

    if (!room) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"></div>
                </div>

                {/* Glassmorphic Card */}
                <div className="relative z-10 flex flex-col items-center text-center p-12 rounded-3xl backdrop-blur-xl bg-white/60 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-md w-full mx-4">
                    <div className="relative mb-8">
                        {/* Pulse Ring Animation */}
                        <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-28 h-28 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30">
                            <MessageSquareText className="text-white" size={56} strokeWidth={1.5} />
                        </div>
                    </div>
                    
                    <h3 className="text-3xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600 tracking-tight">
                        ParkLink Chat
                    </h3>
                    <p className="text-slate-500 font-medium">
                        Chọn một cuộc trò chuyện để bắt đầu nhắn tin.
                    </p>
                </div>
            </div>
        );
    }

    const userRoleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
    const isCustomer = userRoleName === 'CUSTOMER';
    const otherName = isCustomer ? room.provider.full_name : room.customer.full_name;

    return (
        <div className="flex-1 flex flex-col bg-slate-50/30 h-full overflow-hidden">
            {/* Header phòng chat (Cố định) */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-tr from-teal-500 to-teal-400 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                        {otherName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-extrabold text-slate-800 text-lg leading-tight">{otherName}</h2>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                            <MapPin size={14} className="text-teal-500" />
                            {room.facility.name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Vùng hiển thị tin nhắn (Cuộn) */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                        <MessageSquareText size={32} className="text-slate-300 opacity-70" />
                        <p className="bg-white px-5 py-2.5 rounded-full shadow-sm text-sm border border-slate-100 font-medium">
                            Chưa có tin nhắn nào. Hãy gửi lời chào! 👋
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatMessage 
                            key={msg.id} 
                            message={msg} 
                            isMine={Number(msg.sender_id) === Number(user?.id)} 
                        />
                    ))
                )}
            </div>

            {/* Khu vực nhập tin nhắn nằm ở dưới cùng */}
            <div className="shrink-0 bg-white z-10 border-t border-slate-200">
                <ChatInput onSendMessage={onSendMessage} />
            </div>
        </div>
    );
};

export default ChatWindow;
