export const validateChatFiles = (files) => {
    // Nếu không có file thì vẫn hợp lệ (chỉ gửi chữ)
    if (!files || files.length === 0) return { valid: true };

    // Giới hạn số lượng
    if (files.length > 4) {
        return { valid: false, error: 'Chỉ được tải lên tối đa 4 file cùng lúc.' };
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'video/mp4',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];

    // Kiểm tra từng file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_SIZE) {
            return { valid: false, error: `File "${file.name}" vượt quá dung lượng 5MB.` };
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return { valid: false, error: `Định dạng file "${file.name}" không được hỗ trợ.` };
        }
    }

    return { valid: true };
};
