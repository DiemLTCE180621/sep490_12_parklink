const inspectorService = require("../services/inspectorService");

class InspectorController {
  /**
   * Lấy danh sách bãi đỗ xe đang chờ khảo sát được phân công cho nhân viên hiện tại
   */
  async getPreparingFacilities(req, res, next) {
    try {
      const inspectorId = req.user?.userId || req.user?.id;
      if (!inspectorId) {
        return res.status(401).json({ status: "fail", message: "Không xác định được danh tính nhân viên khảo sát!" });
      }
      const facilities = await inspectorService.getPreparingFacilities(inspectorId);
      res.json({ status: "success", data: facilities });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin chi tiết một cơ sở cần khảo sát
   */
  async getFacilityDetails(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      if (isNaN(facilityId)) {
        return res.status(400).json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }
      const inspectorId = req.user?.userId || req.user?.id;
      const facility = await inspectorService.getFacilityDetails(facilityId, inspectorId);
      res.json({ status: "success", data: facility });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: "fail", message: error.message });
      }
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

      const inspectorId = req.user?.userId || req.user?.id;
      await inspectorService.submitInspection(facilityId, capacity, images, inspectorId);
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
