const { cleanText } = require('../utils/validators');

const validateConfirmationRecordId = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Mã biên bản xác nhận / hợp đồng (id) không hợp lệ!'
    });
  }
  req.params.id = id;
  next();
};

const validateCreateConfirmationRecord = (req, res, next) => {
  const {
    reservation_id,
    agreed_price,
    payment_deadline_day,
    start_date,
    end_date,
    parking_spot,
    vehicle_type,
    license_plate
  } = req.body;

  const errors = [];

  if (!reservation_id || isNaN(reservation_id) || Number(reservation_id) <= 0) {
    errors.push('Mã yêu cầu thuê bãi xe (reservation_id) không hợp lệ!');
  }

  if (agreed_price === undefined || agreed_price === null || isNaN(agreed_price) || Number(agreed_price) <= 0) {
    errors.push('Giá thuê thỏa thuận hàng tháng (agreed_price) phải là số dương hợp lệ!');
  }

  if (payment_deadline_day !== undefined && payment_deadline_day !== null && payment_deadline_day !== '') {
    const day = Number(payment_deadline_day);
    if (isNaN(day) || day < 1 || day > 31) {
      errors.push('Hạn thanh toán hàng tháng (payment_deadline_day) phải là ngày từ 1 đến 31!');
    }
  }

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
  if (req.body.customer_address) req.body.customer_address = cleanText(req.body.customer_address);
  if (req.body.customer_id_card) req.body.customer_id_card = cleanText(req.body.customer_id_card);

  next();
};

const validateAdminQueryConfirmationRecords = (req, res, next) => {
  const { page, limit, start_date, end_date, facility_id, provider_id, customer_id } = req.query;
  const errors = [];

  if (page !== undefined && page !== '' && (isNaN(page) || Number(page) < 1)) {
    errors.push('Tham số phân trang (page) phải là số nguyên dương!');
  }

  if (limit !== undefined && limit !== '' && (isNaN(limit) || Number(limit) < 1 || Number(limit) > 100)) {
    errors.push('Số lượng bản ghi mỗi trang (limit) phải từ 1 đến 100!');
  }

  if (facility_id !== undefined && facility_id !== '' && (isNaN(facility_id) || Number(facility_id) < 1)) {
    errors.push('ID bãi đỗ xe (facility_id) không hợp lệ!');
  }

  if (provider_id !== undefined && provider_id !== '' && (isNaN(provider_id) || Number(provider_id) < 1)) {
    errors.push('ID chủ bãi xe (provider_id) không hợp lệ!');
  }

  if (customer_id !== undefined && customer_id !== '' && (isNaN(customer_id) || Number(customer_id) < 1)) {
    errors.push('ID khách hàng (customer_id) không hợp lệ!');
  }

  if (start_date && isNaN(Date.parse(start_date))) {
    errors.push('Ngày bắt đầu (start_date) không đúng định dạng YYYY-MM-DD!');
  }

  if (end_date && isNaN(Date.parse(end_date))) {
    errors.push('Ngày kết thúc (end_date) không đúng định dạng YYYY-MM-DD!');
  }

  if (start_date && end_date && !isNaN(Date.parse(start_date)) && !isNaN(Date.parse(end_date))) {
    if (new Date(end_date) < new Date(start_date)) {
      errors.push('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Tham số truy vấn danh sách hợp đồng không hợp lệ!',
      errors
    });
  }

  next();
};

const validateProviderActiveCustomersQuery = (req, res, next) => {
  const { facility_id, page, limit } = req.query;
  const errors = [];

  if (facility_id !== undefined && facility_id !== '' && (isNaN(facility_id) || Number(facility_id) < 1)) {
    errors.push('ID cơ sở bãi đỗ xe (facility_id) phải là số nguyên dương hợp lệ!');
  }

  if (page !== undefined && page !== '' && (isNaN(page) || Number(page) < 1)) {
    errors.push('Tham số phân trang (page) phải là số nguyên dương!');
  }

  if (limit !== undefined && limit !== '' && (isNaN(limit) || Number(limit) < 1 || Number(limit) > 100)) {
    errors.push('Số lượng bản ghi mỗi trang (limit) phải từ 1 đến 100!');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Tham số truy vấn danh sách khách hàng hoạt động không hợp lệ!',
      errors
    });
  }

  next();
};

