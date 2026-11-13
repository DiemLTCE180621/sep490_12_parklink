const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

const validateUpdatePolicy = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID chính sách phải là số nguyên dương hợp lệ!'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tiêu đề chính sách không được để trống!'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Nội dung chính sách không được để trống!'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái kích hoạt (is_active) phải là kiểu boolean!'),
  body('notifyUsers')
    .optional()
    .isBoolean()
    .withMessage('Tùy chọn gửi thông báo (notifyUsers) phải là kiểu boolean!'),
  handleValidationErrors
];

module.exports = {
  validateUpdatePolicy
};
