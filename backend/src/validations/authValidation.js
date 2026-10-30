/**
 * Middleware validation kiểm tra tính hợp lệ của dữ liệu đầu vào cho Auth API
 */

const {
  cleanText,
  isValidName,
  isValidPhone,
  isValidEmail,
  isValidFacilityName,
  isValidPassword
} = require('../utils/validators');

const validateRegisterCustomer = (req, res, next) => {
  const { email, full_name, phone_number } = req.body;
  const errors = [];

  const cleanedName = cleanText(full_name);
  const cleanedPhone = (phone_number || '').trim();
  const cleanedEmail = (email || '').trim();

  if (!isValidName(cleanedName)) {
    errors.push('Họ và tên chỉ được chứa chữ cái, tối thiểu 2 ký tự và không chứa số hay ký tự đặc biệt.');
  }

  if (!isValidEmail(cleanedEmail)) {
    errors.push('Email không đúng định dạng (Ví dụ: user@example.com).');
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

  next();
};

const validateRegisterProvider = (req, res, next) => {
  const { email, full_name, phone_number, facility_name, capacity, price_per_month } = req.body;
  const errors = [];

  const cleanedName = cleanText(full_name);
  const cleanedPhone = (phone_number || '').trim();
  const cleanedEmail = (email || '').trim();
  const cleanedFacilityName = cleanText(facility_name);

  if (!isValidName(cleanedName)) {
    errors.push('Họ và tên người đại diện chỉ được chứa chữ cái, tối thiểu 2 ký tự và không chứa số hay ký tự đặc biệt.');
  }

  if (!isValidEmail(cleanedEmail)) {
    errors.push('Email không đúng định dạng (Ví dụ: provider@example.com).');
  }

  if (!isValidPhone(cleanedPhone)) {
    errors.push('Số điện thoại liên hệ phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0987654321).');
  }

  if (!isValidFacilityName(cleanedFacilityName)) {
    errors.push('Tên cơ sở bãi đỗ xe phải từ 3 ký tự trở lên, chỉ gồm chữ cái, số và khoảng trắng.');
  }

  if (!capacity || isNaN(capacity) || Number(capacity) <= 0) {
    errors.push('Sức chứa bãi đỗ xe phải là số nguyên lớn hơn 0.');
  }

  if (!price_per_month || isNaN(price_per_month) || Number(price_per_month) <= 0) {
    errors.push('Giá thuê theo tháng phải lớn hơn 0 VNĐ.');
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
  req.body.facility_name = cleanedFacilityName;

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  const cleanedEmail = (email || '').trim();

  if (!isValidEmail(cleanedEmail)) {
    errors.push('Vui lòng nhập địa chỉ email hợp lệ.');
  }
  if (!password) {
    errors.push('Vui lòng nhập mật khẩu.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: errors[0],
      errors
    });
  }

  req.body.email = cleanedEmail;
  next();
};

const validateChangePassword = (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const errors = [];

  if (!isValidPassword(newPassword)) {
    errors.push('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ cái viết hoa, 1 chữ cái viết thường và 1 chữ số.');
  }

  if (oldPassword && newPassword && oldPassword === newPassword) {
    errors.push('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
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

const validateForgotPasswordRequest = (req, res, next) => {
  const { email } = req.body;
  const errors = [];
  const cleanedEmail = (email || '').trim();

  if (!isValidEmail(cleanedEmail)) {
    errors.push('Vui lòng nhập địa chỉ email hợp lệ.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: errors[0],
      errors
    });
  }

  req.body.email = cleanedEmail;
  next();
};

const validateVerifyResetPassword = (req, res, next) => {
  const { email, otpCode, newPassword } = req.body;
  const errors = [];
  const cleanedEmail = (email || '').trim();
  const cleanedOtp = (otpCode || '').trim();

  if (!isValidEmail(cleanedEmail)) {
    errors.push('Vui lòng nhập địa chỉ email hợp lệ.');
  }
  if (!cleanedOtp || cleanedOtp.length !== 6 || isNaN(cleanedOtp)) {
    errors.push('Mã OTP phải bao gồm đúng 6 chữ số.');
  }
  if (!isValidPassword(newPassword)) {
    errors.push('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ cái viết hoa, 1 chữ cái viết thường và 1 chữ số.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: errors[0],
      errors
    });
  }

  req.body.email = cleanedEmail;
  req.body.otpCode = cleanedOtp;
  next();
};

const validateUpdateProfile = (req, res, next) => {
  const { full_name, phone_number } = req.body;
  const errors = [];

  const cleanedName = cleanText(full_name);
  const cleanedPhone = (phone_number || '').trim();

  if (!isValidName(cleanedName)) {
    errors.push('Họ và tên chỉ được chứa chữ cái, tối thiểu 2 ký tự và không chứa số hay ký tự đặc biệt.');
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

  next();
};

module.exports = {
  validateRegisterCustomer,
  validateRegisterProvider,
  validateLogin,
  validateChangePassword,
  validateForgotPasswordRequest,
  validateVerifyResetPassword,
  validateUpdateProfile
};
