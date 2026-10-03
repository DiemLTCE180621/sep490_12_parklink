import React from 'react';

const ChatMessage = ({ message, isMine }) => {
    // Hàm xử lý hiển thị ảnh, video hoặc pdf
    const renderMedia = (url) => {
        if (!url) return null;
        
        // Tách chuỗi URL (vì backend trả mảng ghép bằng dấu phẩy)
        const urls = typeof url === 'string' ? url.split(',') : url;
        
        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {urls.map((u, idx) => {
                    const uTrim = u.trim();
                    const lowerUrl = uTrim.toLowerCase();
                    const isPdf = lowerUrl.endsWith('.pdf');
                    const isVideo = lowerUrl.endsWith('.mp4');

                    if (isPdf) {
                        return (
                            <a key={idx} href={uTrim} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-100 text-slate-700 p-2 rounded-lg hover:bg-slate-200 shadow-sm border border-slate-200">
                                📎 <span className="underline text-sm font-medium">Xem tài liệu PDF</span>
                            </a>
                        );
                    } else if (isVideo) {
                        return (
                            <video key={idx} src={uTrim} controls className="max-w-xs rounded-lg border border-slate-200 shadow-sm" />
                        );
                    } else {
                        return (
                            <a key={idx} href={uTrim} target="_blank" rel="noreferrer">
                                <img src={uTrim} alt="Đính kèm" className="max-w-[200px] max-h-48 rounded-lg border border-slate-200 object-cover cursor-pointer hover:opacity-90 shadow-sm" />
                            </a>
                        );
                    }
                })}
            </div>
        );
    };

    return (
        <div className={`flex w-full mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                {message.content && (
                    <div className={`px-4 py-2 text-sm md:text-base rounded-2xl shadow-sm ${isMine ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                        {message.content}
                    </div>
                )}
                {renderMedia(message.media_url)}
                
                <span className="text-[11px] text-slate-400 mt-1 flex items-center">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMine && (
                        <span className="ml-1 flex items-center">
                            {message.is_read ? ' • Đã xem' : ' • Đã gửi'}
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
};

export default ChatMessage;
