const providerService = require('../services/providerService');
const providerRevenueService = require('../services/providerRevenueService');

/**
 * Controller cho các API liên quan đến Provider
 * Tuân thủ quy tắc kiến trúc 3-tier của ParkLink: CHỈ đóng vai trò tiếp nhận Request và trả Response
 */
class ProviderController {
  async getMonthlyRevenue(req, res, next) {
    try {
      const current = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok', year: 'numeric', month: 'numeric',
      }).formatToParts(new Date());
      const currentYear = Number(current.find((part) => part.type === 'year').value);
      const currentMonth = Number(current.find((part) => part.type === 'month').value);
      const year = req.query.year === undefined ? currentYear : Number(req.query.year);
      const month = req.query.month === undefined ? currentMonth : Number(req.query.month);
      if (!Number.isInteger(year) || year < 2000 || year > 9999 ||
          !Number.isInteger(month) || month < 1 || month > 12 ||
          (req.query.year !== undefined && !/^\d{4}$/.test(req.query.year)) ||
          (req.query.month !== undefined && !/^(?:[1-9]|1[0-2])$/.test(req.query.month))) {
        return res.status(400).json({ status: 'fail', message: 'Năm hoặc tháng không hợp lệ.' });
      }
      const data = await providerRevenueService.getMonthlyReport(req.user.userId || req.user.id, year, month);
      return res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
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
