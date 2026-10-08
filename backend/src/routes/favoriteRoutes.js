const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Tất cả APIs liên quan đến favorite đều cần customer login
router.use(authenticateToken, authorizeRoles('CUSTOMER'));

// API: Thêm bãi đỗ xe vào danh sách yêu thích
router.post('/', favoriteController.addFavorite);

// API: Lấy danh sách bãi đỗ xe yêu thích của user
router.get('/', favoriteController.getFavorites);

// API: Xóa bãi đỗ xe khỏi danh sách yêu thích
router.delete('/:facilityId', favoriteController.removeFavorite);

module.exports = router;
