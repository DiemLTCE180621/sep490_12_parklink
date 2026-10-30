import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, MapPin } from 'lucide-react';

const ChatList = ({ rooms, activeRoomId, onSelectRoom }) => {
    const { user } = useAuth();

    return (
        <div className="w-[350px] border-r border-slate-200 bg-slate-50/50 flex flex-col h-full shrink-0">
            <div className="p-5 border-b border-slate-200 bg-white flex items-center gap-3">
                <div className="bg-teal-100 p-2 rounded-xl text-teal-600">
                    <MessageCircle size={24} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">Tin nhắn</h2>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {rooms.length === 0 ? (
                    <div className="p-8 text-slate-400 flex flex-col items-center gap-3 text-center mt-10">
                        <MessageCircle size={40} className="text-slate-300" strokeWidth={1.5} />
                        <p className="text-sm font-medium">Chưa có cuộc trò chuyện nào.</p>
                    </div>
                ) : (
                    rooms.map((room) => {
                        const userRoleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
                        const isCustomer = userRoleName === 'CUSTOMER';
                        const otherName = isCustomer ? room.provider.full_name : room.customer.full_name;
                        const isActive = room.id === activeRoomId;

                        return (
                            <div
                                key={room.id}
                                onClick={() => onSelectRoom(room.id)}
                                className={`p-4 border-b border-slate-100 cursor-pointer transition-all ${isActive ? 'bg-white border-l-4 border-l-teal-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.02)]' : 'hover:bg-slate-100 border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-teal-400 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                                        {otherName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="font-bold text-slate-800 text-base truncate">{otherName}</h3>
                                        <p className="text-xs text-slate-500 mt-1 truncate flex items-center gap-1.5">
                                            <MapPin size={12} className="text-teal-500 shrink-0" />
                                            {room.facility.name}
                                        </p>
                                        
                                        {/* Hiển thị tin nhắn mới nhất */}
                                        <div className="flex justify-between items-center mt-1.5 gap-2">
                                            <p className={`text-[13px] truncate ${room._count?.messages > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                                {room.messages?.[0]?.content 
                                                    ? room.messages[0].content 
                                                    : (room.messages?.[0]?.media_url ? '[File đính kèm]' : 'Chưa có tin nhắn')}
                                            </p>
                                            
                                            {/* Hiển thị số lượng tin chưa đọc giống Zalo */}
                                            {room._count?.messages > 0 && (
                                                <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[20px] text-center">
                                                    {room._count.messages > 5 ? '5+' : room._count.messages}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatList;
