import api from './api';

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

  async updateReviewStatus(review_id, data) {
    return await api.patch(`/reviews/${review_id}/status`, data);
  },

  async unhideReview(review_id) {
    return await api.patch(`/reviews/${review_id}/unhide`);
  },

  async getProviderReviews() {
    return await api.get('/reviews/provider');
  },

  async replyToReview(review_id, reply) {
    return await api.post(`/reviews/${review_id}/reply`, { reply });
  }
};

export default reviewService;
