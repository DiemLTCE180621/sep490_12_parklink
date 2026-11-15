export const validateSubmitComplaint = (data) => {
  const { title, description } = data;
  const errors = {};

  if (!title || title.trim().length < 10) {
    errors.title = 'Tiêu đề khiếu nại phải có ít nhất 10 ký tự';
  }

  if (!description || description.trim().length < 20) {
    errors.description = 'Nội dung chi tiết phải có ít nhất 20 ký tự để Admin hiểu rõ vấn đề';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateReplyComplaint = (data) => {
  const { response, status } = data || {};
  const errors = {};

  if (!response || !response.trim()) {
    errors.response = 'Vui lòng nhập nội dung phản hồi khiếu nại.';
  } else if (response.trim().length < 5) {
    errors.response = 'Nội dung phản hồi phải có ít nhất 5 ký tự.';
  } else if (response.trim().length > 3000) {
    errors.response = 'Nội dung phản hồi không được vượt quá 3000 ký tự.';
  }

  const validStatuses = ['OPEN', 'PENDING', 'PENDING_ADMIN', 'WAITING_PROVIDER', 'PROVIDER_REPLIED', 'PROCESSING', 'ESCALATED', 'RESOLVED', 'REJECTED', 'CLOSED'];
  if (status && !validStatuses.includes(status)) {
    errors.status = 'Trạng thái khiếu nại không hợp lệ.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Xác thực dữ liệu cập nhật trạng thái khiếu nại của Admin
 */
export const validateUpdateComplaintStatus = (data) => {
  const { status, note } = data || {};
  const errors = {};

  const validStatuses = ['PENDING_ADMIN', 'WAITING_PROVIDER', 'PROVIDER_REPLIED', 'PENDING', 'PROCESSING', 'ESCALATED', 'RESOLVED', 'REJECTED', 'CLOSED'];
  if (!status || !validStatuses.includes(status)) {
    errors.status = 'Vui lòng chọn trạng thái khiếu nại hợp lệ.';
  }

  if (note && typeof note === 'string' && note.trim().length > 2000) {
    errors.note = 'Ghi chú phán quyết không được vượt quá 2000 ký tự.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

