/**
 * Chứa logic kiểm tra tính hợp lệ của dữ liệu Review ở phía Frontend
 */

export const validateReviewForm = (rating, comment) => {
  if (!comment || !comment.trim()) {
    return 'Vui lòng nhập nội dung đánh giá.';
  }
  
  if (rating < 1 || rating > 5) {
    return 'Đánh giá phải từ 1 đến 5 sao.';
  }

  return null; // Không có lỗi
};
