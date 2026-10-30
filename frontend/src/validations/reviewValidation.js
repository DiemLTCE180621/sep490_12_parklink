/**
 * Chứa logic kiểm tra tính hợp lệ của dữ liệu Review ở phía Frontend
 */

export const validateReviewForm = (rating, comment) => {
  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    return 'Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao).';
  }

  if (!comment || !comment.trim()) {
    return 'Vui lòng nhập nội dung đánh giá.';
  }

  return null; // Không có lỗi
};
