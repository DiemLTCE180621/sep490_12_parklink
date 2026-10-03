import React from 'react';
import { useAuth } from '../../context/AuthContext';

const ChatList = ({ rooms, activeRoomId, onSelectRoom }) => {
    const { user } = useAuth();

    return (
        <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col h-full">
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Tin nhắn</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {rooms.length === 0 ? (
                    <p className="p-4 text-slate-500 text-center">Chưa có cuộc trò chuyện nào.</p>
                ) : (
                    rooms.map((room) => {
                        // Xác định tên người đang chat cùng (Khách hoặc Chủ bãi)
                        const isCustomer = user?.role?.name === 'CUSTOMER';
                        const otherName = isCustomer ? room.provider.full_name : room.customer.full_name;
                        const isActive = room.id === activeRoomId;

                        return (
                            <div
                                key={room.id}
                                onClick={() => onSelectRoom(room.id)}
                                className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${isActive ? 'bg-teal-50' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{otherName}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                            Bãi đỗ: {room.facility.name}
                                        </p>
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
