const facilityRepository = require("../repositories/facilityRepository");
const adminDashboardRepository = require("../repositories/adminDashboardRepository");
const userRepository = require("../repositories/userRepository");
const roleRepository = require("../repositories/roleRepository");
const fieldInspectorRepository = require("../repositories/fieldInspectorRepository");
const providerRevenueRepository = require("../repositories/providerRevenueRepository");
const emailService = require("../utils/emailService");
const bcrypt = require("bcryptjs");
/**
 * Service xử lý logic nghiệp vụ dành riêng cho Admin
 */
class AdminService {
  async getDashboardOverview() {
    return await adminDashboardRepository.getOverview();
  }

  async getDashboardPlatformFeeTransactionsByMonth(month) {
    return await adminDashboardRepository.getPlatformFeeTransactionsByMonth(month);
  }

  /**
   * M2-UC20: View pending owner registrations
   * Lấy danh sách bãi đỗ xe đang PENDING_REVIEW hoặc PREPARING
   */
  async getPendingRegistrations() {
    return await facilityRepository.findPendingFacilities();
  }

  /**
   * Lấy chi tiết hồ sơ đăng ký bãi đỗ xe theo ID
   * @param {number} facilityId
   */
  async getRegistrationDetails(facilityId) {
    const facility = await facilityRepository.findById(facilityId);
    if (!facility) {
      throw Object.assign(new Error("Không tìm thấy bãi đỗ xe!"), {
        status: 404,
      });
    }
    if (facility.provider) {
      delete facility.provider.password;
    }
    return facility;
  }

