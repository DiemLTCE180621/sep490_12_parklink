const confirmationRecordService = require('../services/confirmationRecordService');

/**
 * Controller tiếp nhận HTTP Request & gửi phản hồi cho Biên bản xác nhận / Hợp đồng điện tử (Confirmation Record)
 */
class ConfirmationRecordController {
  /**
   * [POST /api/confirmation-records]
   * Parking Provider tạo Biên bản xác nhận điện tử cho Yêu cầu thuê xe đã được duyệt (APPROVED)
   */
  async createConfirmationRecord(req, res, next) {
    try {
      const providerId = req.user.userId;
      const {
        reservation_id,
        agreed_price,
        payment_deadline_day,
        start_date,
        end_date,
        parking_spot,
        vehicle_type,
        license_plate,
        terms
      } = req.body;

      const record = await confirmationRecordService.createConfirmationRecord({
        providerId,
        reservationId: reservation_id,
        agreedPrice: agreed_price,
        paymentDeadlineDay: payment_deadline_day,
        startDate: start_date,
        endDate: end_date,
        parkingSpot: parking_spot,
        vehicleType: vehicle_type,
        licensePlate: license_plate,
        terms
      });

      return res.status(201).json({
        status: 'success',
        message: 'Tạo biên bản xác nhận / hợp đồng điện tử thành công!',
        data: { confirmation_record: record }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET /api/confirmation-records/my-records]
   * Khách hàng (Customer) xem danh sách các Biên bản xác nhận / Hợp đồng điện tử của mình
   */
  async getMyConfirmationRecords(req, res, next) {
    try {
      const customerId = req.user.userId;
      const records = await confirmationRecordService.getCustomerConfirmationRecords(customerId);

      return res.status(200).json({
        status: 'success',
        data: { confirmation_records: records }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET /api/confirmation-records/provider-records]
   * Chủ bãi (Provider) xem danh sách các Biên bản xác nhận điện tử do mình đã lập
   */
  async getProviderConfirmationRecords(req, res, next) {
    try {
      const providerId = req.user.userId;
      const records = await confirmationRecordService.getProviderConfirmationRecords(providerId);

      return res.status(200).json({
        status: 'success',
        data: { confirmation_records: records }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET /api/confirmation-records/:id]
   * Xem thông tin chi tiết một Biên bản xác nhận điện tử
   */
  async getConfirmationRecordById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const record = await confirmationRecordService.getConfirmationRecordDetail(id, userId, userRole);

      return res.status(200).json({
        status: 'success',
        data: { confirmation_record: record }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [PATCH /api/confirmation-records/:id/accept]
   * Khách hàng (Customer) Chấp nhận / Ký Biên bản xác nhận điện tử
   */
  async acceptConfirmationRecord(req, res, next) {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;

      const record = await confirmationRecordService.acceptConfirmationRecord(id, customerId);

      return res.status(200).json({
        status: 'success',
        message: 'Đã chấp nhận / xác nhận ký biên bản điện tử thành công! Hợp đồng chính thức có hiệu lực.',
        data: { confirmation_record: record }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConfirmationRecordController();
