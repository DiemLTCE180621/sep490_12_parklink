import api from './api';

/**
 * Service giao tiếp API quản lý đánh giá của fe
 */
const reviewService = {

  async getReviewsByFacilityId(facility_id) {
    return await api.get(`/reviews/facility/${facility_id}`);
  },

  async getMyReview(facility_id) {
    return await api.get(`/reviews/my-review/${facility_id}`);
  },

  async createReview(data) {
    return await api.post('/reviews', data);
  },

  async updateReview(review_id, data) {
    return await api.put(`/reviews/${review_id}`, data);
  },

  async deleteReview(review_id) {
    return await api.delete(`/reviews/${review_id}`);
  },

  async getAllReviewsAdmin() {
    return await api.get('/reviews/admin');
  },

  /**
   * Admin: Ẩn/Hiện đánh giá hoặc gỡ cắm cờ
   */
  async updateReviewStatus(review_id, data) {
    return await api.patch(`/reviews/${review_id}/status`, data);
  },

  /**
   * Provider: Xem đánh giá các cơ sở thuộc quyền sở hữu của mình
   */
  async getProviderReviews() {
    return await api.get('/reviews/provider');
  }
};

export default reviewService;
