const reservationRepository = require('../repositories/reservationRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { getIO } = require('../config/socket');

const CONTRACT_CREATION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 giờ để Provider lập hợp đồng sau khi APPROVED

/**
 * Service chứa toàn bộ Business Logic xử lý Yêu cầu thuê bãi đỗ xe theo tháng (Reservation Request)
 */
class ReservationService {
  /**
   * Kiểm tra và tự động hủy các đơn APPROVED đã quá 24h mà Provider chưa lập hợp đồng
   */
  async checkAndCancelExpiredApproved() {
    try {
      const expiredList = await reservationRepository.cancelExpiredApprovedReservations();
      if (expiredList.length > 0) {
        const io = getIO();
        for (const item of expiredList) {
          const facilityName = item.facility?.name || 'bãi đỗ xe';
          if (item.customer_id) {
            const custTitle = `Yêu cầu đặt chỗ #${item.id} đã tự động hủy (Quá 24h lập hợp đồng)`;
            const custContent = `Yêu cầu đặt chỗ của bạn tại ${facilityName} đã tự động hủy do quá thời hạn 24 giờ kể từ khi chủ bãi chấp nhận nhưng chưa khởi tạo hợp đồng điện tử.`;
            await notificationRepository.createNotification({
              user_id: Number(item.customer_id),
              title: custTitle,
              content: custContent,
              type: 'RESERVATION_EXPIRED_24H'
            });
            if (io) {
              io.to(`user_${item.customer_id}`).emit('new_notification', {
                id: `noti_${Date.now()}_${item.customer_id}`,
                title: custTitle,
                content: custContent,
                type: 'RESERVATION_EXPIRED_24H',
                reservation_id: item.id,
                created_at: new Date().toISOString()
              });
            }
          }
          if (item.facility?.provider_id) {
            const provTitle = `Hết hạn 24h lập hợp đồng cho yêu cầu #${item.id}`;
            const provContent = `Yêu cầu đặt chỗ #${item.id} của khách hàng ${item.customer?.full_name || ''} tại ${facilityName} đã tự động hủy do quá 24 giờ kể từ lúc chấp nhận mà chưa tạo hợp đồng.`;
            await notificationRepository.createNotification({
              user_id: Number(item.facility.provider_id),
              title: provTitle,
              content: provContent,
              type: 'RESERVATION_EXPIRED_24H'
            });
            if (io) {
              io.to(`user_${item.facility.provider_id}`).emit('new_notification', {
                id: `noti_${Date.now()}_${item.facility.provider_id}`,
                title: provTitle,
                content: provContent,
                type: 'RESERVATION_EXPIRED_24H',
                reservation_id: item.id,
                created_at: new Date().toISOString()
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('[CheckExpired24h] Lỗi khi tự động hủy đơn quá hạn 24h lập hợp đồng:', err.message);
    }
  }
  /**
   * Lấy danh sách các Bãi đỗ xe khả dụng để Customer lựa chọn gửi yêu cầu thuê
   */
  async getAvailableFacilities() {
    return await reservationRepository.findAvailableFacilities();
  }

  /**
   * Khách hàng (Customer) gửi Yêu cầu thuê bãi đỗ xe theo tháng
   */
  async createReservationRequest({ customerId, facilityId, vehicleInfo, desiredStartDate }) {
    // 1. Kiểm tra sự tồn tại của Bãi đỗ xe
    const facility = await reservationRepository.findFacilityById(facilityId);
    if (!facility) {
      const error = new Error('Bãi đỗ xe không tồn tại trên hệ thống!');
      error.status = 404;
      throw error;
    }

    // 2. Kiểm tra điều kiện khả dụng của Bãi đỗ xe (phải được Duyệt và đang Hiển thị)
    if (facility.verification_status !== 'APPROVED' || facility.visibility_status !== 'VISIBLE') {
      const error = new Error('Bãi đỗ xe này hiện chưa sẵn sàng hoặc tạm ngừng tiếp nhận đăng ký thuê!');
      error.status = 400;
      throw error;
    }

    // 2.1. Kiểm tra bãi đỗ xe còn chỗ trống hay không
    if (facility.available_slots !== undefined && facility.available_slots !== null && Number(facility.available_slots) <= 0) {
      const error = new Error('Bãi đỗ xe này hiện đã hết chỗ trống! Vui lòng chọn bãi đỗ xe khác.');
      error.status = 400;
      throw error;
    }

    // 3. Kiểm tra ngày mong muốn bắt đầu thuê (không được thuộc về quá khứ)
    const startDate = new Date(desiredStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime())) {
      const error = new Error('Ngày bắt đầu thuê mong muốn không đúng định dạng!');
      error.status = 400;
      throw error;
    }

    if (startDate < today) {
      const error = new Error('Ngày bắt đầu thuê không thể thuộc về quá khứ!');
      error.status = 400;
      throw error;
    }

    // 4. Kiểm tra xem Customer đã gửi yêu cầu PENDING tại bãi này chưa
    const existingPending = await reservationRepository.findPendingReservation(customerId, facilityId);
    if (existingPending) {
      const error = new Error('Bạn đang có một yêu cầu thuê tại bãi đỗ xe này đang chờ chủ bãi phê duyệt!');
      error.status = 400;
      throw error;
    }

    // 5. Lưu Yêu cầu thuê xe vào Database
    const newReservation = await reservationRepository.createReservation({
      customer_id: customerId,
      facility_id: facilityId,
      vehicle_info: vehicleInfo,
      desired_start_date: desiredStartDate
    });

    return newReservation;
  }

  /**
   * Lấy danh sách yêu cầu thuê xe của Khách hàng hiện tại
   */
  async getCustomerReservations(customerId) {
    await this.checkAndCancelExpiredApproved();
    return await reservationRepository.findByCustomerId(customerId);
  }

  /**
   * Lấy danh sách yêu cầu thuê xe dành cho Chủ bãi đỗ xe (Provider)
   */
  async getProviderReservations(providerId) {
    await this.checkAndCancelExpiredApproved();
    return await reservationRepository.findByProviderId(providerId);
  }

  /**
   * Xem chi tiết một Yêu cầu thuê đỗ xe
   */
  async getReservationDetail(reservationId, userId, userRole) {
    await this.checkAndCancelExpiredApproved();
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      const error = new Error('Không tìm thấy thông tin yêu cầu thuê!');
      error.status = 404;
      throw error;
    }

    // Kiểm tra quyền truy cập: Chỉ Customer tạo yêu cầu, Provider chủ bãi hoặc Admin mới có quyền xem
    const isCustomerOwner = reservation.customer_id === userId;
    const isFacilityProvider = reservation.facility && reservation.facility.provider_id === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomerOwner && !isFacilityProvider && !isAdmin) {
      const error = new Error('Bạn không có quyền xem thông tin yêu cầu thuê này!');
      error.status = 403;
      throw error;
    }

    return reservation;
  }

  /**
   * Khách hàng hủy Yêu cầu thuê đỗ xe đang chờ duyệt (PENDING)
   */
  async cancelReservationRequest(reservationId, customerId) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      const error = new Error('Không tìm thấy thông tin yêu cầu thuê!');
      error.status = 404;
      throw error;
    }

    if (reservation.customer_id !== customerId) {
      const error = new Error('Bạn không phải người tạo yêu cầu thuê này!');
      error.status = 403;
      throw error;
    }

    if (reservation.status !== 'PENDING') {
      const error = new Error(`Không thể hủy yêu cầu thuê ở trạng thái hiện tại (${reservation.status})!`);
      error.status = 400;
      throw error;
    }

    return await reservationRepository.updateStatus(reservationId, 'CANCELLED');
  }

  /**
   * Chủ bãi đỗ xe (Provider) phản hồi Yêu cầu thuê xe (Chấp nhận APPROVED / Từ chối REJECTED)
   */
  async respondToReservationRequest(reservationId, providerId, status) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      const error = new Error('Không tìm thấy thông tin yêu cầu thuê!');
      error.status = 404;
      throw error;
    }

    if (reservation.facility.provider_id !== providerId) {
      const error = new Error('Bạn không có quyền quản lý yêu cầu thuê của bãi đỗ xe này!');
      error.status = 403;
      throw error;
    }

    if (reservation.status !== 'PENDING') {
      const error = new Error(`Yêu cầu thuê này đã được xử lý trước đó (${reservation.status})!`);
      error.status = 400;
      throw error;
    }

    if (
      status === 'APPROVED' &&
      reservation.facility &&
      reservation.facility.available_slots !== undefined &&
      Number(reservation.facility.available_slots) <= 0
    ) {
      const error = new Error('Bãi đỗ xe hiện đã hết chỗ trống, không thể chấp nhận thêm yêu cầu thuê!');
      error.status = 400;
      throw error;
    }

    const updatedReservation = await reservationRepository.updateStatus(reservationId, status);
    return updatedReservation;
  }
}

module.exports = new ReservationService();
