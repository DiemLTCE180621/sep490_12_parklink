const { cleanText } = require('../utils/validators');

const validateReservationId = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Mã yêu cầu thuê (id) không hợp lệ!'
    });
  }
  req.params.id = id;
  next();
};

const validateCreateReservation = (req, res, next) => {
  let {
    facility_id,
    vehicle_info,
    desired_start_date,
    vehicle_brand,
    license_plate,
    customer_id_card,
    customer_address
  } = req.body;
  const errors = [];

  if (!facility_id || isNaN(facility_id) || Number(facility_id) <= 0) {
    errors.push('Mã bãi đỗ xe (facility_id) không hợp lệ!');
  }

  if (!vehicle_info && (vehicle_brand || license_plate)) {
    const brand = cleanText(vehicle_brand) || 'Chưa cập nhật';
    const plate = cleanText(license_plate) || 'Chưa cập nhật';
    let extra = '';
    if (customer_id_card || customer_address) {
      extra = ` [CCCD: ${cleanText(customer_id_card) || 'Chưa cập nhật'} | ĐC: ${cleanText(customer_address) || 'Chưa cập nhật'}]`;
    }
    vehicle_info = `${brand} - Biển số: ${plate}${extra}`;
  }

  const cleanedVehicleInfo = cleanText(vehicle_info);
  if (!cleanedVehicleInfo || cleanedVehicleInfo.length < 3) {
    errors.push('Thông tin phương tiện (vehicle_info) phải từ 3 ký tự trở lên (Ví dụ: Toyota Camry 65A-123.45).');
  }

  if (!desired_start_date) {
    errors.push('Vui lòng chọn ngày mong muốn bắt đầu thuê!');
  } else {
    const parsedDate = Date.parse(desired_start_date);
    if (isNaN(parsedDate)) {
      errors.push('Ngày bắt đầu thuê (desired_start_date) không đúng định dạng YYYY-MM-DD!');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu gửi yêu cầu thuê không hợp lệ!',
      errors
    });
  }

  req.body.facility_id = parseInt(facility_id, 10);
  req.body.vehicle_info = cleanedVehicleInfo;

  next();
};

const validateRespondReservation = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  const allowedStatuses = ['APPROVED', 'REJECTED'];
  if (!status || !allowedStatuses.includes(status.toUpperCase())) {
    errors.push('Trạng thái phản hồi (status) phải là APPROVED hoặc REJECTED!');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu phản hồi yêu cầu thuê không hợp lệ!',
      errors
    });
  }

  req.body.status = status.toUpperCase();
  next();
};

module.exports = {
  validateReservationId,
  validateCreateReservation,
  validateRespondReservation
};
