const vehicleTypeRepository = require('../repositories/vehicleTypeRepository');

/**
 * Xử lý nghiệp vụ loại phương tiện
 */
class VehicleTypeService {
  /**
   * Tìm và lọc loại phương tiện
   * @param {Object} query - { keyword, is_active }
   * @returns {Promise<Array>} Danh sách loại phương tiện
   */
  async getAllVehicleTypes(query = {}) {
    let { keyword, is_active } = query;

    // Chuyển đổi tham số is_active từ chuỗi query sang kiểu boolean nếu có
    let parsedIsActive;
    if (is_active === 'true' || is_active === true) {
      parsedIsActive = true;
    } else if (is_active === 'false' || is_active === false) {
      parsedIsActive = false;
    }

    return await vehicleTypeRepository.findAll({
      keyword,
      is_active: parsedIsActive
    });
  }

  /**
   * Lấy danh sách các loại phương tiện đang hoạt động (Active)
   * Phục vụ cho giao diện đăng ký bãi xe (Provider) và tìm kiếm (Customer)
   * @returns {Promise<Array>}
   */
  async getActiveVehicleTypes() {
    return await vehicleTypeRepository.findActive();
  }

  /**
   * Lấy loại phương tiện theo ID
   * @param {number} id - ID loại phương tiện
   * @returns {Promise<Object>}
   */
  async getVehicleTypeById(id) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      const error = new Error('ID loại phương tiện không hợp lệ!');
      error.status = 400;
      throw error;
    }

    const vehicleType = await vehicleTypeRepository.findById(numId);
    if (!vehicleType) {
      const error = new Error('Không tìm thấy loại phương tiện yêu cầu!');
      error.status = 404;
      throw error;
    }

    return vehicleType;
  }

  /**
   * Tạo loại phương tiện
   * Chuẩn hóa mã và kiểm tra trùng mã, tên.
   * @param {Object} data - { type_code, name, description, is_active }
   * @returns {Promise<Object>} Loại phương tiện vừa tạo
   */
  async createVehicleType(data) {
    const { type_code, name, description, is_active } = data;

    // Chuẩn hóa mã phương tiện sang chữ in hoa
    const normalizedCode = type_code.trim().toUpperCase();
    const normalizedName = name.trim();

    // Kiểm tra trùng mã loại phương tiện
    const existingByCode = await vehicleTypeRepository.findByCode(normalizedCode);
    if (existingByCode) {
      const error = new Error(`Mã loại phương tiện "${normalizedCode}" đã tồn tại trên hệ thống!`);
      error.status = 400;
      throw error;
    }

    // Kiểm tra trùng tên loại phương tiện
    const existingByName = await vehicleTypeRepository.findByName(normalizedName);
    if (existingByName) {
      const error = new Error(`Tên loại phương tiện "${normalizedName}" đã tồn tại trên hệ thống!`);
      error.status = 400;
      throw error;
    }

    const createPayload = {
      type_code: normalizedCode,
      name: normalizedName,
      description: description ? description.trim() : null,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    };

    return await vehicleTypeRepository.create(createPayload);
  }

  /**
   * Cập nhật loại phương tiện
   * Kiểm tra trùng mã và tên với loại khác.
   * @param {number} id - ID loại phương tiện cần cập nhật
   * @param {Object} data - Dữ liệu cần cập nhật { type_code, name, description, is_active }
   * @returns {Promise<Object>} Bản ghi đã cập nhật
   */
  async updateVehicleType(id, data) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      const error = new Error('ID loại phương tiện không hợp lệ!');
      error.status = 400;
      throw error;
    }

    const existing = await vehicleTypeRepository.findById(numId);
    if (!existing) {
      const error = new Error('Không tìm thấy loại phương tiện cần cập nhật!');
      error.status = 404;
      throw error;
    }

    const updatePayload = {};

    // Cập nhật mã nếu thay đổi
    if (data.type_code !== undefined) {
      const normalizedCode = data.type_code.trim().toUpperCase();
      if (normalizedCode !== existing.type_code) {
        const duplicateCode = await vehicleTypeRepository.findByCode(normalizedCode);
        if (duplicateCode && duplicateCode.id !== numId) {
          const error = new Error(`Mã loại phương tiện "${normalizedCode}" đã được sử dụng bởi bản ghi khác!`);
          error.status = 400;
          throw error;
        }
      }
      updatePayload.type_code = normalizedCode;
    }

    // Cập nhật tên nếu thay đổi
    if (data.name !== undefined) {
      const normalizedName = data.name.trim();
      if (normalizedName.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicateName = await vehicleTypeRepository.findByName(normalizedName);
        if (duplicateName && duplicateName.id !== numId) {
          const error = new Error(`Tên loại phương tiện "${normalizedName}" đã được sử dụng bởi bản ghi khác!`);
          error.status = 400;
          throw error;
        }
      }
      updatePayload.name = normalizedName;
    }

    // Cập nhật mô tả nếu có
    if (data.description !== undefined) {
      updatePayload.description = data.description ? data.description.trim() : null;
    }

    // Cập nhật trạng thái nếu có
    if (data.is_active !== undefined) {
      updatePayload.is_active = Boolean(data.is_active);
    }

    return await vehicleTypeRepository.update(numId, updatePayload);
  }

  /**
   * Vô hiệu hóa loại phương tiện
   * Loại đã tắt không xuất hiện khi tạo bãi xe mới.
   * @param {number} id - ID loại phương tiện cần vô hiệu hóa
   * @returns {Promise<Object>} Kết quả xử lý
   */
  async deactivateVehicleType(id) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      const error = new Error('ID loại phương tiện không hợp lệ!');
      error.status = 400;
      throw error;
    }

    const existing = await vehicleTypeRepository.findById(numId);
    if (!existing) {
      const error = new Error('Không tìm thấy loại phương tiện cần vô hiệu hóa!');
      error.status = 404;
      throw error;
    }

    if (!existing.is_active) {
      return {
        message: 'Loại phương tiện này đã ở trạng thái ngừng hoạt động từ trước!',
        vehicleType: existing
      };
    }

    const updated = await vehicleTypeRepository.update(numId, { is_active: false });
    return {
      message: `Đã vô hiệu hóa loại phương tiện "${updated.name}" thành công!`,
      vehicleType: updated
    };
  }

  /**
   * Bật hoặc tắt loại phương tiện
   * @param {number} id - ID loại phương tiện
   * @returns {Promise<Object>}
   */
  async toggleVehicleTypeStatus(id) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      const error = new Error('ID loại phương tiện không hợp lệ!');
      error.status = 400;
      throw error;
    }

    const existing = await vehicleTypeRepository.findById(numId);
    if (!existing) {
      const error = new Error('Không tìm thấy loại phương tiện!');
      error.status = 404;
      throw error;
    }

    const newStatus = !existing.is_active;
    const updated = await vehicleTypeRepository.update(numId, { is_active: newStatus });

    const statusText = newStatus ? 'kích hoạt hoạt động' : 'vô hiệu hóa';
    return {
      message: `Đã ${statusText} loại phương tiện "${updated.name}" thành công!`,
      vehicleType: updated
    };
  }
}

module.exports = new VehicleTypeService();

