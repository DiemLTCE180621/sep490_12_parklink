const prisma = require('../config/prisma');

/**
 * Lớp Repository quản lý thao tác với Database cho bảng Review
 * Tuân thủ nguyên tắc: Nơi DUY NHẤT giao tiếp trực tiếp với Prisma (raw SQL nếu cần, nhưng ưu tiên Prisma)
 */
class ReviewRepository {
  /**
   * M5-UC69: View facility reviews
   * Lấy danh sách đánh giá của một bãi đỗ xe cụ thể
   */
  async getReviewsByFacilityId(facility_id) {
    // Trả về kèm theo thông tin của người review (full_name) để hiện lên FE
    return await prisma.review.findMany({
      where: { 
        facility_id: parseInt(facility_id),
        status: 'VISIBLE' // Chỉ lấy các review hợp lệ hiển thị
      },
      include: {
        customer: {
          select: {
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
   * M5-UC70: Write facility rating & review
   * Tạo đánh giá mới
   */
  async createReview(data) {
    return await prisma.review.create({
      data: {
        customer_id: parseInt(data.customer_id),
        facility_id: parseInt(data.facility_id),
        rating: parseInt(data.rating),
        comment: data.comment,
        status: 'VISIBLE'
      }
    });
  }

  /**
   * M5-UC71: Edit own review
   * Chỉnh sửa đánh giá (Chỉ update rating và comment)
   */
  async updateReview(review_id, data) {
    return await prisma.review.update({
      where: { id: parseInt(review_id) },
      data: {
        rating: data.rating !== undefined ? parseInt(data.rating) : undefined,
        comment: data.comment,
      }
    });
  }

  /**
   * M5-UC72: Delete own review
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
}

module.exports = new ReviewRepository();
