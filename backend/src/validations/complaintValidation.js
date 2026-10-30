const { body, validationResult } = require('express-validator');

const validateCreateComplaint = [
  body('reservation_id')
    .notEmpty().withMessage('Mã yêu cầu thuê không được để trống')
    .isInt({ min: 1 }).withMessage('Mã yêu cầu thuê không hợp lệ'),
  
  body('title')
    .trim()
    .notEmpty().withMessage('Tiêu đề khiếu nại không được để trống')
    .isLength({ min: 10, max: 200 }).withMessage('Tiêu đề phải từ 10 đến 200 ký tự'),

  body('description')
    .trim()
    .notEmpty().withMessage('Nội dung khiếu nại không được để trống')
    .isLength({ min: 20, max: 2000 }).withMessage('Nội dung phải từ 20 đến 2000 ký tự'),

  body('image_urls')
    .optional()
    .isArray({ max: 5 }).withMessage('Chỉ được đính kèm tối đa 5 ảnh')
    .custom((urls) => urls.every((url) => typeof url === 'string' && /^https:\/\//i.test(url)))
    .withMessage('Đường dẫn ảnh không hợp lệ'),

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
  validateCreateComplaint
};
