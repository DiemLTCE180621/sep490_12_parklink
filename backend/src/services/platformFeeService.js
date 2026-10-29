const platformFeeRepository = require('../repositories/platformFeeRepository');

/**
 * Service xử lý toàn bộ Business Logic liên quan đến Quản lý Phí Nền Tảng (Platform Fee)
 */
class PlatformFeeService {
  /**
   * - Administrator: Xem được toàn bộ biểu phí (cả Active và Inactive).
   * - Parking Provider: Chỉ xem được các biểu phí đang hoạt động (Active).
   */
  async getAllFees(userRole) {
    if (userRole === 'ADMIN') {
      return await platformFeeRepository.findAll();
    }
    // Dành cho Parking Provider
    return await platformFeeRepository.findActiveFees();
  }

  /**
   * Xem chi tiết một gói phí theo ID:
   */
  async getFeeById(id, userRole) {
    const fee = await platformFeeRepository.findById(id);
    if (!fee) {
      const error = new Error('Không tìm thấy gói phí nền tảng yêu cầu!');
      error.status = 404;
      throw error;
    }

    if (userRole === 'PROVIDER' && !fee.is_active) {
      const error = new Error('Gói phí này hiện đã tạm ngưng hoặc không còn khả dụng!');
      error.status = 403;
      throw error;
    }

    return fee;
  }

  /**
   * Tạo mới một gói biểu phí nền tảng theo quy mô chỗ đỗ
   */
  async createFee(data) {
    const { name, min_slots, max_slots, fee_amount, description, is_active } = data;

    // 1. Kiểm tra trùng tên gói phí
    const existingName = await platformFeeRepository.findByName(name.trim());
    if (existingName) {
      const error = new Error(`Tên biểu phí "${name}" đã tồn tại trên hệ thống!`);
      error.status = 400;
      throw error;
    }

    const minSlots = parseInt(min_slots, 10);
    if (isNaN(minSlots) || minSlots < 1) {
      const error = new Error('Số lượng slot tối thiểu (min_slots) phải là số nguyên >= 1!');
      error.status = 400;
      throw error;
    }

    let maxSlots = null;
    if (max_slots !== null && max_slots !== undefined && max_slots !== '' && max_slots !== 'null') {
      maxSlots = parseInt(max_slots, 10);
      if (isNaN(maxSlots) || maxSlots < minSlots) {
        const error = new Error('Số lượng slot tối đa (max_slots) phải lớn hơn hoặc bằng slot tối thiểu!');
        error.status = 400;
        throw error;
      }
    }

    const amount = parseFloat(fee_amount);
    if (isNaN(amount) || amount < 0) {
      const error = new Error('Mức phí nền tảng (fee_amount) phải là một số dương hợp lệ!');
      error.status = 400;
      throw error;
    }

    const newFeeData = {
      name: name.trim(),
      min_slots: minSlots,
      max_slots: maxSlots,
      fee_amount: amount,
      description: description ? description.trim() : null,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    };

    return await platformFeeRepository.create(newFeeData);
  }

  /**
   * Cập nhật gói biểu phí nền tảng
   */
  async updateFee(id, data) {
    const existingFee = await platformFeeRepository.findById(id);
    if (!existingFee) {
      const error = new Error('Không tìm thấy gói phí nền tảng cần cập nhật!');
      error.status = 404;
      throw error;
    }

    // 1. Nếu cập nhật tên, kiểm tra trùng lặp với các cấu hình khác
    if (data.name && data.name.trim().toLowerCase() !== existingFee.name.toLowerCase()) {
      const duplicate = await platformFeeRepository.findByName(data.name.trim());
      if (duplicate && duplicate.id !== id) {
        const error = new Error(`Tên biểu phí "${data.name}" đã tồn tại!`);
        error.status = 400;
        throw error;
      }
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();

    let targetMin = existingFee.min_slots;
    if (data.min_slots !== undefined) {
      const minSlots = parseInt(data.min_slots, 10);
      if (isNaN(minSlots) || minSlots < 1) {
        const error = new Error('Số lượng slot tối thiểu phải là số nguyên >= 1!');
        error.status = 400;
        throw error;
      }
      targetMin = minSlots;
      updateData.min_slots = minSlots;
    }

    if (data.max_slots !== undefined) {
      if (data.max_slots === null || data.max_slots === '' || data.max_slots === 'null') {
        updateData.max_slots = null;
      } else {
        const maxSlots = parseInt(data.max_slots, 10);
        if (isNaN(maxSlots) || maxSlots < targetMin) {
          const error = new Error('Số lượng slot tối đa phải lớn hơn hoặc bằng slot tối thiểu!');
          error.status = 400;
          throw error;
        }
        updateData.max_slots = maxSlots;
      }
    }

    if (data.fee_amount !== undefined) {
      const amount = parseFloat(data.fee_amount);
      if (isNaN(amount) || amount < 0) {
        const error = new Error('Mức phí phải là số dương hợp lệ!');
        error.status = 400;
        throw error;
      }
      updateData.fee_amount = amount;
    }
    if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active);

    return await platformFeeRepository.update(id, updateData);
  }

  /**
   * Bật/Tắt kích hoạt biểu phí
   */
  async toggleFeeStatus(id) {
    const existingFee = await platformFeeRepository.findById(id);
    if (!existingFee) {
      const error = new Error('Không tìm thấy gói phí nền tảng!');
      error.status = 404;
      throw error;
    }

    const nextStatus = !existingFee.is_active;
    const updatedFee = await platformFeeRepository.updateStatus(id, nextStatus);

    return {
      fee: updatedFee,
      action: nextStatus ? 'ACTIVATED' : 'DEACTIVATED',
      message: `Đã ${nextStatus ? 'kích hoạt' : 'vô hiệu hóa'} gói phí "${updatedFee.name}" thành công!`
    };
  }

  /**
   * Tính toán phí nền tảng theo đề tài ParkLink (Theo quy mô số slot Min - Max):
   * - 1 đến 3 slot: 2.000.000 VNĐ (Bãi 1 chỗ, 2 chỗ hoặc 3 chỗ đều thuộc khung này)
   * - 4 đến 7 slot: 4.000.000 VNĐ
   * - Từ 8 slot trở lên: 6.000.000 VNĐ
   */
  async calculateFeeBySlots(slotCount) {
    const slots = parseInt(slotCount, 10);
    if (isNaN(slots) || slots < 1) {
      const error = new Error('Số lượng chỗ đỗ xe (slots) phải là số nguyên dương!');
      error.status = 400;
      throw error;
    }

    // Tìm gói biểu phí phù hợp trong khoảng min_slots <= slots <= max_slots
    const matchedFee = await platformFeeRepository.findFeeBySlots(slots);
    if (!matchedFee) {
      const error = new Error(`Chưa có gói phí nền tảng phù hợp với quy mô ${slots} chỗ đỗ! Vui lòng liên hệ Quản trị viên.`);
      error.status = 404;
      throw error;
    }

    return {
      fee_id: matchedFee.id,
      name: matchedFee.name,
      min_slots: matchedFee.min_slots,
      max_slots: matchedFee.max_slots,
      slots: slots,
      fee_amount: parseFloat(matchedFee.fee_amount), // Mức phí trọn gói theo quy mô (Tiered fee)
      description: matchedFee.description
    };
  }
}

module.exports = new PlatformFeeService();
