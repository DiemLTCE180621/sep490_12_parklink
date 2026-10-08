const facilityRepository = require("../repositories/facilityRepository");

class InspectorService {
  /**
   * Lấy danh sách bãi đỗ xe đang chờ khảo sát (PREPARING)
   */
  async getPreparingFacilities() {
    return await facilityRepository.findPreparingFacilities();
  }

  /**
   * Nhân viên khảo sát gửi kết quả khảo sát (cập nhật capacity, tải ảnh)
   * @param {number} facilityId
   * @param {number} capacity
   * @param {string[]} images
   */
  async submitInspection(facilityId, capacity, images = []) {
    const facility = await facilityRepository.findById(facilityId);
    if (!facility) {
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), { status: 404 });
    }
    if (facility.verification_status !== "PREPARING") {
      throw Object.assign(new Error("Bãi đỗ xe không ở trạng thái chờ khảo sát!"), { status: 400 });
    }
    
    return await facilityRepository.inspectFacility(facilityId, capacity, images);
  }
}

module.exports = new InspectorService();
