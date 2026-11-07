const reservationService = require('../services/reservationService');

class ReservationController {
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

  async acceptReservation(req, res, next) {
    try {
      const { id } = req.params;
      const providerId = req.user.userId;

      const reservation = await reservationService.respondToReservationRequest(id, providerId, 'APPROVED');

      return res.status(200).json({
        status: 'success',
        message: 'Đã phê duyệt / chấp nhận yêu cầu thuê bãi đỗ xe thành công!',
        data: { reservation }
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectReservation(req, res, next) {
    try {
      const { id } = req.params;
      const providerId = req.user.userId;

      const reservation = await reservationService.respondToReservationRequest(id, providerId, 'REJECTED');

      return res.status(200).json({
        status: 'success',
        message: 'Đã từ chối yêu cầu thuê bãi đỗ xe.',
        data: { reservation }
      });
    } catch (error) {
      next(error);
    }
  }

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
