const reservationRepository = require('../repositories/reservationRepository');
const facilityRepository = require('../repositories/facilityRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { getIO } = require('../config/socket');

class ReservationService {
  createError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  async checkAndCancelExpiredApproved() {
    try {
      const expiredList = await reservationRepository.cancelExpiredApprovedReservations();
      if (expiredList.length === 0) return;

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
    } catch (err) {
      console.error('[CheckExpired24h] Error:', err.message);
    }
  }

  async getAvailableFacilities() {
    return await reservationRepository.findAvailableFacilities();
  }

  async createReservationRequest({ customerId, facilityId, vehicleInfo, desiredStartDate }) {
    const facility = await facilityRepository.findById(Number(facilityId));
    if (!facility) {
      throw this.createError('Bãi đỗ xe không tồn tại trên hệ thống!', 404);
    }

    if (facility.verification_status !== 'APPROVED' || facility.visibility_status !== 'VISIBLE') {
      throw this.createError('Bãi đỗ xe này hiện chưa sẵn sàng hoặc tạm ngừng tiếp nhận đăng ký thuê!', 400);
    }

    if (facility.available_slots !== undefined && facility.available_slots !== null && Number(facility.available_slots) <= 0) {
      throw this.createError('Bãi đỗ xe này hiện đã hết chỗ trống! Vui lòng chọn bãi đỗ xe khác.', 400);
    }

    const startDate = new Date(desiredStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime())) {
      throw this.createError('Ngày bắt đầu thuê mong muốn không đúng định dạng!', 400);
    }

    if (startDate < today) {
      throw this.createError('Ngày bắt đầu thuê không thể thuộc về quá khứ!', 400);
    }

    const existingPending = await reservationRepository.findPendingReservation(customerId, facilityId);
    if (existingPending) {
      throw this.createError('Bạn đang có một yêu cầu thuê tại bãi đỗ xe này đang chờ chủ bãi phê duyệt!', 400);
    }

    return await reservationRepository.createReservation({
      customer_id: customerId,
      facility_id: facilityId,
      vehicle_info: vehicleInfo,
      desired_start_date: desiredStartDate
    });
  }

  async getCustomerReservations(customerId) {
    await this.checkAndCancelExpiredApproved();
    return await reservationRepository.findByCustomerId(customerId);
  }

  async getProviderReservations(providerId) {
    await this.checkAndCancelExpiredApproved();
    return await reservationRepository.findByProviderId(providerId);
  }

  async getReservationDetail(reservationId, userId, userRole) {
    await this.checkAndCancelExpiredApproved();
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      throw this.createError('Không tìm thấy thông tin yêu cầu thuê!', 404);
    }

    const isCustomerOwner = Number(reservation.customer_id) === Number(userId);
    const isFacilityProvider = reservation.facility && Number(reservation.facility.provider_id) === Number(userId);
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomerOwner && !isFacilityProvider && !isAdmin) {
      throw this.createError('Bạn không có quyền xem thông tin yêu cầu thuê này!', 403);
    }

    return reservation;
  }

  async cancelReservationRequest(reservationId, customerId) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      throw this.createError('Không tìm thấy thông tin yêu cầu thuê!', 404);
    }

    if (Number(reservation.customer_id) !== Number(customerId)) {
      throw this.createError('Bạn không phải người tạo yêu cầu thuê này!', 403);
    }

    if (reservation.status !== 'PENDING') {
      throw this.createError(`Không thể hủy yêu cầu thuê ở trạng thái hiện tại (${reservation.status})!`, 400);
    }

    return await reservationRepository.updateStatus(reservationId, 'CANCELLED');
  }

  async respondToReservationRequest(reservationId, providerId, status) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      throw this.createError('Không tìm thấy thông tin yêu cầu thuê!', 404);
    }

    if (!reservation.facility || Number(reservation.facility.provider_id) !== Number(providerId)) {
      throw this.createError('Bạn không có quyền quản lý yêu cầu thuê của bãi đỗ xe này!', 403);
    }

    if (reservation.status !== 'PENDING') {
      throw this.createError(`Yêu cầu thuê này đã được xử lý trước đó (${reservation.status})!`, 400);
    }

    if (
      status === 'APPROVED' &&
      reservation.facility.available_slots !== undefined &&
      Number(reservation.facility.available_slots) <= 0
    ) {
      throw this.createError('Bãi đỗ xe hiện đã hết chỗ trống, không thể chấp nhận thêm yêu cầu thuê!', 400);
    }

    return await reservationRepository.updateStatus(reservationId, status);
  }
}

module.exports = new ReservationService();
