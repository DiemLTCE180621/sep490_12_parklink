const amenityRepository = require('../repositories/amenityRepository');

class AmenityService {
  async getAllAmenities(query = {}) {
    let { keyword, is_active, type, page, limit } = query;

    let parsedIsActive;
    if (is_active === 'true' || is_active === true) {
      parsedIsActive = true;
    } else if (is_active === 'false' || is_active === false) {
      parsedIsActive = false;
    }

    return await amenityRepository.findAll({
      keyword,
      is_active: parsedIsActive,
      type,
      page,
      limit
    });
  }

  async getActiveAmenities() {
    return await amenityRepository.findActive();
  }

  async createAmenity(data) {
    const { name, icon, type, is_active } = data;
    const normalizedName = name.trim();

    const existingByName = await amenityRepository.findByName(normalizedName);
    if (existingByName) {
      const error = new Error(`Tên tiện ích "${normalizedName}" đã tồn tại trên hệ thống!`);
      error.status = 400;
      throw error;
    }

    const createPayload = {
      name: normalizedName,
      icon: icon ? icon.trim() : null,
      type: type ? type.trim().toUpperCase() : null,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    };

    return await amenityRepository.create(createPayload);
  }

  async updateAmenity(id, data) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      const error = new Error('ID tiện ích không hợp lệ!');
      error.status = 400;
      throw error;
    }

    const existing = await amenityRepository.findById(numId);
    if (!existing) {
      const error = new Error('Không tìm thấy tiện ích cần cập nhật!');
      error.status = 404;
      throw error;
    }

    const updatePayload = {};

    if (data.name !== undefined) {
      const normalizedName = data.name.trim();
      if (normalizedName.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicateName = await amenityRepository.findByName(normalizedName);
        if (duplicateName && duplicateName.id !== numId) {
          const error = new Error(`Tên tiện ích "${normalizedName}" đã được sử dụng bởi tiện ích khác!`);
          error.status = 400;
          throw error;
        }
      }
      updatePayload.name = normalizedName;
    }

    if (data.icon !== undefined) {
      updatePayload.icon = data.icon ? data.icon.trim() : null;
    }

    if (data.type !== undefined) {
      updatePayload.type = data.type ? data.type.trim().toUpperCase() : null;
    }

    if (data.is_active !== undefined) {
      updatePayload.is_active = Boolean(data.is_active);
    }

    return await amenityRepository.update(numId, updatePayload);
  }

  async toggleAmenityStatus(id) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      const error = new Error('ID tiện ích không hợp lệ!');
      error.status = 400;
      throw error;
    }

    const existing = await amenityRepository.findById(numId);
    if (!existing) {
      const error = new Error('Không tìm thấy tiện ích!');
      error.status = 404;
      throw error;
    }

    const newStatus = !existing.is_active;
    const updated = await amenityRepository.update(numId, { is_active: newStatus });

    const statusText = newStatus ? 'hiển thị (kích hoạt)' : 'ẩn';
    return {
      message: `Đã ${statusText} tiện ích "${updated.name}" thành công!`,
      amenity: updated
    };
  }
}

module.exports = new AmenityService();
