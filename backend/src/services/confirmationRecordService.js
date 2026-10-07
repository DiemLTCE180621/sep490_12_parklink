const confirmationRecordRepository = require('../repositories/confirmationRecordRepository');
const reservationRepository = require('../repositories/reservationRepository');

/**
 * Service chứa toàn bộ Business Logic xử lý Biên bản xác nhận / Hợp đồng điện tử (Confirmation Record)
 */
class ConfirmationRecordService {
  /**
   * 1. [PARKING PROVIDER] Tạo Biên bản xác nhận điện tử cho Yêu cầu thuê bãi xe đã được duyệt (APPROVED)
   */
  async createConfirmationRecord({
    providerId,
    reservationId,
    agreedPrice,
    paymentDeadlineDay,
    startDate,
    endDate,
    parkingSpot,
    vehicleType,
    licensePlate,
    terms
  }) {
    // 1. Kiểm tra sự tồn tại của Yêu cầu thuê xe
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      const error = new Error('Không tìm thấy thông tin yêu cầu thuê bãi xe!');
      error.status = 404;
      throw error;
    }

    // 2. Kiểm tra quyền sở hữu của Chủ bãi đỗ xe (Provider)
    if (reservation.facility.provider_id !== parseInt(providerId, 10)) {
      const error = new Error('Bạn không có quyền tạo biên bản xác nhận cho bãi đỗ xe này!');
      error.status = 403;
      throw error;
    }

    // 3. Kiểm tra trạng thái yêu cầu thuê: Phải là APPROVED
    if (reservation.status !== 'APPROVED') {
      const error = new Error('Chỉ có thể tạo biên bản xác nhận điện tử cho yêu cầu thuê đã được duyệt (APPROVED)!');
      error.status = 400;
      throw error;
    }

    // 4. Kiểm tra xem đã tồn tại biên bản xác nhận cho yêu cầu này chưa
    const existingRecord = await confirmationRecordRepository.findByReservationId(reservationId);
    if (existingRecord) {
      const error = new Error('Yêu cầu thuê bãi xe này đã được tạo biên bản xác nhận điện tử trước đó!');
      error.status = 400;
      throw error;
    }

