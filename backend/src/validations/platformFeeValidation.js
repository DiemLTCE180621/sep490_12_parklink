const { body, validationResult } = require('express-validator');

/**
 * Validation middleware cho tạo mới gói biểu phí nền tảng
 */
const validateCreatePlatformFee = [
  body('name')
    .trim()
    .notEmpty().withMessage('Tên gói biểu phí không được để trống')
    .isLength({ min: 3, max: 100 }).withMessage('Tên gói biểu phí phải từ 3 đến 100 ký tự'),

  body('min_slots')
    .notEmpty().withMessage('Số lượng slot tối thiểu (min_slots) không được để trống')
    .isInt({ min: 1, max: 15 }).withMessage('Mô hình hộ gia đình chỉ hỗ trợ từ 1 đến 15 chỗ đỗ (min_slots phải từ 1 đến 15)'),

  body('max_slots')
    .notEmpty().withMessage('Số lượng slot tối đa (max_slots) không được để trống')
    .custom((value, { req }) => {
      const maxSlots = parseInt(value, 10);
      const minSlots = parseInt(req.body.min_slots, 10);
      if (isNaN(maxSlots) || maxSlots < 1 || maxSlots > 15) {
        throw new Error('Mô hình hộ gia đình chỉ hỗ trợ tối đa 15 chỗ đỗ');
      }
      if (!isNaN(minSlots) && maxSlots < minSlots) {
        throw new Error('Số lượng slot tối đa (max_slots) phải lớn hơn hoặc bằng slot tối thiểu (min_slots)');
      }
      return true;
    }),

  body('fee_amount')
    .notEmpty().withMessage('Mức phí nền tảng (fee_amount) không được để trống')
    .isFloat({ min: 0 }).withMessage('Mức phí phải là số dương lớn hơn hoặc bằng 0'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Mô tả không được vượt quá 500 ký tự'),

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

/**
 * Validation middleware cho cập nhật gói biểu phí nền tảng
 */
const validateUpdatePlatformFee = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Tên gói biểu phí không được để trống')
    .isLength({ min: 3, max: 100 }).withMessage('Tên gói biểu phí phải từ 3 đến 100 ký tự'),

  body('min_slots')
    .optional()
    .isInt({ min: 1, max: 15 }).withMessage('Mô hình hộ gia đình chỉ hỗ trợ từ 1 đến 15 chỗ đỗ (min_slots phải từ 1 đến 15)'),

  body('max_slots')
    .optional({ nullable: true })
    .custom((value, { req }) => {
      if (value === null || value === undefined || value === '') return true;
      const maxSlots = parseInt(value, 10);
      if (isNaN(maxSlots) || maxSlots < 1 || maxSlots > 15) {
        throw new Error('Mô hình hộ gia đình chỉ hỗ trợ tối đa 15 chỗ đỗ');
      }
      if (req.body.min_slots !== undefined) {
        const minSlots = parseInt(req.body.min_slots, 10);
        if (!isNaN(minSlots) && maxSlots < minSlots) {
          throw new Error('Số lượng slot tối đa phải lớn hơn hoặc bằng slot tối thiểu');
        }
      }
      return true;
    }),

  body('fee_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Mức phí phải là số dương lớn hơn hoặc bằng 0'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Mô tả không được vượt quá 500 ký tự'),

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
  validateCreatePlatformFee,
  validateUpdatePlatformFee
};
