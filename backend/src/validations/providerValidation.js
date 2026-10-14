/**
 * Middleware kiểm tra tính hợp lệ dữ liệu đầu vào cho các yêu cầu từ Parking Provider
 * Tuân thủ quy tắc kiến trúc 3-tier của ParkLink
 */

/**
 * Validate dữ liệu khi Provider cập nhật thông tin bãi đỗ xe (chỗ trống khả dụng, giá thuê, trạng thái)
 */
const validateUpdateFacility = (req, res, next) => {
  const { available_slots, price_per_month, visibility_status } = req.body;
  const errors = [];

  // 1. Kiểm tra số chỗ trống hiện tại (available_slots) nếu có truyền lên
  if (available_slots !== undefined && available_slots !== null && available_slots !== '') {
    const numSlots = Number(available_slots);
    if (isNaN(numSlots) || !Number.isInteger(numSlots) || numSlots < 0) {
      errors.push('Số chỗ trống hiện tại (available_slots) phải là số nguyên lớn hơn hoặc bằng 0.');
    }
  }

  // 2. Kiểm tra giá thuê theo tháng (price_per_month) nếu có truyền lên
  if (price_per_month !== undefined && price_per_month !== null && price_per_month !== '') {
    const numPrice = Number(price_per_month);
    if (isNaN(numPrice) || numPrice < 0) {
      errors.push('Giá thuê mỗi tháng phải là số lớn hơn hoặc bằng 0.');
    }
  }

  // 3. Kiểm tra trạng thái hiển thị (visibility_status) nếu có truyền lên
  if (visibility_status !== undefined && visibility_status !== null) {
    const allowedStatuses = ['VISIBLE', 'HIDDEN'];
    if (!allowedStatuses.includes(visibility_status)) {
      errors.push('Trạng thái hiển thị chỉ có thể là VISIBLE hoặc HIDDEN.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      error: errors[0],
      message: 'Dữ liệu cập nhật bãi đỗ xe không hợp lệ!',
      errors
    });
  }

  next();
};

module.exports = {
  validateUpdateFacility
};
