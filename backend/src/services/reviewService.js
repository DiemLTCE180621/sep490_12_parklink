const reviewRepository = require('../repositories/reviewRepository');
const aiModerationService = require('./aiModerationService');
const { getIO } = require('../config/socket');

class ReviewService {

  async getReviewsByFacilityId(facility_id) {
    return await reviewRepository.getReviewsByFacilityId(facility_id);
  }

  async getMyReview(customer_id, facility_id) {
    return await reviewRepository.getReviewByCustomerAndFacility(customer_id, facility_id);
  }

  async createReview(data) {
    const { customer_id, facility_id, rating, comment } = data;

    const hasContract = await reviewRepository.checkCustomerContract(customer_id, facility_id);
    if (!hasContract) {
      throw new Error('Bạn cần có hợp đồng thuê thành công tại bãi đỗ xe này để được viết đánh giá');
    }

    const existingReview = await reviewRepository.getReviewByCustomerAndFacility(customer_id, facility_id);
    if (existingReview) {
      throw new Error('Bạn đã đánh giá bãi đỗ xe này rồi. Vui lòng chỉnh sửa đánh giá hiện tại nếu muốn thay đổi.');
    }

    const moderation = await aiModerationService.moderateComment(comment);
    data.is_flagged = moderation.is_flagged;
    data.flagged_reason = moderation.flagged_reason;
    data.status = moderation.is_flagged ? 'HIDDEN' : 'VISIBLE';

    const newReview = await reviewRepository.createReview(data);

    try {
      const io = getIO();
      if (io) {
        io.emit('review_updated', { action: 'CREATED', review: newReview });
      }
    } catch (err) {
      console.warn('[Socket Review Emit Error]:', err.message);
    }

    return newReview;
  }

  async updateReview(review_id, customer_id, data) {
    const existingReview = await reviewRepository.getReviewById(review_id);
    if (!existingReview) {
      throw new Error('Đánh giá không tồn tại');
    }

    if (existingReview.customer_id !== parseInt(customer_id)) {
      throw new Error('Bạn chỉ có quyền chỉnh sửa đánh giá của chính mình');
    }

    const commentChanged = data.comment !== undefined
      && data.comment !== existingReview.comment;

    if (commentChanged) {
      const moderation = await aiModerationService.moderateComment(data.comment);
      data.is_flagged = moderation.is_flagged;
      data.flagged_reason = moderation.flagged_reason;
      data.status = moderation.is_flagged ? 'HIDDEN' : 'VISIBLE';
    }

    const updatedReview = await reviewRepository.updateReview(review_id, data);

    try {
      const io = getIO();
      if (io) {
        io.emit('review_updated', { action: 'UPDATED', review: updatedReview });
      }
    } catch (err) {
      console.warn('[Socket Review Emit Error]:', err.message);
    }

    return updatedReview;
  }

  async replyToReview(review_id, provider_id, reply) {
    const review = await reviewRepository.getReviewWithFacility(review_id);
    if (!review) {
      const error = new Error('Đánh giá không tồn tại');
      error.status = 404;
      throw error;
    }

    if (review.facility?.provider_id !== parseInt(provider_id)) {
      const error = new Error('Bạn không có quyền phản hồi đánh giá của bãi xe này');
      error.status = 403;
      throw error;
    }

    if (review.status === 'HIDDEN') {
      const error = new Error('Không thể phản hồi bài đánh giá đang bị ẩn');
      error.status = 400;
      throw error;
    }

    const updatedReview = await reviewRepository.replyReview(review_id, reply);

    try {
      const io = getIO();
      if (io) {
        io.emit('review_updated', { action: 'REPLIED', review: updatedReview });
      }
    } catch (err) {
      console.warn('[Socket Review Emit Error]:', err.message);
    }

    return updatedReview;
  }

  async deleteReview(review_id, customer_id) {
    const existingReview = await reviewRepository.getReviewById(review_id);
    if (!existingReview) {
      throw new Error('Đánh giá không tồn tại');
    }

    if (existingReview.customer_id !== parseInt(customer_id)) {
      throw new Error('Bạn chỉ có quyền xóa đánh giá của chính mình');
    }

    const deleted = await reviewRepository.deleteReview(review_id);

    try {
      const io = getIO();
      if (io) {
        io.emit('review_updated', { action: 'DELETED', review_id });
      }
    } catch (err) {
      console.warn('[Socket Review Emit Error]:', err.message);
    }

    return deleted;
  }

  async getAllReviewsAdmin() {
    return await reviewRepository.getAllReviewsAdmin();
  }

  async getProviderReviews(provider_id) {
    return await reviewRepository.getProviderReviews(provider_id);
  }

  async updateReviewStatus(review_id, updateData) {
    const existingReview = await reviewRepository.getReviewById(review_id);
    if (!existingReview) {
      throw new Error('Đánh giá không tồn tại');
    }

    if (updateData.status && !['VISIBLE', 'HIDDEN'].includes(updateData.status)) {
      throw new Error('Trạng thái không hợp lệ. Chỉ chấp nhận VISIBLE hoặc HIDDEN');
    }

    const updated = await reviewRepository.updateReviewStatus(review_id, updateData);

    try {
      const io = getIO();
      if (io) {
        io.emit('review_updated', { action: 'STATUS_CHANGED', review: updated });
      }
    } catch (err) {
      console.warn('[Socket Review Emit Error]:', err.message);
    }

    return updated;
  }

  /**
   * Admin Unhide review và gỡ cờ
   */
  async unhideReview(review_id) {
    const existingReview = await reviewRepository.getReviewById(review_id);
    if (!existingReview) {
      const error = new Error('Đánh giá không tồn tại');
      error.status = 404;
      throw error;
    }

    if (existingReview.status === 'VISIBLE' && !existingReview.is_flagged) {
      const error = new Error('Đánh giá này hiện đang hiển thị bình thường');
      error.status = 400;
      throw error;
    }

    const updated = await reviewRepository.unhideReview(review_id);

    try {
      const io = getIO();
      if (io) {
        io.emit('review_updated', { action: 'STATUS_CHANGED', review: updated });
      }
    } catch (err) {
      console.warn('[Socket Review Emit Error]:', err.message);
    }

    return updated;
  }
}

module.exports = new ReviewService();
