import React, { useState, useRef } from 'react';
import { Paperclip, Image as ImageIcon, Send, Loader2 } from 'lucide-react';
import { validateChatFiles } from '../../validations/chatValidation';

const ChatInput = ({ onSendMessage }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const imageInputRef = useRef(null);
    const docInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;
        
        // Gọi validation để kiểm tra file ngay tại Frontend
        const validation = validateChatFiles(selectedFiles);
        if (!validation.valid) {
            alert(validation.error);
            e.target.value = '';
            return;
        }
        
        // Gửi ngay lập tức giống Zalo
        setLoading(true);
        try {
            await onSendMessage('', selectedFiles);
        } catch (error) {
            console.error('Lỗi gửi file', error);
            alert('Có lỗi xảy ra khi gửi file đính kèm');
        } finally {
            e.target.value = ''; // Reset input
            setLoading(false);
        }
    };

    const handleSendText = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        setLoading(true);
        try {
            await onSendMessage(text, []);
            setText('');
        } catch (error) {
            console.error('Lỗi gửi tin nhắn', error);
            alert('Có lỗi xảy ra khi gửi tin nhắn');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSendText} className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-2">
                {/* Nút gửi ảnh & video */}
                <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors focus:outline-none"
                    disabled={loading}
                    title="Gửi hình ảnh/video"
                >
                    <ImageIcon size={20} />
                </button>
                <input
                    type="file"
                    multiple
                    ref={imageInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                />

                {/* Nút gửi File & Tài liệu (chuẩn Zalo) */}
                <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="p-2.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors focus:outline-none"
                    disabled={loading}
                    title="Gửi file, tài liệu (Word, Excel, PDF, Zip...)"
                >
                    <Paperclip size={20} />
                </button>
                <input
                    type="file"
                    multiple
                    ref={docInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip"
                />
                
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-slate-100 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-full px-5 py-2.5 outline-none transition-all"
                    disabled={loading}
                />
                
                <button
                    type="submit"
                    disabled={loading || !text.trim()}
                    className="p-2.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 flex items-center justify-center min-w-[44px]"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                </button>
            </div>
        </form>
    );
};

export default ChatInput;
