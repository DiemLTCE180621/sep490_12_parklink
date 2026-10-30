const providerService = require('../services/providerService');

/**
 * Controller cho các API liên quan đến Provider
 * Tuân thủ quy tắc kiến trúc 3-tier của ParkLink: CHỈ đóng vai trò tiếp nhận Request và trả Response
 */
class ProviderController {
  /**
   * Lấy thông tin bãi đỗ xe của Provider (kèm số chỗ trống và số xe đang gửi)
   */
  async getMyFacility(req, res) {
    try {
      const providerId = req.user.userId || req.user.id;
      const facility = await providerService.getMyFacility(providerId);

      return res.status(200).json({
        status: 'success',
        facility
      });
    } catch (error) {
      console.error('Error fetching provider facility:', error);
      return res.status(error.status || 500).json({
        status: 'fail',
        error: error.message || 'Lỗi khi tải thông tin bãi đỗ xe'
      });
    }
  }

  /**
   * Cập nhật thông tin bãi đỗ xe của chính Provider (Sức chứa, giá thuê, trạng thái hiển thị)
   */
  async updateMyFacility(req, res) {
    try {
      const providerId = req.user.userId || req.user.id;
      const updateData = req.body;

      const updatedFacility = await providerService.updateMyFacility(providerId, updateData);

      return res.status(200).json({
        status: 'success',
        message: 'Cập nhật bãi đỗ xe thành công',
        facility: updatedFacility
      });
    } catch (error) {
      console.error('Error updating facility:', error);
      return res.status(error.status || 400).json({
        status: 'fail',
        error: error.message || 'Lỗi khi cập nhật bãi đỗ xe'
      });
    }
  }
}

module.exports = new ProviderController();
