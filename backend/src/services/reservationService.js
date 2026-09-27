const reservationRepository = require('../repositories/reservationRepository');

/**
 * Service chứa toàn bộ Business Logic xử lý Yêu cầu thuê bãi đỗ xe theo tháng (Reservation Request)
 */
class ReservationService {
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
    return await reservationRepository.findByCustomerId(customerId);
  }

  /**
   * Lấy danh sách yêu cầu thuê xe dành cho Chủ bãi đỗ xe (Provider)
   */
  async getProviderReservations(providerId) {
    return await reservationRepository.findByProviderId(providerId);
  }

  /**
   * Xem chi tiết một Yêu cầu thuê đỗ xe
   */
  async getReservationDetail(reservationId, userId, userRole) {
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

    const updatedReservation = await reservationRepository.updateStatus(reservationId, status);
    return updatedReservation;
  }
}

module.exports = new ReservationService();
