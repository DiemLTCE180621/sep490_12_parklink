const inspectorService = require("../services/inspectorService");

class InspectorController {
  /**
   * Lấy danh sách bãi đỗ xe đang chờ khảo sát
   */
  async getPreparingFacilities(req, res, next) {
    try {
      const facilities = await inspectorService.getPreparingFacilities();
      res.json({ status: "success", data: facilities });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit kết quả khảo sát
   */
  async submitInspection(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      const { capacity, images } = req.body;
      
      if (isNaN(facilityId)) {
        return res.status(400).json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }
      if (!capacity || !images || images.length === 0) {
        return res.status(400).json({ status: "fail", message: "Vui lòng cung cấp sức chứa và hình ảnh hợp lệ" });
      }

      await inspectorService.submitInspection(facilityId, capacity, images);
      res.json({
        status: "success",
        message: "Gửi kết quả khảo sát thành công. Đang chờ Admin phê duyệt cuối cùng."
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new InspectorController();
