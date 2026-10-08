import React from 'react';

const ChatMessage = ({ message, isMine }) => {
    // Component con để hiển thị ảnh có chức năng phóng to (Lightbox) như Zalo
    const ImagePreview = ({ url }) => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
            <>
                <img 
                    src={url} 
                    alt="Đính kèm" 
                    onClick={() => setIsOpen(true)}
                    className="max-w-[200px] max-h-48 rounded-xl border border-slate-200 object-cover cursor-zoom-in hover:opacity-90 shadow-sm transition-opacity" 
                />
                {isOpen && (
                    <div 
                        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    >
                        <img 
                            src={url} 
                            alt="Phóng to" 
                            className="max-w-full max-h-[95vh] object-contain rounded-md shadow-2xl"
                        />
                        <button className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold backdrop-blur-md transition-colors">
                            ×
                        </button>
                    </div>
                )}
            </>
        );
    };

    // Hàm xử lý hiển thị ảnh, video hoặc file các loại
    const renderMedia = (url) => {
        if (!url) return null;
        
        // Tách chuỗi URL (vì backend trả mảng ghép bằng dấu phẩy)
        const urls = typeof url === 'string' ? url.split(',') : url;
        
        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {urls.map((u, idx) => {
                    const uTrim = u.trim();
                    const lowerUrl = uTrim.toLowerCase();
                    
                    // Phân loại file (Dựa vào đuôi hoặc định dạng URL của Cloudinary)
                    const isImage = lowerUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) || (lowerUrl.includes('res.cloudinary.com') && lowerUrl.includes('/image/upload/')) || uTrim.startsWith('blob:');
                    const isVideo = lowerUrl.match(/\.(mp4|webm|ogg|mov)$/i) || (lowerUrl.includes('res.cloudinary.com') && lowerUrl.includes('/video/upload/'));

                    if (isImage) {
                        return <ImagePreview key={idx} url={uTrim} />;
                    } else if (isVideo) {
                        return (
                            <video key={idx} src={uTrim} controls className="max-w-xs rounded-xl border border-slate-200 shadow-sm" />
                        );
                    } else {
                        // Xử lý các loại File khác (PDF, DOCX, ZIP...) hiển thị dạng Block giống Zalo
                        // Lấy tên file từ URL (đoạn sau cùng) để hiển thị
                        let fileName = uTrim.split('/').pop() || 'Tệp đính kèm';
                        // Nếu là URL Cloudinary có thể dài ngoằng, ta rút gọn bớt
                        if (fileName.length > 25) fileName = fileName.substring(0, 25) + '...';

                        // Trích xuất đuôi file để làm icon (ví dụ: PDF, DOC)
                        const fileExt = fileName.includes('.') ? fileName.split('.').pop().substring(0, 4).toUpperCase() : 'FILE';

                        return (
                            <a key={idx} href={uTrim} target="_blank" rel="noreferrer" 
                               className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors max-w-[280px]">
                                <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-[11px] uppercase border border-teal-100">
                                    {fileExt}
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <p className="text-[13px] font-semibold text-slate-700 truncate" title={uTrim}>
                                        {fileName}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Nhấn để tải hoặc xem</p>
                                </div>
                            </a>
                        );
                    }
                })}
            </div>
        );
    };

    return (
        <div className={`flex w-full mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'} ${message.is_sending ? 'opacity-60' : 'opacity-100'}`}>
                {message.content && (
                    <div className={`px-4 py-2.5 text-sm md:text-[15px] rounded-xl shadow-sm ${isMine ? 'bg-[#e5efff] border border-[#bfe0ff] text-slate-800' : 'bg-white border border-slate-200 text-slate-800'}`}>
                        {message.content}
                    </div>
                )}
                {renderMedia(message.media_url)}
                
                <span className="text-[11px] text-slate-400 mt-1 flex items-center">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMine && (
                        <span className="ml-1 flex items-center">
                            {message.is_sending 
                                ? ' • Đang gửi...' 
                                : (message.is_read ? ' • Đã xem' : ' • Đã gửi')}
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
};

export default ChatMessage;
