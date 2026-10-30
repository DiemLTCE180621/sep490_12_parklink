import React, { useState, memo } from 'react';
import { Download } from 'lucide-react';

// Component con hiển thị ảnh có chức năng phóng to (Lightbox) - tách ra ngoài tránh re-mount
const ImagePreview = ({ url }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <img 
                src={url} 
                alt="Đính kèm" 
                onClick={() => setIsOpen(true)}
                className="max-w-[240px] max-h-56 rounded-xl border border-slate-200 object-cover cursor-zoom-in hover:opacity-95 shadow-sm transition-opacity" 
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
                    <button 
                        type="button"
                        className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold backdrop-blur-md transition-colors"
                    >
                        ×
                    </button>
                </div>
            )}
        </>
    );
};

// Hàm phân tích thông tin tệp (URL, loại file, tên file, đuôi file)
const parseMediaItem = (rawUrl) => {
    const uTrim = rawUrl.trim();
    if (!uTrim) return null;

    let cleanUrl = uTrim;
    let explicitType = null;
    let customName = null;

    // Phân tích nếu là URL preview tạm thời có gắn hash (#type=...&name=...)
    if (uTrim.includes('#')) {
        const [base, hash] = uTrim.split('#');
        cleanUrl = base;
        const params = new URLSearchParams(hash);
        explicitType = params.get('type');
        customName = params.get('name') ? decodeURIComponent(params.get('name')) : null;
    }

    // Lấy tên file gốc
    let fileName = customName;
    if (!fileName) {
        const rawFileName = cleanUrl.split('/').pop() || 'Tệp đính kèm';
        // Bỏ tiền tố timestamp ví dụ 1712345678901_Bao_Cao.pdf -> Bao_Cao.pdf
        fileName = decodeURIComponent(rawFileName).replace(/^\d+_/, '');
    }

    // Lấy phần mở rộng (extension)
    const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';

    // Xác định kiểu file (Image, Video, Document)
    let type = 'doc';
    if (explicitType === 'image') {
        type = 'image';
    } else if (explicitType === 'video') {
        type = 'video';
    } else if (explicitType === 'doc') {
        type = 'doc';
    } else {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        const videoExtensions = ['mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv'];

        if (imageExtensions.includes(ext) || cleanUrl.includes('/image/upload/')) {
            type = 'image';
        } else if (videoExtensions.includes(ext) || cleanUrl.includes('/video/upload/')) {
            type = 'video';
        } else {
            type = 'doc';
        }
    }

    return {
        url: cleanUrl,
        type,
        fileName,
        ext: ext.toUpperCase() || 'FILE'
    };
};

// Định dạng màu sắc badge của file theo chuẩn Zalo
const getDocBadgeStyle = (ext) => {
    switch (ext) {
        case 'PDF':
            return {
                bg: 'bg-red-50 text-red-600 border-red-200',
                label: 'PDF'
            };
        case 'DOC':
        case 'DOCX':
            return {
                bg: 'bg-blue-50 text-blue-600 border-blue-200',
                label: ext
            };
        case 'XLS':
        case 'XLSX':
        case 'CSV':
            return {
                bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                label: ext
            };
        case 'PPT':
        case 'PPTX':
            return {
                bg: 'bg-orange-50 text-orange-600 border-orange-200',
                label: ext
            };
        case 'ZIP':
        case 'RAR':
        case '7Z':
        case 'TAR':
        case 'GZ':
            return {
                bg: 'bg-amber-50 text-amber-600 border-amber-200',
                label: ext
            };
        case 'TXT':
        case 'JSON':
        case 'XML':
        case 'MD':
            return {
                bg: 'bg-slate-100 text-slate-700 border-slate-200',
                label: ext
            };
        default:
            return {
                bg: 'bg-teal-50 text-teal-600 border-teal-200',
                label: ext || 'FILE'
            };
    }
};

const ChatMessage = ({ message, isMine }) => {
    // Hàm xử lý hiển thị ảnh, video hoặc file văn phòng chuẩn Zalo
    const renderMedia = (url) => {
        if (!url) return null;
        
        // Tách chuỗi URL (vì backend trả mảng ghép bằng dấu phẩy)
        const urls = typeof url === 'string' ? url.split(',') : url;
        
        return (
            <div className="flex flex-wrap gap-2.5 mt-2">
                {urls.map((rawUrl, idx) => {
                    const item = parseMediaItem(rawUrl);
                    if (!item) return null;

                    if (item.type === 'image') {
                        return <ImagePreview key={idx} url={item.url} />;
                    } 
                    
                    if (item.type === 'video') {
                        return (
                            <video 
                                key={idx} 
                                src={item.url} 
                                controls 
                                className="max-w-xs rounded-xl border border-slate-200 shadow-sm" 
                            />
                        );
                    } 
                    
                    // Xử lý các loại File (PDF, DOCX, XLSX, ZIP...) chuẩn Zalo
                    const badge = getDocBadgeStyle(item.ext);

                    return (
                        <a 
                            key={idx} 
                            href={item.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            download={item.fileName}
                            title={`Tải xuống ${item.fileName}`}
                            className={`flex items-center gap-3.5 p-3 rounded-2xl shadow-sm border transition-all max-w-[320px] group ${
                                isMine 
                                    ? 'bg-white hover:bg-slate-50 border-blue-200' 
                                    : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-[12px] uppercase tracking-wider shrink-0 border shadow-xs ${badge.bg}`}>
                                {badge.label}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden pr-1">
                                <p className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-teal-600 transition-colors">
                                    {item.fileName}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                                    {message.is_sending ? (
                                        <span className="text-amber-500 animate-pulse">Đang tải lên...</span>
                                    ) : (
                                        <>
                                            <Download size={12} className="text-teal-500 shrink-0" />
                                            <span>Nhấn để xem / tải về</span>
                                        </>
                                    )}
                                </p>
                            </div>
                            {!message.is_sending && (
                                <div className="p-2 text-slate-400 group-hover:text-teal-600 group-hover:bg-teal-50 rounded-full transition-colors shrink-0">
                                    <Download size={16} />
                                </div>
                            )}
                        </a>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={`flex w-full mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'} ${message.is_sending ? 'opacity-70' : 'opacity-100'}`}>
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

// Sử dụng React.memo để chỉ re-render tin nhắn có thay đổi (vd: trạng thái is_read thay đổi), tránh re-render cả danh sách
export default memo(ChatMessage);
