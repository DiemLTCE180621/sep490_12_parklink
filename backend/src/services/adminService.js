const facilityRepository = require("../repositories/facilityRepository");
const userRepository = require("../repositories/userRepository");
const roleRepository = require("../repositories/roleRepository");
const emailService = require("../utils/emailService");
const bcrypt = require("bcryptjs");
/**
 * Service xử lý logic nghiệp vụ dành riêng cho Admin
 */
class AdminService {
  /**
   * M2-UC20: View pending owner registrations
   * Lấy danh sách bãi đỗ xe đang PENDING_REVIEW hoặc PREPARING
   */
  async getPendingRegistrations() {
    return await facilityRepository.findPendingFacilities();
  }

  /**
   * M2-UC21 Bước 1: Duyệt sơ bộ → PREPARING
   * Admin chấp thuận đến thực địa chuẩn bị. Gửi mail thông báo cho Provider.
   * @param {number} facilityId
   */
  async approveRegistration(facilityId) {
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

    const updatedFacility = await facilityRepository.prepareFacility(
      facilityId,
      facility.provider_id,
    );

    // Gửi mail thông báo "đang chuẩn bị"
    await emailService.sendFacilityPreparingEmail({
      toEmail: facility.provider.email,
      fullName: facility.provider.full_name,
      facilityName: facility.name,
    });

    return updatedFacility;
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
}

module.exports = new AdminService();
