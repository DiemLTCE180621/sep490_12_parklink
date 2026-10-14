const prisma = require('../config/prisma');

/**
 * Tuân thủ nguyên tắc: Nơi DUY NHẤT giao tiếp trực tiếp với Prisma (raw SQL nếu cần, nhưng ưu tiên Prisma)
 */
class ReviewRepository {
  /**
   * Lấy danh sách đánh giá của một bãi đỗ xe cụ thể
   */
  async getReviewsByFacilityId(facility_id) {
    return await prisma.review.findMany({
      where: {
        facility_id: parseInt(facility_id),
        status: 'VISIBLE'
      },
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc' // Đánh giá mới nhất xếp lên đầu
      }
    });
  }

  /**
   * Lấy một review cụ thể theo ID (Dùng để kiểm tra quyền tác giả khi Edit/Delete)
   */
  async getReviewById(review_id) {
    return await prisma.review.findUnique({
      where: { id: parseInt(review_id) }
    });
  }

  /**
   * Kiểm tra xem Customer đã từng có bài đánh giá tại Facility này chưa
   */
  async getReviewByCustomerAndFacility(customer_id, facility_id) {
    return await prisma.review.findFirst({
      where: {
        customer_id: parseInt(customer_id),
        facility_id: parseInt(facility_id)
      }
    });
  }

  /**
   * Tạo đánh giá mới (bao gồm kết quả cắm cờ từ AI nếu có)
   */
  async createReview(data) {
    return await prisma.review.create({
      data: {
        customer_id: parseInt(data.customer_id),
        facility_id: parseInt(data.facility_id),
        rating: parseInt(data.rating),
        comment: data.comment,
        status: data.status ? data.status : (data.is_flagged ? 'HIDDEN' : 'VISIBLE'),
        is_flagged: data.is_flagged ?? false,
        flagged_reason: data.flagged_reason ?? null
      }
    });
  }

  /**
   * Chỉnh sửa đánh giá (update rating, comment, và cập nhật cắm cờ AI nếu có)
   */
  async updateReview(review_id, data) {
    const updateData = {};
    if (data.rating !== undefined) updateData.rating = parseInt(data.rating);
    if (data.comment !== undefined) updateData.comment = data.comment;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.is_flagged !== undefined) updateData.is_flagged = data.is_flagged;
    if (data.flagged_reason !== undefined) updateData.flagged_reason = data.flagged_reason;

    return await prisma.review.update({
      where: { id: parseInt(review_id) },
      data: updateData
    });
  }

  /**
   * Cập nhật trạng thái đánh giá (Dành riêng cho Admin: Ẩn/Hiện, Bỏ cờ)
   */
  async updateReviewStatus(review_id, data) {
    const updateData = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.is_flagged !== undefined) updateData.is_flagged = data.is_flagged;
    if (data.flagged_reason !== undefined) updateData.flagged_reason = data.flagged_reason;

    return await prisma.review.update({
      where: { id: parseInt(review_id) },
      data: updateData
    });
  }

  /**
   * Xóa đánh giá (Có thể xóa cứng hoặc đổi status sang 'DELETED')
   * Ở đây áp dụng xóa cứng theo chuẩn Prisma
   */
  async deleteReview(review_id) {
    return await prisma.review.delete({
      where: { id: parseInt(review_id) }
    });
  }

  /**
   * Hàm phụ trợ kiểm tra xem Customer đã có Hợp Đồng thuê thành công với Facility này chưa?
   * (Phục vụ cho luồng nghiệp vụ tạo Review)
   */
  async checkCustomerContract(customer_id, facility_id) {
    return await prisma.reservation_Request.findFirst({
      where: {
        customer_id: parseInt(customer_id),
        facility_id: parseInt(facility_id),
        confirmation_record: {
          isNot: null // Yêu cầu phải có hợp đồng (Confirmation Record)
        }
      },
      include: {
        confirmation_record: true
      }
    });
  }

  /**
   * Lấy toàn bộ đánh giá cho Admin
   */
  async getAllReviewsAdmin() {
    return await prisma.review.findMany({
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  /**
   * Lấy danh sách đánh giá các bãi xe thuộc quyền sở hữu của Provider
   */
  async getProviderReviews(provider_id) {
    return await prisma.review.findMany({
      where: {
        facility: {
          provider_id: parseInt(provider_id)
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }
}

module.exports = new ReviewRepository();
