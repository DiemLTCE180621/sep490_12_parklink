const facilityRepository = require('../repositories/facilityRepository');

/**
 * Service xử lý toàn bộ logic nghiệp vụ (Business Logic) cho Parking Provider
 * Tuân thủ quy tắc kiến trúc 3-tier của ParkLink
 */
class ProviderService {
  /**
   * Lấy thông tin cơ sở bãi đỗ xe của chính Provider kèm số chỗ trống khả dụng và số hợp đồng hiệu lực
   * @param {number} providerId - ID của tài khoản Provider
   */
  async getMyFacility(providerId) {
    const facility = await facilityRepository.getFacilityByProviderId(providerId);
    if (!facility) {
      return null;
    }

    // Đếm số lượng hợp đồng (xe) đang thuê gửi hiệu lực (ACTIVE) tại bãi
    const activeContractsCount = await facilityRepository.getActiveContractsCount(facility.id);

    return {
      ...facility,
      available_slots: facility.available_slots !== undefined && facility.available_slots !== null 
        ? facility.available_slots 
        : facility.capacity,
      active_contracts: activeContractsCount
    };
  }

  /**
   * Cập nhật thông tin bãi đỗ xe:
   * - available_slots: Số chỗ trống thực tế hiện tại (không vượt quá tổng capacity đã đăng ký)
   * - price_per_month: Giá thuê theo tháng
   * - visibility_status: Trạng thái hiển thị (VISIBLE / HIDDEN)
   * LƯU Ý NGHIỆP VỤ: 'capacity' là tổng sức chứa đã trả phí mở cổng nên là CỐ ĐỊNH, không cho Provider tự ý tăng/giảm.
   *
   * @param {number} providerId - ID của tài khoản Provider
   * @param {object} updateData - Dữ liệu cập nhật { available_slots, price_per_month, visibility_status }
   */
  async updateMyFacility(providerId, updateData) {
    // 1. Lấy thông tin facility hiện tại của provider
    const facility = await facilityRepository.getFacilityByProviderId(providerId);
    if (!facility) {
      const err = new Error("Không tìm thấy bãi đỗ xe của bạn.");
      err.status = 404;
      throw err;
    }

    const allowedUpdates = {};

    // 2. Nghiệp vụ: Cập nhật số chỗ trống thực tế hiện tại (available_slots)
    if (updateData.available_slots !== undefined && updateData.available_slots !== null && updateData.available_slots !== '') {
      const newAvailableSlots = parseInt(updateData.available_slots, 10);

      // Ràng buộc nghiệp vụ: Số chỗ trống không được âm và KHÔNG ĐƯỢC VƯỢT QUÁ tổng capacity đã đăng ký
      if (newAvailableSlots < 0 || newAvailableSlots > facility.capacity) {
        const err = new Error(
          `Số chỗ trống hiện tại (${newAvailableSlots} chỗ) không thể vượt quá tổng sức chứa đã đăng ký (${facility.capacity} chỗ) hoặc nhỏ hơn 0.`
        );
        err.status = 400;
        throw err;
      }

      allowedUpdates.available_slots = newAvailableSlots;
    }

    // 3. Nghiệp vụ: Cập nhật giá thuê theo tháng (price_per_month)
    if (updateData.price_per_month !== undefined && updateData.price_per_month !== null && updateData.price_per_month !== '') {
      allowedUpdates.price_per_month = parseFloat(updateData.price_per_month);
    }

    // 4. Nghiệp vụ: Cập nhật trạng thái hiển thị (visibility_status)
    if (updateData.visibility_status !== undefined && updateData.visibility_status !== null) {
      // Chỉ cho phép hiển thị VISIBLE nếu bãi xe đã được duyệt (APPROVED) và đã thanh toán phí nền tảng (PAID)
      if (updateData.visibility_status === 'VISIBLE') {
        if (facility.verification_status !== 'APPROVED') {
          const err = new Error("Bãi đỗ xe của bạn chưa được phê duyệt, không thể hiển thị công khai.");
          err.status = 400;
          throw err;
        }
        if (facility.payment_status !== 'PAID') {
          const err = new Error("Bãi đỗ xe chưa hoàn tất thanh toán phí nền tảng, không thể hiển thị công khai.");
          err.status = 400;
          throw err;
        }
      }
      allowedUpdates.visibility_status = updateData.visibility_status;
    }

    // 5. Nếu không có trường nào thay đổi, trả về facility hiện tại
    if (Object.keys(allowedUpdates).length === 0) {
      return facility;
    }

    // 6. Gọi repository để cập nhật vào Database
    const updatedFacility = await facilityRepository.updateFacility(facility.id, allowedUpdates);

    // 7. Lấy số hợp đồng hiệu lực để trả về đối tượng đầy đủ
    const activeContractsCount = await facilityRepository.getActiveContractsCount(facility.id);

    return {
      ...updatedFacility,
      active_contracts: activeContractsCount
    };
  }
}

module.exports = new ProviderService();
