/**
 * Middleware validation kiểm tra tính hợp lệ của dữ liệu đầu vào cho Field Inspector API
 */

const {
  cleanText,
  isValidName,
  isValidPhone,
  isValidEmail
} = require('../utils/validators');

/**
 * Validate tạo tài khoản Nhân viên khảo sát (UC-86)
 */
const validateCreateFieldInspector = (req, res, next) => {
  const { email, full_name, phone_number, address } = req.body;
  const errors = [];

  const cleanedName = cleanText(full_name);
  const cleanedPhone = (phone_number || '').trim();
  const cleanedEmail = (email || '').trim();

  if (!isValidName(cleanedName)) {
    errors.push('Họ và tên chỉ được chứa chữ cái, tối thiểu 2 ký tự và không chứa số hay ký tự đặc biệt.');
  }

  if (!isValidEmail(cleanedEmail)) {
    errors.push('Email không đúng định dạng (Ví dụ: inspector@example.com).');
  }

  if (!isValidPhone(cleanedPhone)) {
    errors.push('Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0912345678).');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: errors[0],
      errors
    });
  }

  req.body.full_name = cleanedName;
  req.body.phone_number = cleanedPhone;
  req.body.email = cleanedEmail;
  if (address) req.body.address = address.trim();

  next();
};

/**
 * Validate cập nhật thông tin Nhân viên khảo sát (UC-88)
 */
const validateUpdateFieldInspector = (req, res, next) => {
  const { full_name, phone_number, address, status } = req.body;
  const errors = [];

  if (full_name !== undefined) {
    const cleanedName = cleanText(full_name);
    if (!isValidName(cleanedName)) {
      errors.push('Họ và tên chỉ được chứa chữ cái, tối thiểu 2 ký tự và không chứa số hay ký tự đặc biệt.');
    } else {
      req.body.full_name = cleanedName;
    }
  }

  if (phone_number !== undefined) {
    const cleanedPhone = phone_number.trim();
    if (!isValidPhone(cleanedPhone)) {
      errors.push('Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0912345678).');
    } else {
      req.body.phone_number = cleanedPhone;
    }
  }

  if (status !== undefined && !['ACTIVE', 'BLOCKED', 'INACTIVE'].includes(status)) {
    errors.push('Trạng thái tài khoản không hợp lệ.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: errors[0],
      errors
    });
  }

  if (address) req.body.address = address.trim();

  next();
};

module.exports = {
  validateCreateFieldInspector,
  validateUpdateFieldInspector
};
