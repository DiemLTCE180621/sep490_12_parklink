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
