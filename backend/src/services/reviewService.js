const reviewRepository = require('../repositories/reviewRepository');
const aiModerationService = require('./aiModerationService');
const { getIO } = require('../config/socket');

class ReviewService {

  _emitReviewUpdate(action, payload) {
    try {
      const io = getIO();
      if (io) {
        io.emit('review_updated', { action, ...payload });
      }
    } catch (err) {
      console.warn('[Socket Review Emit Error]:', err.message);
    }
  }

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
      const error = new Error('Bạn cần có hợp đồng thuê thành công tại bãi đỗ xe này để được viết đánh giá');
      error.status = 403;
      throw error;
    }

    const existingReview = await reviewRepository.getReviewByCustomerAndFacility(customer_id, facility_id);
    if (existingReview) {
      const error = new Error('Bạn đã đánh giá bãi đỗ xe này rồi. Vui lòng chỉnh sửa đánh giá hiện tại nếu muốn thay đổi.');
      error.status = 409;
      throw error;
    }

    const moderation = await aiModerationService.moderateComment(comment);
    const reviewPayload = {
      ...data,
      is_flagged: moderation.is_flagged,
      flagged_reason: moderation.flagged_reason,
      status: moderation.is_flagged ? 'HIDDEN' : 'VISIBLE'
    };

    const newReview = await reviewRepository.createReview(reviewPayload);
    this._emitReviewUpdate('CREATED', { review: newReview });

    return newReview;
  }

  async updateReview(review_id, customer_id, data) {
    const existingReview = await reviewRepository.getReviewById(review_id);
    if (!existingReview) {
      const error = new Error('Đánh giá không tồn tại');
      error.status = 404;
      throw error;
    }

    if (existingReview.customer_id !== parseInt(customer_id)) {
      const error = new Error('Bạn chỉ có quyền chỉnh sửa đánh giá của chính mình');
      error.status = 403;
      throw error;
    }

    const updatePayload = { ...data };
    const commentChanged = data.comment !== undefined
      && data.comment !== existingReview.comment;

    if (commentChanged) {
      const moderation = await aiModerationService.moderateComment(data.comment);
      updatePayload.is_flagged = moderation.is_flagged;
      updatePayload.flagged_reason = moderation.flagged_reason;
      updatePayload.status = moderation.is_flagged ? 'HIDDEN' : 'VISIBLE';
    }

    const updatedReview = await reviewRepository.updateReview(review_id, updatePayload);
    this._emitReviewUpdate('UPDATED', { review: updatedReview });

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
    this._emitReviewUpdate('REPLIED', { review: updatedReview });

    return updatedReview;
  }

  async deleteReview(review_id, customer_id) {
    const existingReview = await reviewRepository.getReviewById(review_id);
    if (!existingReview) {
      const error = new Error('Đánh giá không tồn tại');
      error.status = 404;
      throw error;
    }

    if (existingReview.customer_id !== parseInt(customer_id)) {
      const error = new Error('Bạn chỉ có quyền xóa đánh giá của chính mình');
      error.status = 403;
      throw error;
    }

    const deleted = await reviewRepository.deleteReview(review_id);
    this._emitReviewUpdate('DELETED', { review_id });

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
      const error = new Error('Đánh giá không tồn tại');
      error.status = 404;
      throw error;
    }

    if (updateData.status && !['VISIBLE', 'HIDDEN'].includes(updateData.status)) {
      const error = new Error('Trạng thái không hợp lệ. Chỉ chấp nhận VISIBLE hoặc HIDDEN');
      error.status = 400;
      throw error;
    }

    const updated = await reviewRepository.updateReviewStatus(review_id, updateData);
    this._emitReviewUpdate('STATUS_CHANGED', { review: updated });

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
    this._emitReviewUpdate('STATUS_CHANGED', { review: updated });

    return updated;
  }
}

module.exports = new ReviewService();
