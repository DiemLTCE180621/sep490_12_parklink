const adminService = require("../services/adminService");

/**
 * Controller xử lý các HTTP Request dành cho Admin
 */
class AdminController {
  /**
   * M2-UC20: Lấy danh sách bãi đỗ xe đang chờ duyệt / đang chuẩn bị
   */
  async getPendingRegistrations(req, res, next) {
    try {
      const registrations = await adminService.getPendingRegistrations();
      res.json({ status: "success", data: registrations });
    } catch (error) {
      next(error);
    }
  }

  /**
   * M2-UC21 Bước 1: Admin duyệt sơ bộ → PREPARING
   */
  async approveRegistration(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      if (isNaN(facilityId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }
      await adminService.approveRegistration(facilityId);
      res.json({
        status: "success",
        message:
          "Duyệt sơ bộ thành công. Email thông báo đã được gửi cho Provider.",
      });
    } catch (error) {
      if (error.status)
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      next(error);
    }
  }

  /**
   * M2-UC21 Bước 2: Admin xác nhận hoàn tất chuẩn bị → APPROVED + gửi QR
   */
  async finalizeRegistration(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      if (isNaN(facilityId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }
      await adminService.finalizeRegistration(facilityId);
      res.json({
        status: "success",
        message:
          "Hoàn tất phê duyệt. Email kèm QR thanh toán đã được gửi cho Provider.",
      });
    } catch (error) {
      if (error.status)
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      next(error);
    }
  }

  /**
   * M2-UC22: Từ chối yêu cầu đăng ký bãi đỗ xe
   */
  async rejectRegistration(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      const { reason } = req.body;
      if (isNaN(facilityId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }
      await adminService.rejectRegistration(facilityId, reason);
      res.json({ status: "success", message: "Từ chối bãi đỗ xe thành công" });
    } catch (error) {
      if (error.status)
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      next(error);
    }
  }

  /**
   * Provider xác nhận đã thanh toán phí nền tảng → Cơ sở VISIBLE
   */
  async confirmPayment(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      const providerId = req.user.userId;
      if (isNaN(facilityId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }
      await adminService.confirmPayment(facilityId, providerId);
      res.json({
        status: "success",
        message:
          "Thanh toán thành công! Cơ sở của bạn đã được hiển thị công khai.",
      });
    } catch (error) {
      if (error.status)
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      next(error);
    }
  }

  /**
   * Lấy danh sách tất cả các bãi đỗ xe trong hệ thống
   */
  async getAllFacilities(req, res, next) {
    try {
      const facilities = await adminService.getAllFacilities();
      res.json({ status: "success", data: facilities });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Khóa / Mở khóa bãi đỗ xe
   */
  async toggleLockFacility(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      if (isNaN(facilityId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }
      const updatedFacility = await adminService.toggleLockFacility(facilityId);
      const action =
        updatedFacility.visibility_status === "HIDDEN" ? "Khóa" : "Mở khóa";
      res.json({
        status: "success",
        message: `${action} bãi đỗ xe thành công.`,
        data: updatedFacility,
      });
    } catch (error) {
      if (error.status)
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      next(error);
    }
  }

  /**
   * Cập nhật thông tin bãi đỗ xe
   */
  async updateFacility(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      if (isNaN(facilityId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }
      const updatedFacility = await adminService.updateFacility(
        facilityId,
        req.body,
      );
      res.json({
        status: "success",
        message: "Cập nhật bãi đỗ xe thành công.",
        data: updatedFacility,
      });
    } catch (error) {
      if (error.status)
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      next(error);
    }
  }
}

module.exports = new AdminController();
