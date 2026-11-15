const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const chatValidation = require('../validations/chatValidation');

router.use(authenticateToken);
router.use(authorizeRoles('CUSTOMER', 'PROVIDER'));

router.get('/', chatController.getUserRooms.bind(chatController));
router.get('/unread-count', chatController.getUnreadCount.bind(chatController));
router.get('/:roomId/messages', chatController.getRoomMessages.bind(chatController));
router.post('/room', chatValidation.validateCreateRoom, chatController.getOrCreateRoom.bind(chatController));
router.put('/:roomId/read', chatValidation.validateMarkAsRead, chatController.markMessagesAsRead.bind(chatController));

module.exports = router;
