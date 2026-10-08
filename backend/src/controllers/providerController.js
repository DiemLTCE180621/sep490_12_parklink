const providerService = require('../services/providerService');

class ProviderController {
  /**
   * Cập nhật thông tin bãi đỗ xe của chính Provider
   */
  async updateMyFacility(req, res) {
    try {
      const providerId = req.user.userId || req.user.id;
      const updateData = req.body;
      
      console.log('--- UPDATE MY FACILITY ---');
      console.log('ProviderId:', providerId);
      console.log('UpdateData:', updateData);

      const updatedFacility = await providerService.updateMyFacility(providerId, updateData);
      
      res.json({
        message: 'Cập nhật bãi đỗ xe thành công',
        facility: updatedFacility
      });
    } catch (error) {
      console.error('Error updating facility:', error);
      res.status(400).json({ error: error.message || 'Lỗi khi cập nhật bãi đỗ xe' });
    }
  }
}

module.exports = new ProviderController();