const validateRequestLeaseExtension = (req, res, next) => {
  const contractId = req.params.id || req.body.contract_id;
  const {
    extension_months,
    new_end_date,
    reason,
    vehicle_type,
    license_plate,
    customer_address,
    customer_phone
  } = req.body;
  const errors = [];

  if (!contractId || isNaN(contractId) || Number(contractId) <= 0) {
    errors.push('Mã hợp đồng / biên bản xác nhận (contract_id) không hợp lệ!');
  }

  const hasMonths = extension_months !== undefined && extension_months !== null && extension_months !== '';
  const hasEndDate = new_end_date !== undefined && new_end_date !== null && new_end_date !== '';

  if (!hasMonths && !hasEndDate) {
    errors.push('Vui lòng chọn số tháng muốn gia hạn (extension_months) hoặc chọn ngày kết thúc mới (new_end_date)!');
  }

  if (hasMonths) {
    const months = Number(extension_months);
    if (!Number.isInteger(months) || months < 1 || months > 24) {
      errors.push('Số tháng gia hạn thuê phải là số nguyên từ 1 đến 24 tháng (hệ thống chỉ hỗ trợ thuê theo tháng)!');
    }
  }

  if (hasEndDate) {
    if (isNaN(Date.parse(new_end_date))) {
      errors.push('Ngày kết thúc mới mong muốn (new_end_date) không đúng định dạng YYYY-MM-DD!');
    }
  }

  if (reason && typeof reason === 'string' && reason.trim().length > 500) {
    errors.push('Ghi chú / lý do gia hạn không được vượt quá 500 ký tự!');
  }

  if (vehicle_type && typeof vehicle_type === 'string' && vehicle_type.trim().length > 100) {
    errors.push('Tên loại xe không được vượt quá 100 ký tự!');
  }

  if (license_plate && typeof license_plate === 'string' && license_plate.trim().length > 20) {
    errors.push('Biển số xe không được vượt quá 20 ký tự!');
  }

  if (customer_phone && typeof customer_phone === 'string' && !/^[0-9+]{9,15}$/.test(customer_phone.trim())) {
    errors.push('Số điện thoại liên hệ không đúng định dạng!');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu yêu cầu gia hạn hợp đồng không hợp lệ!',
      errors
    });
  }

  if (contractId) req.params.id = parseInt(contractId, 10);
  if (hasMonths) req.body.extension_months = parseInt(extension_months, 10);
  if (reason) req.body.reason = cleanText(reason);
  if (vehicle_type) req.body.vehicle_type = cleanText(vehicle_type);
  if (license_plate) req.body.license_plate = cleanText(license_plate);
  if (customer_address) req.body.customer_address = cleanText(customer_address);
  if (customer_phone) req.body.customer_phone = cleanText(customer_phone);

  next();
};

const validateRespondLeaseExtension = (req, res, next) => {
  const { status, provider_note } = req.body;
  const errors = [];

  const validStatuses = ['APPROVED', 'REJECTED'];
  if (!status || !validStatuses.includes(status.toUpperCase())) {
    errors.push('Trạng thái phản hồi phải là APPROVED (Đồng ý) hoặc REJECTED (Từ chối)!');
  }

  if (provider_note && typeof provider_note === 'string' && provider_note.trim().length > 500) {
    errors.push('Ghi chú phản hồi của chủ bãi không được vượt quá 500 ký tự!');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu phản hồi yêu cầu gia hạn không hợp lệ!',
      errors
    });
  }

  req.body.status = status.toUpperCase();
  if (provider_note) req.body.provider_note = cleanText(provider_note);

  next();
};

const validateRequestEarlyTermination = (req, res, next) => {
  const contractId = req.params.id || req.body.contract_id;
  const { termination_date, reason, bank_account_info } = req.body;
  const errors = [];

  if (!contractId || isNaN(contractId) || Number(contractId) <= 0) {
    errors.push('Mã hợp đồng / biên bản xác nhận (contract_id) không hợp lệ!');
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    errors.push('Vui lòng nêu rõ lý do chấm dứt hợp đồng trước hạn (tối thiểu 5 ký tự)!');
  } else if (reason.trim().length > 500) {
    errors.push('Lý do chấm dứt hợp đồng không được vượt quá 500 ký tự!');
  }

  if (termination_date) {
    if (isNaN(Date.parse(termination_date))) {
      errors.push('Ngày chấm dứt hợp đồng (termination_date) không đúng định dạng YYYY-MM-DD!');
    }
  }

  if (bank_account_info && typeof bank_account_info === 'string' && bank_account_info.trim().length > 200) {
    errors.push('Thông tin tài khoản nhận hoàn tiền không được vượt quá 200 ký tự!');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu yêu cầu chấm dứt hợp đồng không hợp lệ!',
      errors
    });
  }

  if (contractId) req.params.id = parseInt(contractId, 10);
  req.body.reason = cleanText(reason);
  if (bank_account_info) req.body.bank_account_info = cleanText(bank_account_info);

  next();
};

const validateConfirmContractTermination = (req, res, next) => {
  const { status, provider_note, refund_amount } = req.body;
  const errors = [];

  const validStatuses = ['CONFIRMED', 'APPROVED', 'REJECTED'];
  if (status && !validStatuses.includes(status.toUpperCase())) {
    errors.push('Trạng thái xác nhận phải là CONFIRMED (hoặc APPROVED) để đồng ý, hoặc REJECTED để từ chối!');
  }

  if (provider_note && typeof provider_note === 'string' && provider_note.trim().length > 500) {
    errors.push('Ghi chú của chủ bãi không được vượt quá 500 ký tự!');
  }

  if (refund_amount !== undefined && refund_amount !== null && refund_amount !== '') {
    if (isNaN(refund_amount) || Number(refund_amount) < 0) {
      errors.push('Số tiền hoàn trả (refund_amount) phải là số dương hợp lệ!');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu xác nhận chấm dứt hợp đồng không hợp lệ!',
      errors
    });
  }

  if (status) req.body.status = status.toUpperCase();
  if (provider_note) req.body.provider_note = cleanText(provider_note);
  if (refund_amount !== undefined && refund_amount !== null && refund_amount !== '') {
    req.body.refund_amount = Number(refund_amount);
  }

  next();
};

module.exports = {
  validateConfirmationRecordId,
  validateCreateConfirmationRecord,
  validateAdminQueryConfirmationRecords,
  validateProviderActiveCustomersQuery,
  validateRequestLeaseExtension,
  validateRespondLeaseExtension,
  validateRequestEarlyTermination,
  validateConfirmContractTermination
};
