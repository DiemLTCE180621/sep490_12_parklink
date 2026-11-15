const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isComplaintUpload = req.query.folder === 'complaints';
    const folder = isComplaintUpload ? 'ParkLink/Complaints' : 'ParkLink/Chat';

    const isImage = file.mimetype?.startsWith('image/');
    const isVideo = file.mimetype?.startsWith('video/');

    if (isImage) {
      return {
        folder: folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'avif']
      };
    }

    if (isVideo) {
      return {
        folder: folder,
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'webm', 'ogg']
      };
    }

    const ext = path.extname(file.originalname) || '';
    const rawName = path.basename(file.originalname, ext)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

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
    fileSize: 50 * 1024 * 1024
  }
});

module.exports = { cloudinary, upload };
