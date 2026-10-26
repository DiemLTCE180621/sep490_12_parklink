const facilityRepository = require("../repositories/facilityRepository");

class InspectorService {
  /**
   * Lấy danh sách bãi đỗ xe đang chờ khảo sát (PREPARING)
   * Có thể lọc theo ID của Nhân viên khảo sát phụ trách
   * @param {number|null} inspectorId
   */
  async getPreparingFacilities(inspectorId = null) {
    return await facilityRepository.findPreparingFacilities(inspectorId);
  }

  /**
   * Lấy chi tiết cơ sở bãi đỗ xe cần khảo sát
   * @param {number} facilityId
   * @param {number|null} inspectorId - ID của nhân viên đang đăng nhập
   */
  async getFacilityDetails(facilityId, inspectorId = null) {
    const facility = await facilityRepository.findById(facilityId);
    if (!facility) {
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), { status: 404 });
    }
    // Chỉ nhân viên được phân công mới có quyền xem chi tiết hồ sơ khảo sát
    if (inspectorId && facility.assigned_inspector_id && facility.assigned_inspector_id !== inspectorId) {
      throw Object.assign(
        new Error("Bạn không có quyền truy cập cơ sở này vì đã được phân công cho nhân viên khác!"),
        { status: 403 }
      );
    }
    if (facility.provider) {
      delete facility.provider.password;
    }
    return facility;
  }

  /**
   * Nhân viên khảo sát gửi kết quả khảo sát (cập nhật capacity, tải ảnh)
   * @param {number} facilityId
   * @param {number} capacity
   * @param {string[]} images
   * @param {number|null} inspectorId - ID của nhân viên đang đăng nhập
   */
  async submitInspection(facilityId, capacity, images = [], inspectorId = null) {
    const facility = await facilityRepository.findById(facilityId);
    if (!facility) {
      throw Object.assign(new Error("Bãi đỗ xe không tồn tại!"), { status: 404 });
    }
    if (facility.verification_status !== "PREPARING") {
      throw Object.assign(new Error("Bãi đỗ xe không ở trạng thái chờ khảo sát!"), { status: 400 });
    }
    // Chỉ nhân viên được phân công mới có quyền gửi báo cáo khảo sát
    if (inspectorId && facility.assigned_inspector_id && facility.assigned_inspector_id !== inspectorId) {
      throw Object.assign(
        new Error("Bạn không có quyền gửi báo cáo khảo sát cho cơ sở này vì đã được phân công cho nhân viên khác!"),
        { status: 403 }
      );
    }
    
    return await facilityRepository.inspectFacility(facilityId, capacity, images);
  }
}

module.exports = new InspectorService();
