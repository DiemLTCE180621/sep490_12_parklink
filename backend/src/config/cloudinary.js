const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình storage cho Multer (tự động đẩy lên Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isComplaintUpload = req.query.folder === 'complaints';
    const folder = isComplaintUpload ? 'ParkLink/Complaints' : 'ParkLink/Chat';

    // Nhận diện file ảnh và video
    const isImage = file.mimetype?.startsWith('image/');
    const isVideo = file.mimetype?.startsWith('video/');

    if (isImage) {
      return {
        folder: folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
      };
    }

    if (isVideo) {
      return {
        folder: folder,
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'webm', 'ogg']
      };
    }

    // Đối với các loại file tài liệu / nén / văn phòng (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR...)
    // Cloudinary yêu cầu resource_type là 'raw' và TUYỆT ĐỐI KHÔNG được truyền allowed_formats.
    // Đặt public_id giữ lại đuôi mở rộng để khi tải về mở đúng ứng dụng.
    const ext = path.extname(file.originalname) || '';
    const rawName = path.basename(file.originalname, ext)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Khử dấu tiếng Việt
      .replace(/[^a-zA-Z0-9_-]/g, '_'); // Ký tự đặc biệt đổi thành gạch dưới

    const uniqueFileName = `${Date.now()}_${rawName}${ext}`;

    return {
      folder: folder,
      resource_type: 'raw',
      public_id: uniqueFileName
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB (chuẩn Zalo)
  }
});

module.exports = { cloudinary, upload };