    // 5. Tự động sinh Mã hợp đồng / Biên bản duy nhất
    const contractCode = `HD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Tạo Dữ liệu Snapshot 7 Mục lưu giữ nguyên vẹn nội dung hợp đồng chuẩn
    const contractSnapshot = {
      // MỤC 1: Thông tin hợp đồng
      contract_info: {
        contract_code: contractCode,
        issue_date: new Date(),
        start_date: startDate,
        end_date: endDate
      },

      // MỤC 2: Thông tin Owner (Chủ bãi đỗ xe)
      owner_info: {
        facility_id: reservation.facility.id,
        facility_name: reservation.facility.name,
        facility_address: reservation.facility.address,
        provider_id: reservation.facility.provider.id,
        provider_name: reservation.facility.provider.full_name,
        provider_phone: reservation.facility.provider.phone_number,
        provider_email: reservation.facility.provider.email
      },

      // MỤC 3: Thông tin Customer (Khách hàng thuê)
      customer_info: {
        customer_id: reservation.customer.id,
        customer_name: reservation.customer.full_name,
        customer_phone: reservation.customer.phone_number,
        customer_email: reservation.customer.email,
        customer_address: reservation.customer.address || 'Chưa cập nhật'
      },

      // MỤC 4: Thông tin xe đăng ký đỗ
      vehicle_info: {
        vehicle_info_raw: reservation.vehicle_info,
        vehicle_type: vehicleType || 'Phương tiện đăng ký đỗ',
        license_plate: licensePlate || reservation.vehicle_info
      },

      // MỤC 5: Thông tin thuê đỗ xe
      rental_info: {
        parking_spot: parkingSpot || 'Vị trí đỗ tự do trong bãi',
        amenities: reservation.facility.facility_amenities
          ? reservation.facility.facility_amenities.map((item) => item.amenity?.name).filter(Boolean)
          : [],
        agreed_price: agreedPrice,
        payment_deadline_day: paymentDeadlineDay || 5
      },

      // MỤC 6: Điều khoản quy định pháp lý (Bộ luật Dân sự 2015 & Luật Giao dịch điện tử)
      terms_and_conditions: {
        customer_obligations:
          terms?.customer_obligations ||
          '1. Thanh toán đầy đủ tiền thuê bãi đỗ xe theo đúng hạn thỏa thuận hàng tháng.\n2. Đỗ xe đúng vị trí được phân công, tuân thủ nghiêm ngặt nội quy bãi xe và quy định về Phòng cháy chữa cháy (PCCC).\n3. Thông báo rõ cho chủ bãi về tình trạng hoặc đặc tính nguy hiểm của phương tiện (nếu có).\n4. Tự bảo quản các vật dụng tài sản cá nhân có giá trị rời để bên trong xe.',
        owner_obligations:
          terms?.owner_obligations ||
          '1. Bố trí chỗ đỗ xe an toàn, duy trì hạ tầng, vệ sinh và hệ thống giám sát an ninh 24/7.\n2. Bảo quản phương tiện đỗ tại bãi theo quy định của Bộ luật Dân sự 2015; chịu trách nhiệm bồi thường thiệt hại theo quy định pháp luật nếu phương tiện bị mất mát hoặc hư hỏng do lỗi trực tiếp của bãi đỗ xe.\n3. Không được tự ý di chuyển hoặc giao phương tiện cho người thứ ba sử dụng khi chưa có sự đồng ý của khách thuê.',
        termination_conditions:
          terms?.termination_conditions ||
          '1. Hợp đồng đương nhiên hết hiệu lực khi hết thời hạn thỏa thuận mà hai bên không gia hạn.\n2. Mỗi bên có quyền đơn phương chấm dứt hợp đồng trước hạn nếu bên kia vi phạm nghiêm trọng nghĩa vụ hợp đồng và phải thông báo bằng thông điệp dữ liệu điện tử/văn bản trước ít nhất 15 ngày.',
        dispute_resolution:
          terms?.dispute_resolution ||
          '1. Hợp đồng điện tử này được lập và có giá trị pháp lý tuân thủ theo Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam.\n2. Mọi tranh chấp phát sinh sẽ được ưu tiên thương lượng, hòa giải trên nền tảng ParkLink. Trường hợp không thể tự thỏa thuận, tranh chấp sẽ do Tòa án nhân dân có thẩm quyền giải quyết.'
      },

      // MỤC 7: Trạng thái Đồng ý / Xác nhận của hai bên
      confirmation: {
        provider_agreed_at: new Date(),
        customer_agreed_at: null,
        is_agreed: false
      }
    };

    // 7. Lưu Biên bản xác nhận vào Database
    const newRecord = await confirmationRecordRepository.create({
      contract_code: contractCode,
      reservation_id: reservationId,
      agreed_price: agreedPrice,
      payment_deadline_day: paymentDeadlineDay || 5,
      start_date: startDate,
      end_date: endDate,
      contract_snapshot: contractSnapshot,
      provider_agreed_at: new Date(),
      status: 'PENDING_SIGNATURE'
    });

    return newRecord;
  }

  /**
   * 2. [CUSTOMER] Xem danh sách các Biên bản xác nhận / Hợp đồng điện tử của Khách hàng
   */
  async getCustomerConfirmationRecords(customerId) {
    return await confirmationRecordRepository.findByCustomerId(customerId);
  }

  /**
   * [PROVIDER] Xem danh sách các Biên bản xác nhận / Hợp đồng điện tử do Chủ bãi đã tạo
   */
  async getProviderConfirmationRecords(providerId) {
    return await confirmationRecordRepository.findByProviderId(providerId);
  }

  /**
   * Xem chi tiết một Biên bản xác nhận điện tử
   */
  async getConfirmationRecordDetail(recordId, userId, userRole) {
    const record = await confirmationRecordRepository.findById(recordId);
    if (!record) {
      const error = new Error('Không tìm thấy thông tin biên bản xác nhận điện tử!');
      error.status = 404;
      throw error;
    }

    const isCustomerOwner = record.reservation.customer_id === parseInt(userId, 10);
    const isFacilityProvider = record.reservation.facility.provider_id === parseInt(userId, 10);
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomerOwner && !isFacilityProvider && !isAdmin) {
      const error = new Error('Bạn không có quyền xem thông tin biên bản xác nhận điện tử này!');
      error.status = 403;
      throw error;
    }

    return record;
  }

  /**
   * 3. [CUSTOMER] Chấp nhận / Ký Biên bản xác nhận điện tử (Accept confirmation record)
   */
  async acceptConfirmationRecord(recordId, customerId) {
    // 1. Tìm Biên bản xác nhận
    const record = await confirmationRecordRepository.findById(recordId);
    if (!record) {
      const error = new Error('Không tìm thấy thông tin biên bản xác nhận điện tử!');
      error.status = 404;
      throw error;
    }

    // 2. Kiểm tra quyền sở hữu của Khách hàng
    if (record.reservation.customer_id !== parseInt(customerId, 10)) {
      const error = new Error('Bạn không phải người sở hữu yêu cầu thuê để chấp nhận biên bản này!');
      error.status = 403;
      throw error;
    }

    // 3. Kiểm tra trạng thái: Phải đang ở PENDING_SIGNATURE
    if (record.status !== 'PENDING_SIGNATURE') {
      const error = new Error(`Biên bản xác nhận này đã được xử lý hoặc đang ở trạng thái (${record.status})!`);
      error.status = 400;
      throw error;
    }

    // 4. Cập nhật trạng thái thành ACTIVE và ghi nhận ngày chấp nhận
    const now = new Date();
    const currentSnapshot = record.contract_snapshot || {};
    const updatedSnapshot = {
      ...currentSnapshot,
      confirmation: {
        ...currentSnapshot.confirmation,
        customer_agreed_at: now,
        is_agreed: true
      }
    };

    const updatedRecord = await confirmationRecordRepository.updateStatusAndAgree(
      recordId,
      'ACTIVE',
      now,
      updatedSnapshot
    );

    return updatedRecord;
  }
}

module.exports = new ConfirmationRecordService();
