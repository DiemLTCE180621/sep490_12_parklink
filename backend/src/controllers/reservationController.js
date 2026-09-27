const reservationService = require('../services/reservationService');

/**
 * Controller tiếp nhận HTTP Request & gửi phản hồi JSON cho các API Reservation Request
 */
class ReservationController {
  /**
   * [GET /api/reservations/available-facilities]
   * Lấy danh sách các Bãi đỗ xe đã phê duyệt & khả dụng để Customer đăng ký
   */
  async getAvailableFacilities(req, res, next) {
    try {
      const facilities = await reservationService.getAvailableFacilities();
      return res.status(200).json({
        status: 'success',
        data: { facilities }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [POST /api/reservations]
   * Khách hàng gửi Yêu cầu thuê bãi đỗ xe theo tháng
   */
  async createReservation(req, res, next) {
    try {
      const { facility_id, vehicle_info, desired_start_date } = req.body;
      const customerId = req.user.userId;

      const reservation = await reservationService.createReservationRequest({
        customerId,
        facilityId: facility_id,
        vehicleInfo: vehicle_info,
        desiredStartDate: desired_start_date
      });

      return res.status(201).json({
        status: 'success',
        message: 'Gửi yêu cầu thuê bãi đỗ xe thành công! Vui lòng chờ chủ bãi phản hồi.',
        data: { reservation }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET /api/reservations/my-requests]
   * Khách hàng xem danh sách các yêu cầu thuê đã gửi
   */
  async getMyReservations(req, res, next) {
    try {
      const customerId = req.user.userId;
      const reservations = await reservationService.getCustomerReservations(customerId);

      return res.status(200).json({
        status: 'success',
        data: { reservations }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET /api/reservations/provider-requests]
   * Chủ bãi đỗ xe xem danh sách các yêu cầu thuê gửi đến cơ sở của mình
   */
  async getProviderReservations(req, res, next) {
    try {
      const providerId = req.user.userId;
      const reservations = await reservationService.getProviderReservations(providerId);

      return res.status(200).json({
        status: 'success',
        data: { reservations }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET /api/reservations/:id]
   * Xem chi tiết một Yêu cầu thuê đỗ xe
   */
  async getReservationById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const reservation = await reservationService.getReservationDetail(id, userId, userRole);

      return res.status(200).json({
        status: 'success',
        data: { reservation }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [PATCH /api/reservations/:id/cancel]
   * Khách hàng hủy Yêu cầu thuê đang chờ duyệt (PENDING)
   */
  async cancelReservation(req, res, next) {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;

      const reservation = await reservationService.cancelReservationRequest(id, customerId);

      return res.status(200).json({
        status: 'success',
        message: 'Đã hủy yêu cầu thuê bãi đỗ xe thành công.',
        data: { reservation }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [PATCH /api/reservations/:id/status]
   * Chủ bãi đỗ xe chấp nhận (APPROVED) hoặc từ chối (REJECTED) Yêu cầu thuê
   */
  async respondReservation(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const providerId = req.user.userId;

      const reservation = await reservationService.respondToReservationRequest(id, providerId, status);

      return res.status(200).json({
        status: 'success',
        message: status === 'APPROVED' ? 'Đã chấp nhận yêu cầu thuê!' : 'Đã từ chối yêu cầu thuê.',
        data: { reservation }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReservationController();
