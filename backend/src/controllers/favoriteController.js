const favoriteService = require('../services/favoriteService');

exports.addFavorite = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { facilityId } = req.body;

    if (!facilityId) {
      return res.status(400).json({ status: 'error', message: 'Thiếu facilityId' });
    }

    await favoriteService.addFavorite(customerId, facilityId);
    res.json({
      status: 'success',
      message: 'Đã lưu bãi đỗ xe vào danh sách yêu thích'
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.message.includes('đã nằm trong') ? 400 : 500);
    res.status(statusCode).json({
      status: 'error',
      message: statusCode === 500 ? 'Đã xảy ra lỗi máy chủ nội bộ' : error.message
    });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { facilityId } = req.params;

    await favoriteService.removeFavorite(customerId, facilityId);
    res.json({
      status: 'success',
      message: 'Đã xóa bãi đỗ xe khỏi danh sách yêu thích'
    });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const data = await favoriteService.getFavorites(customerId);
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
