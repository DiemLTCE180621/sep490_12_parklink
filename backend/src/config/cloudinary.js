const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình storage cho Multer (tự động đẩy lên Cloudinary)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Nếu là PDF hoặc Word thì upload dạng 'raw' (file thô)
    const isDocument = file.mimetype === 'application/pdf' || 
                       file.mimetype === 'application/msword' || 
                       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                       
    return {
      folder: 'ParkLink/Chat',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'doc', 'docx'],
      resource_type: isDocument ? 'raw' : 'auto'
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

module.exports = { cloudinary, upload };
