const adminService = require("../services/adminService");

/**
 * Controller xử lý các HTTP Request dành cho Admin
 */
class AdminController {
  async getDashboardOverview(req, res, next) {
    try {
      const overview = await adminService.getDashboardOverview();
      res.json({ status: "success", data: overview });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardPlatformFeeTransactionsByMonth(req, res, next) {
    try {
      const { month } = req.params;
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return res.status(400).json({ status: "fail", message: "Tháng giao dịch không hợp lệ." });
      }

      const transactions = await adminService.getDashboardPlatformFeeTransactionsByMonth(month);
      return res.json({ status: "success", data: transactions });
    } catch (error) {
      next(error);
    }
  }

  async exportRevenueReport(req, res, next) {
    try {
      const { from, to, period, month, year, facility_id } = req.query;

      let calculatedFrom = from;
      let calculatedTo = to;
      let periodLabel = null;

      if (period && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(period)) {
        const [y, m] = period.split("-").map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        calculatedFrom = `${y}-${String(m).padStart(2, "0")}-01`;
        calculatedTo = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        periodLabel = `Tháng ${m}/${y}`;
      } else if (month && year) {
        const m = Number(month);
        const y = Number(year);
        if (m >= 1 && m <= 12 && y >= 2000 && y <= 2100) {
          const lastDay = new Date(y, m, 0).getDate();
          calculatedFrom = `${y}-${String(m).padStart(2, "0")}-01`;
          calculatedTo = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
          periodLabel = `Tháng ${m}/${y}`;
        }
      }

      if (calculatedFrom && !/^\d{4}-\d{2}-\d{2}$/.test(calculatedFrom)) {
        return res.status(400).json({ status: "fail", message: "Ngày bắt đầu không đúng định dạng YYYY-MM-DD!" });
      }
      if (calculatedTo && !/^\d{4}-\d{2}-\d{2}$/.test(calculatedTo)) {
        return res.status(400).json({ status: "fail", message: "Ngày kết thúc không đúng định dạng YYYY-MM-DD!" });
      }
      if (calculatedFrom && calculatedTo && calculatedFrom > calculatedTo) {
        return res.status(400).json({ status: "fail", message: "Ngày bắt đầu không được lớn hơn ngày kết thúc!" });
      }
      if (facility_id !== undefined && facility_id !== "") {
        const parsedId = Number(facility_id);
        if (!Number.isInteger(parsedId) || parsedId <= 0) {
          return res.status(400).json({ status: "fail", message: "Mã cơ sở bãi xe (facility_id) phải là số nguyên dương hợp lệ!" });
        }
      }

      const { filename, contentType, content } = await adminService.exportRevenueReport({
        from: calculatedFrom,
        to: calculatedTo,
        periodLabel,
        facilityId: facility_id
      });

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      return res.status(200).send(content);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy cơ sở chờ duyệt và đang chuẩn bị
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
   * Lấy chi tiết một yêu cầu đăng ký bãi đỗ xe theo ID
   */
  async getRegistrationDetails(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      if (isNaN(facilityId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }
      const facility = await adminService.getRegistrationDetails(facilityId);
      res.json({ status: "success", data: facility });
    } catch (error) {
      if (error.status)
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      next(error);
    }
  }

  /**
   * Duyệt sơ bộ và phân công khảo sát
   */
  async approveRegistration(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      if (isNaN(facilityId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }

      const inspectorId = req.body.inspector_id ? parseInt(req.body.inspector_id, 10) : null;
      if (!inspectorId || isNaN(inspectorId)) {
        return res.status(400).json({
          status: "fail",
          message: "Vui lòng chọn nhân viên khảo sát thực địa để phân công nhiệm vụ!",
        });
      }

      await adminService.approveRegistration(facilityId, inspectorId);
      res.json({
        status: "success",
        message:
          "Duyệt sơ bộ và phân công nhân viên khảo sát thành công. Email thông báo đã được gửi cho Provider.",
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
   * Phân công hoặc đổi Nhân viên khảo sát thực địa cho cơ sở
   */
  async assignInspector(req, res, next) {
    try {
      const facilityId = parseInt(req.params.id, 10);
      if (isNaN(facilityId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID bãi đỗ xe không hợp lệ" });
      }

      const inspectorId = req.body.inspector_id ? parseInt(req.body.inspector_id, 10) : null;
      if (!inspectorId || isNaN(inspectorId)) {
        return res.status(400).json({
          status: "fail",
          message: "Vui lòng chọn nhân viên khảo sát thực địa hợp lệ!",
        });
      }

      const updated = await adminService.assignInspector(facilityId, inspectorId);
      res.json({
        status: "success",
        message: "Phân công nhân viên khảo sát thực địa thành công!",
        data: updated,
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
   * Phê duyệt cơ sở và gửi mã QR
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
   * Từ chối đăng ký cơ sở
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
   * Hiển thị cơ sở sau khi thanh toán
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
   * Khóa hoặc mở khóa cơ sở
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

  async getProviderRevenueStatistics(req, res, next) {
    try {
      const { year, month, facility_id, provider_id } = req.query;
      const data = await adminService.getProviderRevenueStatistics({
        year: year ? parseInt(year, 10) : undefined,
        month: month ? parseInt(month, 10) : undefined,
        facilityId: facility_id ? parseInt(facility_id, 10) : undefined,
        providerId: provider_id ? parseInt(provider_id, 10) : undefined,
      });
      return res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
