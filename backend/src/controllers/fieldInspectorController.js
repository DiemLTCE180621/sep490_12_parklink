const fieldInspectorService = require("../services/fieldInspectorService");

class FieldInspectorController {
  async createFieldInspector(req, res, next) {
    try {
      const newInspector = await fieldInspectorService.createFieldInspectorAccount(req.body);
      res.status(201).json({
        status: "success",
        message: "Tạo tài khoản nhân viên khảo sát thành công. Mật khẩu tạm thời đã được gửi qua email.",
        data: newInspector
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }

  async getFieldInspectors(req, res, next) {
    try {
      const data = await fieldInspectorService.getFieldInspectorsList(req.query);
      res.json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }

  async getActiveInspectors(req, res, next) {
    try {
      const inspectors = await fieldInspectorService.getActiveFieldInspectors();
      res.json({ status: "success", data: inspectors });
    } catch (error) {
      next(error);
    }
  }

  async updateFieldInspector(req, res, next) {
    try {
      const inspectorId = parseInt(req.params.id, 10);
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
