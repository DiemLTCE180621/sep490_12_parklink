const fieldInspectorService = require("../services/fieldInspectorService");

/**
 * Controller xử lý các HTTP Request dành riêng cho Nhân viên khảo sát (Field Inspector)
 */
class FieldInspectorController {
  /**
   * UC-86: Tạo tài khoản Nhân viên khảo sát thực địa
   */
  async createFieldInspector(req, res, next) {
    try {
      const newInspector = await fieldInspectorService.createFieldInspectorAccount(req.body);
      res.status(201).json({
        status: "success",
        message: "Tạo tài khoản Nhân viên khảo sát thực địa thành công! Mật khẩu tạm thời đã được gửi qua email.",
        data: newInspector
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }

  /**
   * UC-87: Lấy danh sách tài khoản Nhân viên khảo sát thực địa
   */
  async getFieldInspectors(req, res, next) {
    try {
      const data = await fieldInspectorService.getFieldInspectorsList(req.query);
      res.json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách tất cả Nhân viên khảo sát đang hoạt động (ACTIVE) để phân công
   */
  async getActiveInspectors(req, res, next) {
    try {
      const inspectors = await fieldInspectorService.getActiveFieldInspectors();
      res.json({ status: "success", data: inspectors });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC-88: Cập nhật thông tin tài khoản Nhân viên khảo sát thực địa
   */
  async updateFieldInspector(req, res, next) {
    try {
      const inspectorId = parseInt(req.params.id, 10);
      if (isNaN(inspectorId)) {
        return res.status(400).json({ status: "fail", message: "ID Nhân viên khảo sát không hợp lệ" });
      }
      const updatedInspector = await fieldInspectorService.updateFieldInspectorInfo(inspectorId, req.body);
      res.json({
        status: "success",
        message: "Cập nhật thông tin Nhân viên khảo sát thành công!",
        data: updatedInspector
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new FieldInspectorController();
