const { cleanText } = require('../utils/validators');

/**
 * Middleware kiểm tra tính hợp lệ dữ liệu đầu vào cho Hợp đồng / Biên bản xác nhận điện tử (Confirmation Record)
 * Chuẩn hóa theo 7 mục hợp đồng tiêu chuẩn của hệ thống ParkLink
 */

const validateCreateConfirmationRecord = (req, res, next) => {
  const {
    reservation_id,
    agreed_price,
    payment_deadline_day,
    start_date,
    end_date,
    parking_spot,
    vehicle_type,
    license_plate,
    terms
  } = req.body;

  const errors = [];

  // 1. Kiểm tra reservation_id
  if (!reservation_id || isNaN(reservation_id) || Number(reservation_id) <= 0) {
    errors.push('Mã yêu cầu thuê bãi xe (reservation_id) không hợp lệ!');
  }

  // 2. Kiểm tra agreed_price
  if (agreed_price === undefined || agreed_price === null || isNaN(agreed_price) || Number(agreed_price) <= 0) {
    errors.push('Giá thuê thỏa thuận hàng tháng (agreed_price) phải là số dương hợp lệ!');
  }

  // 3. Kiểm tra payment_deadline_day (từ 1 đến 31)
  if (payment_deadline_day !== undefined && payment_deadline_day !== null && payment_deadline_day !== '') {
    const day = Number(payment_deadline_day);
    if (isNaN(day) || day < 1 || day > 31) {
      errors.push('Hạn thanh toán hàng tháng (payment_deadline_day) phải là ngày từ 1 đến 31!');
    }
  }

  // 4. Kiểm tra start_date và end_date
  if (!start_date) {
    errors.push('Vui lòng chọn ngày bắt đầu hiệu lực hợp đồng (start_date)!');
  } else if (isNaN(Date.parse(start_date))) {
    errors.push('Ngày bắt đầu hợp đồng (start_date) không đúng định dạng YYYY-MM-DD!');
  }

  if (!end_date) {
    errors.push('Vui lòng chọn ngày kết thúc hợp đồng (end_date)!');
  } else if (isNaN(Date.parse(end_date))) {
    errors.push('Ngày kết thúc hợp đồng (end_date) không đúng định dạng YYYY-MM-DD!');
  }

  if (start_date && end_date && !isNaN(Date.parse(start_date)) && !isNaN(Date.parse(end_date))) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end <= start) {
      errors.push('Ngày kết thúc hợp đồng (end_date) phải diễn ra sau ngày bắt đầu (start_date)!');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu tạo hợp đồng điện tử không hợp lệ!',
      errors
    });
  }

  req.body.reservation_id = parseInt(reservation_id, 10);
  req.body.agreed_price = Number(agreed_price);
  if (payment_deadline_day) req.body.payment_deadline_day = parseInt(payment_deadline_day, 10);
  if (parking_spot) req.body.parking_spot = cleanText(parking_spot);
  if (vehicle_type) req.body.vehicle_type = cleanText(vehicle_type);
  if (license_plate) req.body.license_plate = cleanText(license_plate);

  next();
};

module.exports = {
  validateCreateConfirmationRecord
};
