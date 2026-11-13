export const validateChatFiles = (files) => {
    if (!files || files.length === 0) return { valid: true };

    if (files.length > 5) {
        return { valid: false, error: 'Chỉ được tải lên tối đa 5 file cùng lúc.' };
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB mỗi file 

    const ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
        'mp4', 'mov', 'webm', 'ogg', 'avi', 'mkv',
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'rtf',
        'zip', 'rar', '7z', 'tar', 'gz',
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

        if (file.size > MAX_SIZE) {
            return { valid: false, error: `File "${fileName}" vượt quá dung lượng tối đa 50MB.` };
        }

        const hasDot = fileName.lastIndexOf('.') !== -1;
        const ext = hasDot ? fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase() : '';

        const isMimeImageOrVideo = file.type?.startsWith('image/') || file.type?.startsWith('video/');

        if (!ALLOWED_EXTENSIONS.includes(ext) && !isMimeImageOrVideo) {
            return { valid: false, error: `Định dạng file "${fileName}" không được hỗ trợ.` };
        }
    }

    return { valid: true };
};

export default validateChatFiles;