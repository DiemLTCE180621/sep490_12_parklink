const validateCreateReview = (req, res, next) => {
  const { facility_id, rating } = req.body;
  const errors = [];

  if (!facility_id) {
    errors.push('Facility ID là bắt buộc.');
  }

  if (rating === undefined || rating === null) {
    errors.push('Rating là bắt buộc.');
  } else if (isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
    errors.push('Rating phải là một số nằm trong khoảng từ 1 đến 5.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu đánh giá không hợp lệ',
      errors
    });
  }

  req.body.rating = Number(rating);
  next();
};

const validateUpdateReview = (req, res, next) => {
  const { rating } = req.body;
  const errors = [];

  if (rating !== undefined && rating !== null) {
    if (isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
      errors.push('Rating phải là một số nằm trong khoảng từ 1 đến 5.');
    } else {
      req.body.rating = Number(rating);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu cập nhật đánh giá không hợp lệ',
      errors
    });
  }

  next();
};

const validateReplyReview = (req, res, next) => {
  const reply = req.body.reply || req.body.provider_reply;
  const errors = [];

  if (!reply || !reply.trim()) {
    errors.push('Nội dung phản hồi không được để trống.');
  } else if (reply.trim().length > 1000) {
    errors.push('Nội dung phản hồi không được vượt quá 1000 ký tự.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu phản hồi không hợp lệ',
      errors
    });
  }

  req.body.reply = reply.trim();
  next();
};

module.exports = {
  validateCreateReview,
  validateUpdateReview,
  validateReplyReview
};
