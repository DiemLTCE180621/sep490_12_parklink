const confirmationRecordService = require('../services/confirmationRecordService');

class ConfirmationRecordController {
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
        customer_address,
        customer_id_card,
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
        customerAddress: customer_address,
        customerIdCard: customer_id_card,
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

  async acceptConfirmationRecord(req, res, next) {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;
      const { customer_address, customer_id_card } = req.body;

      const record = await confirmationRecordService.acceptConfirmationRecord(id, customerId, {
        customerAddress: customer_address,
        customerIdCard: customer_id_card
      });

      return res.status(200).json({
        status: 'success',
        message: 'Đã chấp nhận / xác nhận ký biên bản điện tử thành công! Hợp đồng chính thức có hiệu lực.',
        data: { confirmation_record: record }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllConfirmationRecords(req, res, next) {
    try {
      const {
        search,
        status,
        facility_id,
        provider_id,
        customer_id,
        start_date,
        end_date,
        page,
        limit
      } = req.query;

      const result = await confirmationRecordService.getAllConfirmationRecordsForAdmin({
        search,
        status,
        facilityId: facility_id,
        providerId: provider_id,
        customerId: customer_id,
        startDate: start_date,
        endDate: end_date,
        page,
        limit
      });

      return res.status(200).json({
        status: 'success',
        message: 'Lấy danh sách tất cả hợp đồng trên nền tảng thành công!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveCustomersAtFacility(req, res, next) {
    try {
      const providerId = req.user.userId;
      const { facility_id, search, page, limit } = req.query;

      const result = await confirmationRecordService.getActiveCustomersAtFacility({
        providerId,
        facilityId: facility_id,
        search,
        page,
        limit
      });

      return res.status(200).json({
        status: 'success',
        message: 'Lấy danh sách khách hàng đang thuê hiệu lực tại bãi xe thành công!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async requestLeaseExtension(req, res, next) {
    try {
      const contractId = req.params.id || req.body.contract_id;
      const customerId = req.user.userId;
      const {
        extension_months,
        new_end_date,
        reason,
        vehicle_type,
        license_plate,
        customer_address,
        customer_phone
      } = req.body;

      const result = await confirmationRecordService.requestLeaseExtension({
        contractId,
        customerId,
        extensionMonths: extension_months,
        newEndDate: new_end_date,
        reason,
        vehicleType: vehicle_type,
        licensePlate: license_plate,
        customerAddress: customer_address,
        customerPhone: customer_phone
      });

      return res.status(201).json({
        status: 'success',
        message: 'Gửi yêu cầu gia hạn hợp đồng thuê bãi xe thành công! Vui lòng chờ chủ bãi phê duyệt.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getLeaseExtensionDetail(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const result = await confirmationRecordService.getLeaseExtensionDetail(id, userId, userRole);

      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelLeaseExtension(req, res, next) {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;

      const result = await confirmationRecordService.cancelLeaseExtension(id, customerId);

      return res.status(200).json({
        status: 'success',
        message: 'Hủy yêu cầu gia hạn hợp đồng thành công!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async respondToLeaseExtension(req, res, next) {
    try {
      const { id } = req.params;
      const providerId = req.user.userId;
      const { status, provider_note } = req.body;

      const result = await confirmationRecordService.respondToLeaseExtension({
        contractId: id,
        providerId,
        status,
        providerNote: provider_note
      });

      const isApproved = status.toUpperCase() === 'APPROVED';
      return res.status(200).json({
        status: 'success',
        message: isApproved
          ? 'Đã chấp thuận gia hạn hợp đồng thuê thành công!'
          : 'Đã từ chối yêu cầu gia hạn hợp đồng.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyLeaseExtensions(req, res, next) {
    try {
      const customerId = req.user.userId;
      const records = await confirmationRecordService.getMyLeaseExtensions(customerId);

      return res.status(200).json({
        status: 'success',
        data: { extension_records: records }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProviderLeaseExtensions(req, res, next) {
    try {
      const providerId = req.user.userId;
      const records = await confirmationRecordService.getProviderLeaseExtensions(providerId);

      return res.status(200).json({
        status: 'success',
        data: { extension_records: records }
      });
    } catch (error) {
      next(error);
    }
  }

  async requestEarlyTermination(req, res, next) {
    try {
      const contractId = req.params.id || req.body.contract_id;
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { termination_date, reason, bank_account_info, refund_amount, provider_note } = req.body;

      const result = await confirmationRecordService.requestEarlyTermination({
        contractId,
        userId,
        userRole,
        terminationDate: termination_date,
        reason,
        bankAccountInfo: bank_account_info,
        refundAmount: refund_amount,
        providerNote: provider_note
      });

      return res.status(201).json({
        status: 'success',
        message: userRole === 'PROVIDER'
          ? 'Gửi yêu cầu chấm dứt hợp đồng thành công! Đã gửi thông báo tới khách hàng.'
          : 'Gửi yêu cầu chấm dứt hợp đồng trước hạn thành công! Vui lòng chờ chủ bãi xác nhận.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelEarlyTermination(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const result = await confirmationRecordService.cancelEarlyTermination(id, userId, userRole);

      return res.status(200).json({
        status: 'success',
        message: 'Hủy yêu cầu chấm dứt hợp đồng thành công!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmContractTermination(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { status, provider_note, refund_amount } = req.body;

      const result = await confirmationRecordService.confirmContractTermination({
        contractId: id,
        userId,
        userRole,
        status: status || 'CONFIRMED',
        providerNote: provider_note,
        refundAmount: refund_amount
      });

      const isConfirmed = !status || status.toUpperCase() === 'CONFIRMED' || status.toUpperCase() === 'APPROVED';
      return res.status(200).json({
        status: 'success',
        message: isConfirmed
          ? 'Đã xác nhận chấm dứt hợp đồng và hoàn tất thu hồi vị trí đỗ xe thành công!'
          : 'Đã từ chối yêu cầu chấm dứt hợp đồng.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getContractTerminationDetail(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const result = await confirmationRecordService.getContractTerminationDetail(id, userId, userRole);

      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyTerminationRequests(req, res, next) {
    try {
      const customerId = req.user.userId;
      const records = await confirmationRecordService.getMyTerminationRequests(customerId);

      return res.status(200).json({
        status: 'success',
        data: { termination_records: records }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProviderTerminationRequests(req, res, next) {
    try {
      const providerId = req.user.userId;
      const records = await confirmationRecordService.getProviderTerminationRequests(providerId);

      return res.status(200).json({
        status: 'success',
        data: { termination_records: records }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConfirmationRecordController();
