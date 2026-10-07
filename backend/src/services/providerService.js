const facilityRepository = require('../repositories/facilityRepository');

class ProviderService {
  /**
   * Cập nhật thông tin bãi đỗ xe (sức chứa, giá tiền, trạng thái hiển thị)
   */
  async updateMyFacility(providerId, updateData) {
    // 1. Lấy thông tin facility của provider này
    const facility = await facilityRepository.getFacilityByProviderId(providerId);
    if (!facility) {
      throw new Error("Không tìm thấy bãi đỗ xe của bạn.");
    }

    // 2. Chỉ cho phép cập nhật một số trường
    const allowedUpdates = {};
    if (updateData.price_per_month !== undefined) {
      allowedUpdates.price_per_month = parseFloat(updateData.price_per_month);
    }
    if (updateData.visibility_status !== undefined) {
      allowedUpdates.visibility_status = updateData.visibility_status;
    }

    // 3. Gọi repository để update
    return await facilityRepository.updateFacility(facility.id, allowedUpdates);
  }
}

module.exports = new ProviderService();
