const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const chatValidation = require('../validations/chatValidation');

router.use(authenticateToken);
router.use(authorizeRoles('CUSTOMER', 'PROVIDER'));

router.get('/', chatController.getUserRooms.bind(chatController));

// Lấy lịch sử tin nhắn của cuộc trò chuyện
router.get('/:roomId/messages', chatController.getRoomMessages.bind(chatController));
// Tìm hoặc tạo phòng chat mới
router.post('/room', chatValidation.validateCreateRoom, chatController.getOrCreateRoom.bind(chatController));
// Đánh dấu tin nhắn trong phòng là đã xem
router.put('/:roomId/read', chatValidation.validateMarkAsRead, chatController.markMessagesAsRead.bind(chatController));

module.exports = router;
