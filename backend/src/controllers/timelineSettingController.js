const timelineSettingService = require('../services/timelineSettingService');

class TimelineSettingController {
  async getSettings(req, res, next) {
    try {
      const data = await timelineSettingService.getTimelineSettings();
      return res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const adminUser = req.user;
      const data = await timelineSettingService.updateTimelineSettings(req.body, adminUser);
      return res.status(200).json({
        status: 'success',
        message: 'Cập nhật cấu hình thời hạn hệ thống thành công!',
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TimelineSettingController();
