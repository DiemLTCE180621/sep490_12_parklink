const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return res.status(400).json({
      status: 'fail',
      message: errorMessages[0],
      errors: errorMessages
    });
  }
  next();
};

const VALID_TARGET_ROLES = ['ALL', 'CUSTOMER', 'PROVIDER', 'ADMIN'];

const validateBroadcastPush = [
  body('title')
    .isString()
    .withMessage('Tiêu đề thông báo phải là chuỗi ký tự hợp lệ!')
    .trim()
    .notEmpty()
    .withMessage('Tiêu đề thông báo không được để trống!')
    .isLength({ max: 255 })
    .withMessage('Tiêu đề thông báo không được vượt quá 255 ký tự!'),
  body('content')
    .isString()
    .withMessage('Nội dung thông báo phải là chuỗi ký tự hợp lệ!')
    .trim()
    .notEmpty()
    .withMessage('Nội dung thông báo không được để trống!')
    .isLength({ max: 2000 })
    .withMessage('Nội dung thông báo không được vượt quá 2000 ký tự!'),
  body('targetRole')
    .optional()
    .isString()
    .withMessage('Phạm vi đối tượng nhận không hợp lệ!')
    .isIn(VALID_TARGET_ROLES)
    .withMessage('Phạm vi đối tượng nhận chỉ chấp nhận ALL, CUSTOMER, PROVIDER hoặc ADMIN!'),
  body('category')
    .optional()
    .isString()
    .withMessage('Loại thông báo phải là chuỗi ký tự!')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Loại thông báo không được vượt quá 100 ký tự!'),
  body('priority')
    .optional()
    .isString()
    .withMessage('Mức độ ưu tiên phải là chuỗi ký tự!')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Mức độ ưu tiên không được vượt quá 100 ký tự!'),
  body('saveToDb')
    .optional()
    .isBoolean()
    .withMessage('Tùy chọn saveToDb phải là kiểu boolean!'),
  body('showToast')
    .optional()
    .isBoolean()
    .withMessage('Tùy chọn showToast phải là kiểu boolean!'),
  handleValidationErrors
];

const validateBroadcastEmail = [
  body('subject')
    .isString()
    .withMessage('Tiêu đề Email phải là chuỗi ký tự hợp lệ!')
    .trim()
    .notEmpty()
    .withMessage('Tiêu đề Email không được để trống!')
    .isLength({ max: 200 })
    .withMessage('Tiêu đề Email không được vượt quá 200 ký tự!'),
  body('htmlContent')
    .isString()
    .withMessage('Nội dung Email phải là chuỗi ký tự hợp lệ!')
    .trim()
    .notEmpty()
    .withMessage('Nội dung Email không được để trống!')
    .isLength({ max: 10000 })
    .withMessage('Nội dung Email không được vượt quá 10000 ký tự!'),
  body('recipientScope')
    .optional()
    .isString()
    .withMessage('Phạm vi người nhận Email không hợp lệ!')
    .isIn(VALID_TARGET_ROLES)
    .withMessage('Phạm vi người nhận Email chỉ chấp nhận ALL, CUSTOMER, PROVIDER hoặc ADMIN!'),
  body('emailCategory')
    .optional()
    .isString()
    .withMessage('Phân loại Email phải là chuỗi ký tự!')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Phân loại Email không được vượt quá 100 ký tự!'),
  body('testEmail')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Email thử nghiệm phải là chuỗi ký tự!')
    .trim()
    .isEmail()
    .withMessage('Địa chỉ email thử nghiệm không đúng định dạng!'),
  handleValidationErrors
];

const validateGetMyNotifications = [
  query('isRead')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('Tham số isRead chỉ chấp nhận true hoặc false!'),
  query('limit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('Tham số limit phải là số nguyên từ 1 đến 100!'),
  query('offset')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Tham số offset phải là số nguyên không âm!'),
  handleValidationErrors
];

const validateMarkAsRead = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID thông báo phải là số nguyên dương hợp lệ!'),
  handleValidationErrors
];

module.exports = {
  validateBroadcastPush,
  validateBroadcastEmail,
  validateGetMyNotifications,
  validateMarkAsRead
};
