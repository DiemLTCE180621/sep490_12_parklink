const reviewRepository = require('../repositories/reviewRepository');

class ReviewService {

  async getReviewsByFacilityId(facility_id) {
    return await reviewRepository.getReviewsByFacilityId(facility_id);
  }

  async createReview(data) {
    const { customer_id, facility_id, rating, comment } = data;

    // 2. check: Customer phải có hợp đồng thuê thành công mới được đánh giá
    const hasContract = await reviewRepository.checkCustomerContract(customer_id, facility_id);
    if (!hasContract) {
      throw new Error('Bạn cần có hợp đồng thuê thành công tại bãi đỗ xe này để được viết đánh giá');
    }

    //  lưu vào DB
    return await reviewRepository.createReview(data);
  }

  async updateReview(review_id, customer_id, data) {
    // check: reviewcó tồn tại không
    const existingReview = await reviewRepository.getReviewById(review_id);
    if (!existingReview) {
      throw new Error('Đánh giá không tồn tại');
    }

    if (existingReview.customer_id !== parseInt(customer_id)) {
      throw new Error('Bạn chỉ có quyền chỉnh sửa đánh giá của chính mình');
    }

    return await reviewRepository.updateReview(review_id, data);
  }

  async deleteReview(review_id, customer_id) {
    const existingReview = await reviewRepository.getReviewById(review_id);
    if (!existingReview) {
      throw new Error('Đánh giá không tồn tại');
    }

    if (existingReview.customer_id !== parseInt(customer_id)) {
      throw new Error('Bạn chỉ có quyền xóa đánh giá của chính mình');
    }

    return await reviewRepository.deleteReview(review_id);
  }
}

module.exports = new ReviewService();
