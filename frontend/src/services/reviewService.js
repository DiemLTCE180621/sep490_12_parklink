import api from './api';

/**
 * Service giao tiếp API quản lý đánh giá của fe
 */
const reviewService = {
  /**
   * M5-UC69: Lấy danh sách đánh giá của 1 bãi đỗ xe
   */
  async getReviewsByFacilityId(facility_id) {
    return await api.get(`/reviews/facility/${facility_id}`);
  },

  /**
   * M5-UC70: Tạo đánh giá mới (Yêu cầu tài khoản Customer đã thuê bãi này)
   */
  async createReview(data) {
    return await api.post('/reviews', data);
  },

  /**
   * M5-UC71: Chỉnh sửa đánh giá của chính mình
   */
  async updateReview(review_id, data) {
    return await api.put(`/reviews/${review_id}`, data);
  },

  /**
   * M5-UC72: Xóa đánh giá của chính mình
   */
  async deleteReview(review_id) {
    return await api.delete(`/reviews/${review_id}`);
  }
};

export default reviewService;
