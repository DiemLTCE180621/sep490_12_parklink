const { body, validationResult } = require('express-validator');

/**
 * Kiểm tra dữ liệu tạo loại phương tiện
 */
const validateCreateVehicleType = [
  body('type_code')
    .trim()
    .notEmpty().withMessage('Mã loại phương tiện (type_code) không được để trống')
    .isLength({ min: 2, max: 50 }).withMessage('Mã loại phương tiện phải từ 2 đến 50 ký tự')
    .matches(/^[A-Za-z0-9_]+$/).withMessage('Mã loại phương tiện chỉ được chứa chữ cái, số và dấu gạch dưới (_)'),

  body('name')
    .trim()
    .notEmpty().withMessage('Tên loại phương tiện không được để trống')
    .isLength({ min: 2, max: 100 }).withMessage('Tên loại phương tiện phải từ 2 đến 100 ký tự'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Mô tả loại phương tiện không được vượt quá 500 ký tự'),

  body('is_active')
    .optional()
    .isBoolean().withMessage('Trạng thái hoạt động (is_active) phải là giá trị boolean (true/false)'),

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
 * Kiểm tra dữ liệu cập nhật loại phương tiện
 */
const validateUpdateVehicleType = [
  body('type_code')
    .optional()
    .trim()
    .notEmpty().withMessage('Mã loại phương tiện không được để chuỗi rỗng')
    .isLength({ min: 2, max: 50 }).withMessage('Mã loại phương tiện phải từ 2 đến 50 ký tự')
    .matches(/^[A-Za-z0-9_]+$/).withMessage('Mã loại phương tiện chỉ được chứa chữ cái, số và dấu gạch dưới (_)'),

  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Tên loại phương tiện không được để chuỗi rỗng')
    .isLength({ min: 2, max: 100 }).withMessage('Tên loại phương tiện phải từ 2 đến 100 ký tự'),

  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Mô tả loại phương tiện không được vượt quá 500 ký tự'),

  body('is_active')
    .optional()
    .isBoolean().withMessage('Trạng thái hoạt động (is_active) phải là giá trị boolean (true/false)'),

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
  validateCreateVehicleType,
  validateUpdateVehicleType
};

