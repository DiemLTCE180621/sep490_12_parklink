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

    // 2. check: Customer phải có hợp đồng thuê thành công mới được đánh giá
    const hasContract = await reviewRepository.checkCustomerContract(customer_id, facility_id);
    if (!hasContract) {
      throw new Error('Bạn cần có hợp đồng thuê thành công tại bãi đỗ xe này để được viết đánh giá');
    }

    // 2.1 check: Mỗi khách hàng chỉ được đánh giá duy nhất 1 lần cho mỗi bãi xe
    const existingReview = await reviewRepository.getReviewByCustomerAndFacility(customer_id, facility_id);
    if (existingReview) {
      throw new Error('Bạn đã đánh giá bãi đỗ xe này rồi. Vui lòng chỉnh sửa đánh giá hiện tại nếu muốn thay đổi.');
    }

    // 3. AI kiểm duyệt nội dung (TỰ ĐỘNG TẠM ẨN NGAY NẾU ĐỘC HẠI để bảo vệ nền tảng 24/7)
    const moderation = await aiModerationService.moderateComment(comment);
    data.is_flagged = moderation.is_flagged;
    data.flagged_reason = moderation.flagged_reason;
    data.status = moderation.is_flagged ? 'HIDDEN' : 'VISIBLE';

    // 4. Lưu vào DB
    const newReview = await reviewRepository.createReview(data);

    // 5. Phát sự kiện Socket thời gian thực cho Admin & Provider tự động cập nhật
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
    // check: review có tồn tại không
    const existingReview = await reviewRepository.getReviewById(review_id);
    if (!existingReview) {
      throw new Error('Đánh giá không tồn tại');
    }

    if (existingReview.customer_id !== parseInt(customer_id)) {
      throw new Error('Bạn chỉ có quyền chỉnh sửa đánh giá của chính mình');
    }

    // Nếu người dùng sửa comment, kiểm duyệt lại nội dung mới
    if (data.comment !== undefined) {
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

  /**
   * Cập nhật trạng thái đánh giá (Chỉ dành cho Admin: Ẩn/Hiện, Bỏ cắm cờ)
   */
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
}

module.exports = new ReviewService();
