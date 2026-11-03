export const validateReviewForm = (rating, comment) => {
  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    return 'Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao).';
  }

  if (!comment || !comment.trim()) {
    return 'Vui lòng nhập nội dung đánh giá.';
  }

  return null;
};

export const validateReplyForm = (reply) => {
  if (!reply || !reply.trim()) {
    return 'Vui lòng nhập nội dung phản hồi.';
  }

  if (reply.trim().length > 1000) {
    return 'Nội dung phản hồi không được vượt quá 1000 ký tự.';
  }

  return null;
};
