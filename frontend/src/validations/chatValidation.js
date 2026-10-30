export const validateChatFiles = (files) => {
    // Nếu không có file thì hợp lệ (chỉ gửi tin nhắn văn bản)
    if (!files || files.length === 0) return { valid: true };

    // Giới hạn số lượng file gửi cùng lúc (tối đa 5 file)
    if (files.length > 5) {
        return { valid: false, error: 'Chỉ được tải lên tối đa 5 file cùng lúc.' };
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB mỗi file (chuẩn Zalo)

    // Các định dạng đuôi file được hỗ trợ (chuẩn Zalo)
    const ALLOWED_EXTENSIONS = [
        // Ảnh
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
        // Video
        'mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv',
        // Tài liệu văn phòng
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'rtf',
        // File nén
        'zip', 'rar', '7z', 'tar', 'gz',
        // Text & Code
        'txt', 'json', 'xml', 'md'
    ];

    // Kiểm tra từng file trong danh sách
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const fileName = (file.name || 'Tep_dinh_kem').trim();

        // 1. Kiểm tra file rỗng (0 bytes)
        if (file.size === 0) {
            return { valid: false, error: `File "${fileName}" bị rỗng hoặc dung lượng bằng 0.` };
        }

        // 2. Kiểm tra dung lượng vượt quá 50MB
        if (file.size > MAX_SIZE) {
            return { valid: false, error: `File "${fileName}" vượt quá dung lượng tối đa 50MB.` };
        }

        // 3. Trích xuất phần mở rộng của file an toàn
        const hasDot = fileName.lastIndexOf('.') !== -1;
        const ext = hasDot ? fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase() : '';

        // 4. Kiểm tra loại MIME nếu trình duyệt nhận diện được là media
        const isMimeImageOrVideo = file.type?.startsWith('image/') || file.type?.startsWith('video/');

        // 5. Nếu không thuộc danh sách đuôi file cho phép và không phải MIME image/video thì chặn
        if (!ALLOWED_EXTENSIONS.includes(ext) && !isMimeImageOrVideo) {
            return { valid: false, error: `Định dạng file "${fileName}" không được hỗ trợ.` };
        }
    }

    return { valid: true };
};

export default validateChatFiles;