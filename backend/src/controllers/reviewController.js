const reviewService = require('../services/reviewService');

class ReviewController {

  async getReviewsByFacilityId(req, res) {
    try {
      const { facility_id } = req.params;
      const reviews = await reviewService.getReviewsByFacilityId(facility_id);

      return res.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async createReview(req, res) {
    try {
      const customer_id = req.user.userId;
      const { facility_id, rating, comment } = req.body;

      const newReview = await reviewService.createReview({
        customer_id,
        facility_id,
        rating,
        comment
      });

      return res.status(201).json({
        success: true,
        message: 'Đánh giá thành công',
        data: newReview
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateReview(req, res) {
    try {
      const customer_id = req.user.userId;
      const { id: review_id } = req.params;
      const { rating, comment } = req.body;

      const updatedReview = await reviewService.updateReview(review_id, customer_id, { rating, comment });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật đánh giá thành công',
        data: updatedReview
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteReview(req, res) {
    try {
      const customer_id = req.user.userId;
      const { id: review_id } = req.params;

      await reviewService.deleteReview(review_id, customer_id);

      return res.status(200).json({
        success: true,
        message: 'Xóa đánh giá thành công'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ReviewController();
