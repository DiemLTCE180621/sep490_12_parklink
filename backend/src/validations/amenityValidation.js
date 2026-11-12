const { body, validationResult } = require('express-validator');

const validateCreateAmenity = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tên tiện ích không được để trống')
    .isLength({ min: 2, max: 100 }).withMessage('Tên tiện ích phải từ 2 đến 100 ký tự'),

  body('icon')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Tên biểu tượng (icon) không được vượt quá 100 ký tự'),

  body('type')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Loại/nhóm tiện ích (type) không được vượt quá 50 ký tự'),

  body('is_active')
    .optional()
    .isBoolean().withMessage('Trạng thái hiển thị (is_active) phải là boolean (true/false)'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];

const validateUpdateAmenity = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Tên tiện ích không được để chuỗi rỗng')
    .isLength({ min: 2, max: 100 }).withMessage('Tên tiện ích phải từ 2 đến 100 ký tự'),

  body('icon')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Tên biểu tượng (icon) không được vượt quá 100 ký tự'),

  body('type')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Loại/nhóm tiện ích (type) không được vượt quá 50 ký tự'),

  body('is_active')
    .optional()
    .isBoolean().withMessage('Trạng thái hiển thị (is_active) phải là boolean (true/false)'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];

module.exports = {
  validateCreateAmenity,
  validateUpdateAmenity
};
