const prisma = require('../config/prisma');

/**
 * Repository thao tác trực tiếp với bảng Facility trong Database
 */
class FacilityRepository {
  /**
   * Lấy danh sách các bãi đỗ xe đang chờ duyệt HOẶC đang chuẩn bị
   * (kèm thông tin Provider và Hình ảnh)
   */
  async findPendingFacilities() {
    return await prisma.facility.findMany({
      where: {
        verification_status: {
          in: ['PENDING_REVIEW', 'PREPARING']
        }
      },
      include: {
        provider: {
          select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            status: true
          }
        },
        images: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  /**
   * Tìm bãi đỗ xe cụ thể theo ID (kèm Provider)
   * @param {number} id - ID của bãi đỗ xe
   */
  async findById(id) {
    return await prisma.facility.findUnique({
      where: { id },
      include: {
        provider: true,
        images: true
      }
    });
  }

  /**
   * Bước 1: Duyệt sơ bộ → PREPARING
   * Admin xác nhận sẽ đến thực địa chuẩn bị. Provider nhận mail thông báo.
   * @param {number} facilityId
   * @param {number} providerId
   */
  async prepareFacility(facilityId, providerId) {
    return await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: {
          verification_status: 'PREPARING',
          visibility_status: 'HIDDEN'
        }
      });

      // Tạo Notification cho Provider
      await tx.notification.create({
        data: {
          user_id: providerId,
          title: 'Cơ sở đang được chuẩn bị',
          content: `Yêu cầu đăng ký cơ sở "${facility.name}" đã được duyệt sơ bộ. Đội ngũ ParkLink sẽ liên hệ và đến chuẩn bị dữ liệu cho cơ sở của bạn trong thời gian sớm nhất.`,
          type: 'SYSTEM'
        }
      });

      return facility;
    });
  }

  /**
   * Bước 2: Xác nhận hoàn tất → APPROVED
   * Admin đã chuẩn bị xong, cơ sở chính thức được duyệt, chờ Provider thanh toán.
   * @param {number} facilityId
   * @param {number} providerId
   */
  async approveFacility(facilityId, providerId) {
    return await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: {
          verification_status: 'APPROVED',
          visibility_status: 'HIDDEN', // Ẩn đến khi Provider thanh toán
          payment_status: 'UNPAID'
        }
      });

      // Kích hoạt tài khoản Provider
      await tx.user.update({
        where: { id: providerId },
        data: { status: 'ACTIVE' }
      });

      // Tạo Notification cho Provider
      await tx.notification.create({
        data: {
          user_id: providerId,
          title: 'Cơ sở đã được phê duyệt - Vui lòng thanh toán',
          content: `Cơ sở "${facility.name}" đã được phê duyệt! Vui lòng đăng nhập và hoàn tất thanh toán phí nền tảng để cơ sở được hiển thị công khai.`,
          type: 'SYSTEM'
        }
      });

      return facility;
    });
  }

  /**
   * Bước 3: Provider xác nhận thanh toán → payment_status: PAID → VISIBLE
   * @param {number} facilityId
   * @param {number} providerId
   */
  async confirmPayment(facilityId, providerId) {
    return await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: {
          payment_status: 'PAID',
          visibility_status: 'VISIBLE'
        }
      });

      // Tạo Notification cho Provider
      await tx.notification.create({
        data: {
          user_id: providerId,
          title: 'Thanh toán thành công - Cơ sở đã được công khai!',
          content: `Cơ sở "${facility.name}" đã được thanh toán và hiện đang hiển thị công khai trên nền tảng ParkLink. Chúc bạn kinh doanh thuận lợi!`,
          type: 'SYSTEM'
        }
      });

      return facility;
    });
  }

  /**
   * Cập nhật trạng thái từ chối Bãi đỗ xe thành REJECTED (dùng Transaction)
   * Kèm theo việc tạo Notification ghi nhận lý do từ chối
   * @param {number} facilityId - ID của bãi đỗ xe
   * @param {number} providerId - ID của chủ bãi (User)
   * @param {string} reason - Lý do từ chối
   */
  async rejectFacility(facilityId, providerId, reason = 'Hồ sơ bãi đỗ xe không đạt yêu cầu của ParkLink.') {
    return await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.update({
        where: { id: facilityId },
        data: {
          verification_status: 'REJECTED',
          visibility_status: 'HIDDEN'
        }
      });

      await tx.user.update({
        where: { id: providerId },
        data: { status: 'REJECTED' }
      });

      await tx.notification.create({
        data: {
          user_id: providerId,
          title: 'Đăng ký bãi đỗ xe bị từ chối',
          content: `Yêu cầu đăng ký cơ sở "${facility.name}" của bạn đã bị từ chối. Lý do: ${reason}`,
          type: 'SYSTEM'
        }
      });

      return facility;
    });
  }
}

module.exports = new FacilityRepository();
