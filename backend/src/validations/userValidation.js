/**
 * Middleware validation kiểm tra tính hợp lệ của dữ liệu đầu vào cho User Management API
 */

const {
  cleanText,
  isValidName,
  isValidPhone
} = require('../utils/validators');

/**
 * Validate cập nhật thông tin người dùng từ Admin (UC13)
 */
const validateUpdateUser = (req, res, next) => {
  const { full_name, phone_number } = req.body;
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
    const cleanedPhone = (phone_number || '').trim();
    if (!isValidPhone(cleanedPhone)) {
      errors.push('Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0912345678).');
    } else {
      req.body.phone_number = cleanedPhone;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: errors[0],
      errors
    });
  }

  next();
};

/**
 * Validate User ID từ params
 */
const validateUserId = (req, res, next) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'ID tài khoản không hợp lệ!'
    });
  }
  next();
};

module.exports = {
  validateUpdateUser,
  validateUserId
};
