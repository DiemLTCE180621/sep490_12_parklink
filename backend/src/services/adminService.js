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
   * Lấy cơ sở chờ duyệt và đang chuẩn bị
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
   * Duyệt sơ bộ và phân công khảo sát
   * Thông báo nhân viên được phân công cho Provider.
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

    // Gửi email chuẩn bị cơ sở kèm thông tin nhân viên khảo sát
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
   * Phê duyệt cơ sở và gửi mã QR thanh toán
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
   * Từ chối đăng ký bãi đỗ xe
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
   * Hiển thị cơ sở sau khi thanh toán
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
   * Khóa hoặc mở khóa cơ sở
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

  async exportRevenueReport({ from, to, periodLabel, facilityId }) {
    const fromDate = from ? new Date(`${from}T00:00:00.000+07:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59.999+07:00`) : null;

    const { transactions, contracts, facilities } = await adminDashboardRepository.getRevenueData({
      fromDate,
      toDate,
      facilityId
    });

    let totalPlatformRevenue = 0;
    let pendingPlatformRevenue = 0;
    let completedTransactionsCount = 0;

    const formattedTransactions = transactions.map((tx) => {
      const amount = Number(tx.amount || 0);
      if (tx.status === "COMPLETED") {
        totalPlatformRevenue += amount;
        completedTransactionsCount += 1;
      } else if (tx.status === "PENDING") {
        pendingPlatformRevenue += amount;
      }

      return {
        id: tx.id,
        amount,
        transaction_type: tx.transaction_type,
        status: tx.status,
        status_label: tx.status === "COMPLETED" ? "Thành công" : tx.status === "PENDING" ? "Đang xử lý" : "Thất bại",
        created_at_formatted: new Date(tx.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" }),
        facility_name: tx.facility?.name || "—",
        provider_name: tx.provider?.full_name || "—",
        provider_email: tx.provider?.email || "—",
        provider_phone: tx.provider?.phone_number || "—"
      };
    });

    let totalRentalTurnover = 0;
    let activeContractsCount = 0;

    const formattedContracts = contracts.map((c) => {
      const price = Number(c.agreed_price || 0);
      if (c.status === "ACTIVE") {
        totalRentalTurnover += price;
        activeContractsCount += 1;
      }

      return {
        contract_code: c.contract_code,
        agreed_price: price,
        status: c.status,
        status_label: c.status === "ACTIVE" ? "Đang hiệu lực" : c.status === "TERMINATED" ? "Đã chấm dứt" : c.status === "CANCELLED" ? "Đã hủy" : c.status === "PENDING_SIGNATURE" ? "Chờ ký" : c.status,
        start_date_formatted: new Date(c.start_date).toLocaleDateString("vi-VN", { timeZone: "Asia/Bangkok" }),
        end_date_formatted: new Date(c.end_date).toLocaleDateString("vi-VN", { timeZone: "Asia/Bangkok" }),
        customer_name: c.reservation?.customer?.full_name || "—",
        customer_phone: c.reservation?.customer?.phone_number || "—",
        vehicle_info: c.reservation?.vehicle_info || "—",
        facility_name: c.reservation?.facility?.name || "—",
        provider_name: c.reservation?.facility?.provider?.full_name || "—"
      };
    });

    const facilityBreakdown = facilities.map((fac) => {
      const completedPlatformFee = (fac.transactions || []).reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const activeContracts = (fac.reservations || []).filter((r) => r.confirmation_record?.status === "ACTIVE");
      const monthlyTurnover = activeContracts.reduce((sum, r) => sum + Number(r.confirmation_record?.agreed_price || 0), 0);

      return {
        id: fac.id,
        name: fac.name,
        address: fac.address,
        provider_name: fac.provider?.full_name || "—",
        capacity: fac.capacity || 0,
        available_slots: fac.available_slots || 0,
        occupied_slots: Math.max(0, (fac.capacity || 0) - (fac.available_slots || 0)),
        payment_status_label: fac.payment_status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán",
        completed_platform_fee: completedPlatformFee,
        active_contracts_count: activeContracts.length,
        monthly_turnover: monthlyTurnover
      };
    });

    const targetYear = fromDate ? fromDate.getFullYear() : (toDate ? toDate.getFullYear() : new Date().getFullYear());

    const monthlyStats = Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1;
      const monthTxs = transactions.filter((tx) => {
        if (tx.status !== "COMPLETED") return false;
        const d = new Date(tx.created_at);
        return d.getFullYear() === targetYear && (d.getMonth() + 1) === m;
      });
      const revenue = monthTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const count = monthTxs.length;
      const avg = count > 0 ? Math.round(revenue / count) : 0;
      return {
        monthLabel: `Tháng ${m}`,
        revenue,
        count,
        avg
      };
    });

    const totalMonthRevenue = monthlyStats.reduce((sum, item) => sum + item.revenue, 0);
    const totalMonthCount = monthlyStats.reduce((sum, item) => sum + item.count, 0);
    const totalMonthAvg = totalMonthCount > 0 ? Math.round(totalMonthRevenue / totalMonthCount) : 0;

    const escapeXml = (val) => {
      if (val === null || val === undefined) return "";
      return String(val)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const generatedTime = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" });
    const filterInfo = periodLabel ? periodLabel : (from && to ? `Từ ${from} đến ${to}` : "Toàn bộ thời gian");

    const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0D9488"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#64748B"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0D9488" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="CurrencyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="SummaryLabel">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#1E293B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="SummaryValue">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0D9488"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="MonthTitle">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#00509E"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MonthSubTitle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#475569"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MonthHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#E9EEF4" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="MonthCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="MonthCurrencyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0 &quot;đ&quot;"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="MonthTotalLabel">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#00509E" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
   </Borders>
  </Style>
  <Style ss:ID="MonthTotalCurrency">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#00509E" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0 &quot;đ&quot;"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
   </Borders>
  </Style>
  <Style ss:ID="MonthTotalNumber">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#00509E" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#003366"/>
   </Borders>
  </Style>
 </Styles>

 <Worksheet ss:Name="Tổng quan">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="280"/>
   <Column ss:Width="160"/>

   <Row ss:Height="28">
    <Cell ss:StyleID="Title"><Data ss:Type="String">BÁO CÁO DOANH THU HỆ THỐNG PARKLINK</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubTitle"><Data ss:Type="String">Thời gian xuất: ${escapeXml(generatedTime)} | Khoảng thời gian: ${escapeXml(filterInfo)}</Data></Cell>
   </Row>
   <Row ss:Height="12"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Chỉ số tài chính</Data></Cell>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Giá trị (VNĐ)</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">Doanh thu phí nền tảng đã thu (Thành công)</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${totalPlatformRevenue}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">Phí nền tảng đang chờ xử lý</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${pendingPlatformRevenue}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">Tổng doanh số thuê sàn hàng tháng (Active)</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${totalRentalTurnover}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">Tổng số giao dịch phí</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${transactions.length}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">Tổng số hợp đồng thuê hiệu lực</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${activeContractsCount}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">Tổng số cơ sở bãi xe</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${facilities.length}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Doanh thu theo tháng">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="110"/>
   <Column ss:Width="180"/>
   <Column ss:Width="150"/>
   <Column ss:Width="180"/>

   <Row ss:Height="28">
    <Cell ss:StyleID="MonthTitle"><Data ss:Type="String">DOANH THU THEO THÁNG — NĂM ${targetYear}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="MonthSubTitle"><Data ss:Type="String">Chỉ tính giao dịch phí nền tảng có trạng thái COMPLETED</Data></Cell>
   </Row>
   <Row ss:Height="10"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="MonthHeader"><Data ss:Type="String">Tháng</Data></Cell>
    <Cell ss:StyleID="MonthHeader"><Data ss:Type="String">Doanh thu (đ)</Data></Cell>
    <Cell ss:StyleID="MonthHeader"><Data ss:Type="String">Số đơn thành công</Data></Cell>
    <Cell ss:StyleID="MonthHeader"><Data ss:Type="String">Doanh thu TB/đơn</Data></Cell>
   </Row>
   ${monthlyStats.map((item) => `
   <Row ss:Height="21">
    <Cell ss:StyleID="MonthCellCenter"><Data ss:Type="String">${escapeXml(item.monthLabel)}</Data></Cell>
    <Cell ss:StyleID="MonthCurrencyCell"><Data ss:Type="Number">${item.revenue}</Data></Cell>
    <Cell ss:StyleID="MonthCellCenter"><Data ss:Type="Number">${item.count}</Data></Cell>
    <Cell ss:StyleID="MonthCurrencyCell"><Data ss:Type="Number">${item.avg}</Data></Cell>
   </Row>`).join("")}
   <Row ss:Height="24">
    <Cell ss:StyleID="MonthTotalLabel"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>
    <Cell ss:StyleID="MonthTotalCurrency"><Data ss:Type="Number">${totalMonthRevenue}</Data></Cell>
    <Cell ss:StyleID="MonthTotalNumber"><Data ss:Type="Number">${totalMonthCount}</Data></Cell>
    <Cell ss:StyleID="MonthTotalCurrency"><Data ss:Type="Number">${totalMonthAvg}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Thống kê bãi xe">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="60"/>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="200"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="110"/>
   <Column ss:Width="130"/>
   <Column ss:Width="90"/>
   <Column ss:Width="140"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mã bãi</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tên bãi đỗ xe</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Chủ bãi</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Địa chỉ</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Sức chứa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Chỗ trống</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Đang thuê</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Trạng thái phí</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Phí nền tảng đã nộp</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Số HĐ Active</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Doanh số thuê/tháng</Data></Cell>
   </Row>
   ${facilityBreakdown.map((fac) => `
   <Row>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${fac.id}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(fac.name)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(fac.provider_name)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(fac.address)}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${fac.capacity}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${fac.available_slots}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${fac.occupied_slots}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(fac.payment_status_label)}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${fac.completed_platform_fee}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${fac.active_contracts_count}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${fac.monthly_turnover}</Data></Cell>
   </Row>`).join("")}
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Chi tiết giao dịch">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="70"/>
   <Column ss:Width="130"/>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mã GD</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Thời gian</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Cơ sở bãi xe</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Chủ bãi</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Email</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Số điện thoại</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Loại GD</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Số tiền (VNĐ)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Trạng thái</Data></Cell>
   </Row>
   ${formattedTransactions.map((tx) => `
   <Row>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${tx.id}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tx.created_at_formatted)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tx.facility_name)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tx.provider_name)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tx.provider_email)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tx.provider_phone)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tx.transaction_type)}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${tx.amount}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(tx.status_label)}</Data></Cell>
   </Row>`).join("")}
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Hợp đồng thuê">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="130"/>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>
   <Column ss:Width="100"/>
   <Column ss:Width="160"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mã hợp đồng</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Bãi đỗ xe</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Chủ bãi</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Khách hàng</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Số điện thoại</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Thông tin xe</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ngày bắt đầu</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ngày kết thúc</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Giá thuê/tháng</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Trạng thái</Data></Cell>
   </Row>
   ${formattedContracts.map((c) => `
   <Row>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(c.contract_code)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(c.facility_name)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(c.provider_name)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(c.customer_name)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(c.customer_phone)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(c.vehicle_info)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(c.start_date_formatted)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(c.end_date_formatted)}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${c.agreed_price}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(c.status_label)}</Data></Cell>
   </Row>`).join("")}
  </Table>
 </Worksheet>
</Workbook>`;

    let filename = "";
    if (periodLabel) {
      const sanitized = periodLabel.replace(/\s+/g, "_").replace(/\//g, "-");
      filename = `ParkLink_Bao_Cao_Doanh_Thu_${sanitized}.xls`;
    } else if (from && to) {
      filename = `ParkLink_Bao_Cao_Doanh_Thu_${from}_den_${to}.xls`;
    } else {
      filename = `ParkLink_Bao_Cao_Doanh_Thu_Toan_Bo_${new Date().toISOString().slice(0, 10)}.xls`;
    }

    return {
      filename,
      contentType: "application/vnd.ms-excel; charset=utf-8",
      content: excelXml
    };
  }
}

module.exports = new AdminService();