  /**
   * M2-UC21 Bước 1: Duyệt sơ bộ → PREPARING & Phân công Nhân viên khảo sát thực địa
   * Admin chấp thuận đến thực địa chuẩn bị và chỉ định 1 Nhân viên khảo sát cụ thể.
   * Gửi mail thông báo kèm thông tin nhân viên cho Provider.
   * @param {number} facilityId
   * @param {number} inspectorId - ID của nhân viên khảo sát được giao nhiệm vụ
   */
  async approveRegistration(facilityId, inspectorId) {
    if (!inspectorId) {
      throw Object.assign(
        new Error("Vui lòng chọn nhân viên khảo sát thực địa để phân công nhiệm vụ!"),
        { status: 400 },
      );
    }

    const facility = await facilityRepository.findById(facilityId);
    if (!facility)
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), {
        status: 404,
      });
    if (facility.verification_status !== "PENDING_REVIEW") {
      throw Object.assign(
        new Error("Bãi đỗ xe không ở trạng thái chờ phê duyệt!"),
        { status: 400 },
      );
    }

    // Xác thực tài khoản Nhân viên khảo sát
    const inspector = await fieldInspectorRepository.findInspectorById(inspectorId);
    if (!inspector || inspector.role?.name !== "FIELD_INSPECTOR") {
      throw Object.assign(
        new Error("Nhân viên khảo sát không hợp lệ!"),
        { status: 400 },
      );
    }
    if (inspector.status !== "ACTIVE") {
      throw Object.assign(
        new Error("Nhân viên khảo sát này hiện đang bị khóa hoặc chưa kích hoạt!"),
        { status: 400 },
      );
    }

    const updatedFacility = await facilityRepository.prepareFacility(
      facilityId,
      facility.provider_id,
      inspectorId,
    );

    // Gửi mail thông báo "đang chuẩn bị & khảo sát" kèm thông tin nhân viên cho Provider
    await emailService.sendFacilityPreparingEmail({
      toEmail: facility.provider.email,
      fullName: facility.provider.full_name,
      facilityName: facility.name,
      inspectorName: inspector.full_name,
      inspectorPhone: inspector.phone_number,
    });

    return updatedFacility;
  }

  /**
   * Phân công hoặc đổi Nhân viên khảo sát thực địa cho cơ sở
   * Áp dụng khi cơ sở đang ở PENDING_REVIEW hoặc PREPARING
   * @param {number} facilityId
   * @param {number} inspectorId
   */
  async assignInspector(facilityId, inspectorId) {
    if (!inspectorId) {
      throw Object.assign(
        new Error("Vui lòng chọn nhân viên khảo sát thực địa hợp lệ!"),
        { status: 400 },
      );
    }

    const facility = await facilityRepository.findById(facilityId);
    if (!facility) {
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), {
        status: 404,
      });
    }

    if (!["PENDING_REVIEW", "PREPARING"].includes(facility.verification_status)) {
      throw Object.assign(
        new Error("Chỉ có thể phân công nhân viên khảo sát khi cơ sở đang chờ duyệt hoặc đang khảo sát!"),
        { status: 400 },
      );
    }

    // Xác thực tài khoản Nhân viên khảo sát
    const inspector = await fieldInspectorRepository.findInspectorById(inspectorId);
    if (!inspector || inspector.role?.name !== "FIELD_INSPECTOR") {
      throw Object.assign(
        new Error("Nhân viên khảo sát không hợp lệ!"),
        { status: 400 },
      );
    }
    if (inspector.status !== "ACTIVE") {
      throw Object.assign(
        new Error("Nhân viên khảo sát này hiện đang bị khóa hoặc chưa kích hoạt!"),
        { status: 400 },
      );
    }

    const updatedFacility = await facilityRepository.assignInspector(
      facilityId,
      inspectorId,
    );

    // Nếu cơ sở chuyển từ PENDING_REVIEW sang PREPARING, gửi email thông báo cho Provider
    if (facility.verification_status === "PENDING_REVIEW") {
      await emailService.sendFacilityPreparingEmail({
        toEmail: facility.provider.email,
        fullName: facility.provider.full_name,
        facilityName: facility.name,
        inspectorName: inspector.full_name,
        inspectorPhone: inspector.phone_number,
      });
    }

    return updatedFacility;
  }

  /**
   * Lấy danh sách Nhân viên khảo sát đang hoạt động (ACTIVE)
   */
  async getActiveInspectors() {
    return await fieldInspectorRepository.findActiveInspectors();
  }

  /**
   * M2-UC21 Bước 2: Xác nhận hoàn tất → APPROVED
   * Admin xem xét kết quả khảo sát, duyệt chính thức, gửi mail kèm QR VietQR thanh toán cho Provider.
   * @param {number} facilityId
   */
  async finalizeRegistration(facilityId) {
    const facility = await facilityRepository.findById(facilityId);
    if (!facility)
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), {
        status: 404,
      });
    if (facility.verification_status !== "INSPECTED") {
      throw Object.assign(
        new Error("Bãi đỗ xe phải ở trạng thái Đã Khảo Sát (INSPECTED) để hoàn tất!"),
        { status: 400 },
      );
    }

    const updatedFacility = await facilityRepository.approveFacility(
      facilityId,
      facility.provider_id,
    );

    // Tạo mật khẩu mới cho Provider
    const tempPassword = emailService.generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);
    await userRepository.updateUserPassword(
      facility.provider_id,
      password_hash,
      true,
    );

    // Gửi mail kèm QR VietQR thanh toán và mật khẩu
    await emailService.sendFacilityApprovedWithQREmail({
      toEmail: facility.provider.email,
      fullName: facility.provider.full_name,
      facilityName: facility.name,
      systemFee: facility.system_fee,
      facilityId: facility.id,
      tempPassword: tempPassword,
    });

    return updatedFacility;
  }

  /**
   * M2-UC22: Từ chối đăng ký bãi đỗ xe
   * @param {number} facilityId
   * @param {string} reason - Lý do từ chối
   */
  async rejectRegistration(facilityId, reason) {
    const facility = await facilityRepository.findById(facilityId);
    if (!facility)
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), {
        status: 404,
      });
    if (
      !["PENDING_REVIEW", "PREPARING"].includes(facility.verification_status)
    ) {
      throw Object.assign(
        new Error("Bãi đỗ xe không ở trạng thái có thể từ chối!"),
        { status: 400 },
      );
    }

    const rejectReason =
      reason || "Hồ sơ bãi đỗ xe không đạt yêu cầu của ParkLink.";
    const updatedFacility = await facilityRepository.rejectFacility(
      facilityId,
      facility.provider_id,
      rejectReason,
    );

    // Gửi mail từ chối kèm lý do
    await emailService.sendFacilityRejectedEmail({
      toEmail: facility.provider.email,
      fullName: facility.provider.full_name,
      facilityName: facility.name,
      reason: rejectReason,
    });

    return updatedFacility;
  }

  /**
   * Provider xác nhận đã thanh toán → VISIBLE
   * @param {number} facilityId
   * @param {number} providerId - ID của Provider đang đăng nhập
   */
  async confirmPayment(facilityId, providerId) {
    const facility = await facilityRepository.findById(facilityId);
    if (!facility)
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), {
        status: 404,
      });
    if (facility.provider_id !== providerId) {
      throw Object.assign(
        new Error("Bạn không có quyền thực hiện thao tác này!"),
        { status: 403 },
      );
    }
    if (facility.verification_status !== "APPROVED") {
      throw Object.assign(new Error("Bãi đỗ xe chưa được phê duyệt!"), {
        status: 400,
      });
    }
    if (facility.payment_status === "PAID") {
      throw Object.assign(new Error("Bãi đỗ xe đã được thanh toán rồi!"), {
        status: 400,
      });
    }

    return await facilityRepository.confirmPayment(facilityId, providerId);
  }

  /**
   * Lấy danh sách tất cả bãi đỗ xe trong hệ thống
   */
  async getAllFacilities() {
    return await facilityRepository.findAllFacilities();
  }

  /**
   * Khóa / Mở khóa bãi đỗ xe
   * @param {number} facilityId
   */
  async toggleLockFacility(facilityId) {
    return await facilityRepository.toggleLockFacility(facilityId);
  }

  /**
   * Cập nhật thông tin cơ sở
   * @param {number} facilityId
   * @param {object} updateData
   */
  async updateFacility(facilityId, updateData) {
    return await facilityRepository.updateFacility(facilityId, updateData);
  }

  async getProviderRevenueStatistics({ year, month, facilityId, providerId }) {
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month, 10) : (new Date().getMonth() + 1);

    const yearStart = new Date(Date.UTC(targetYear, 0, 1));
    const nextYearStart = new Date(Date.UTC(targetYear + 1, 0, 1));

    const [rows, filterFacilities, availableYears] = await Promise.all([
      providerRevenueRepository.findAllContractsForRevenue({
        yearStart,
        nextYearStart,
        facilityId: facilityId ? Number(facilityId) : null,
        providerId: providerId ? Number(providerId) : null,
      }),
      providerRevenueRepository.findAllFacilitiesForFilter(),
      providerRevenueRepository.findAvailableYears()
    ]);

    const contractsForMonth = (monthNumber) => {
      const monthStart = new Date(Date.UTC(targetYear, monthNumber - 1, 1));
      const nextMonthStart = new Date(Date.UTC(targetYear, monthNumber, 1));
      const monthStartInBangkok = new Date(monthStart.getTime() - 7 * 60 * 60 * 1000);

      return rows.filter((row) => {
        if (row.start_date >= nextMonthStart || row.end_date < monthStart) return false;
        if (row.status !== 'TERMINATED') return true;
        const terminatedAt = row.contract_snapshot?.contract_info?.terminated_at;
        return terminatedAt && new Date(terminatedAt) >= monthStartInBangkok;
      });
    };

    const activeContractsInTargetMonth = contractsForMonth(targetMonth);

    const now = new Date();
    const currentRealYear = now.getFullYear();
    const currentRealMonth = now.getMonth() + 1;
    const isTargetPeriodFuture = targetYear > currentRealYear || (targetYear === currentRealYear && targetMonth > currentRealMonth);

    const monthlyTrend = Array.from({ length: 12 }, (_, index) => {
      const m = index + 1;
      const items = contractsForMonth(m);
      const isFuture = targetYear > currentRealYear || (targetYear === currentRealYear && m > currentRealMonth);
      return {
        month: m,
        contract_count: items.length,
        revenue: items.reduce((sum, r) => sum + Number(r.agreed_price), 0),
        is_future: isFuture
      };
    });

    const facilityMap = new Map();

    filterFacilities.forEach((f) => {
      if (facilityId && f.id !== Number(facilityId)) return;
      if (providerId && f.provider?.id !== Number(providerId)) return;

      facilityMap.set(f.id, {
        facility_id: f.id,
        facility_name: f.name,
        facility_address: f.address,
        capacity: f.capacity,
        provider_id: f.provider?.id,
        provider_name: f.provider?.full_name || 'Chưa cập nhật',
        provider_email: f.provider?.email || '',
        provider_phone: f.provider?.phone_number || '',
        active_contracts_count: 0,
        monthly_revenue: 0,
        occupancy_rate: 0,
        contracts: []
      });
    });

    activeContractsInTargetMonth.forEach((row) => {
      const fId = row.reservation?.facility?.id;
      if (!fId) return;

      let item = facilityMap.get(fId);
      if (!item) {
        item = {
          facility_id: fId,
          facility_name: row.reservation.facility?.name || 'Bãi đỗ xe',
          facility_address: row.reservation.facility?.address || '',
          capacity: row.reservation.facility?.capacity || 0,
          provider_id: row.reservation.facility?.provider?.id,
          provider_name: row.reservation.facility?.provider?.full_name || 'Chưa cập nhật',
          provider_email: row.reservation.facility?.provider?.email || '',
          provider_phone: row.reservation.facility?.provider?.phone_number || '',
          active_contracts_count: 0,
          monthly_revenue: 0,
          occupancy_rate: 0,
          contracts: []
        };
        facilityMap.set(fId, item);
      }

      item.active_contracts_count += 1;
      item.monthly_revenue += Number(row.agreed_price);
      item.contracts.push({
        id: row.id,
        contract_code: row.contract_code,
        agreed_price: Number(row.agreed_price),
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        customer_id: row.reservation?.customer?.id,
        customer_name: row.reservation?.customer?.full_name || 'Khách hàng',
        customer_phone: row.reservation?.customer?.phone_number || '',
        customer_email: row.reservation?.customer?.email || ''
      });
    });

    const facilityBreakdown = Array.from(facilityMap.values()).map((f) => ({
      ...f,
      occupancy_rate: f.capacity > 0 ? Math.min(100, Math.round((f.active_contracts_count / f.capacity) * 100)) : 0
    })).sort((a, b) => b.monthly_revenue - a.monthly_revenue);

    const totalRevenue = activeContractsInTargetMonth.reduce((sum, r) => sum + Number(r.agreed_price), 0);
    const totalActiveContracts = activeContractsInTargetMonth.length;
    const generatingRevenueFacilitiesCount = facilityBreakdown.filter((f) => f.monthly_revenue > 0).length;
    const totalFacilitiesCount = facilityBreakdown.length;
    const averageRevenuePerFacility = generatingRevenueFacilitiesCount > 0
      ? Math.round(totalRevenue / generatingRevenueFacilitiesCount)
      : 0;

    return {
      year: targetYear,
      month: targetMonth,
      currency: 'VND',
      summary: {
        total_revenue: totalRevenue,
        total_active_contracts: totalActiveContracts,
        facilities_with_revenue_count: generatingRevenueFacilitiesCount,
        total_facilities_count: totalFacilitiesCount,
        average_revenue_per_facility: averageRevenuePerFacility,
        is_future: isTargetPeriodFuture
      },
      available_years: availableYears,
      monthly_trend: monthlyTrend,
      facilities: facilityBreakdown,
      filter_options: {
        facilities: filterFacilities.map((f) => ({
          id: f.id,
          name: f.name,
          provider_name: f.provider?.full_name,
          provider_id: f.provider?.id
        }))
      }
    };
  }
}

module.exports = new AdminService();
