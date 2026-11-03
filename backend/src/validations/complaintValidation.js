
const validateCreateComplaint = (req, res, next) => {
  const { reservation_id, title, description, image_urls } = req.body;
  const errors = [];

  // check mã yêu cầu thuê (reservation_id)
  if (reservation_id === undefined || reservation_id === null || reservation_id === '') {
    errors.push('Mã yêu cầu thuê không được để trống');
  } else if (isNaN(parseInt(reservation_id, 10)) || parseInt(reservation_id, 10) < 1) {
    errors.push('Mã yêu cầu thuê không hợp lệ');
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Tiêu đề khiếu nại không được để trống');
  } else if (title.trim().length < 5 || title.trim().length > 200) {
    errors.push('Tiêu đề phải từ 5 đến 200 ký tự');
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Nội dung khiếu nại không được để trống');
  } else if (description.trim().length < 10 || description.trim().length > 2000) {
    errors.push('Nội dung khiếu nại phải từ 10 đến 2000 ký tự');
  }

  if (image_urls !== undefined && image_urls !== null) {
    if (!Array.isArray(image_urls)) {
      errors.push('Danh sách ảnh đính kèm phải là mảng (Array)');
    } else if (image_urls.length > 5) {
      errors.push('Chỉ được đính kèm tối đa 5 ảnh');
    } else {
      const isValidUrls = image_urls.every(
        (url) => typeof url === 'string' && url.trim().length > 0
      );
      if (!isValidUrls) {
        errors.push('Đường dẫn ảnh đính kèm không hợp lệ');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu đầu vào không hợp lệ',
      errors
    });
  }

  // Làm sạch dữ liệu sau khi xác thực
  req.body.reservation_id = parseInt(reservation_id, 10);
  req.body.title = title.trim();
  req.body.description = description.trim();
  req.body.image_urls = Array.isArray(image_urls) ? image_urls : [];

  next();
};

// (Admin & Parking Provider)
const validateReplyComplaint = (req, res, next) => {
  const { id } = req.params;
  const text = req.body.response || req.body.reply || req.body.admin_response;
  const status = req.body.status;
  const errors = [];

  if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
    errors.push('Mã khiếu nại không hợp lệ');
  }

  if (!text || typeof text !== 'string' || !text.trim()) {
    errors.push('Nội dung phản hồi không được để trống');
  } else if (text.trim().length < 2) {
    errors.push('Nội dung phản hồi phải có ít nhất 2 ký tự');
  } else if (text.trim().length > 3000) {
    errors.push('Nội dung phản hồi không được vượt quá 3000 ký tự');
  }

  const validStatuses = ['PENDING', 'PROCESSING', 'ESCALATED', 'RESOLVED', 'CLOSED', 'OPEN'];
  if (status && !validStatuses.includes(status.toUpperCase().trim())) {
    errors.push('Trạng thái không hợp lệ. Cho phép: PENDING, PROCESSING, ESCALATED, RESOLVED, CLOSED');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu phản hồi không hợp lệ',
      errors
    });
  }

  req.body.response = text.trim();
  if (status) {
    req.body.status = status.toUpperCase().trim();
  }
  next();
};

// (Admin & Provider)
const validateUpdateComplaintStatus = (req, res, next) => {
  const { id } = req.params;
  const { status, note, admin_note, reason } = req.body;
  const errors = [];

  if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
    errors.push('Mã khiếu nại không hợp lệ');
  }

  const validStatuses = ['PENDING', 'PROCESSING', 'ESCALATED', 'RESOLVED', 'CLOSED', 'OPEN'];
  if (!status || typeof status !== 'string' || !status.trim()) {
    errors.push('Trạng thái khiếu nại là bắt buộc');
  } else if (!validStatuses.includes(status.toUpperCase().trim())) {
    errors.push('Trạng thái không hợp lệ. Cho phép: PENDING, PROCESSING, ESCALATED, RESOLVED, CLOSED');
  }

  const noteText = note || admin_note || reason;
  if (noteText && typeof noteText === 'string' && noteText.trim().length > 2000) {
    errors.push('Ghi chú cập nhật không được vượt quá 2000 ký tự');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu cập nhật trạng thái không hợp lệ',
      errors
    });
  }

  req.body.status = status.toUpperCase().trim();
  if (noteText && typeof noteText === 'string') {
    req.body.note = noteText.trim();
  }
  next();
};

const validateEscalateComplaint = (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const errors = [];

  if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
    errors.push('Mã khiếu nại không hợp lệ');
  }

  if (reason && typeof reason === 'string' && reason.trim().length > 1000) {
    errors.push('Lý do chuyển cấp không được vượt quá 1000 ký tự');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Dữ liệu chuyển cấp không hợp lệ',
      errors
    });
  }

  if (reason && typeof reason === 'string') {
    req.body.reason = reason.trim();
  }
  next();
};

module.exports = {
  validateCreateComplaint,
  validateReplyComplaint,
  validateUpdateComplaintStatus,
  validateEscalateComplaint
};