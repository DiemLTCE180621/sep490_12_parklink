const confirmationRecordRepository = require('../repositories/confirmationRecordRepository');
const reservationRepository = require('../repositories/reservationRepository');
const facilityRepository = require('../repositories/facilityRepository');

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
    customerAddress,
    customerIdCard,
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

    // Trích xuất fallback từ vehicle_info nếu người tạo chưa nhập hoặc gọi API thiếu trường
    let fallbackBrand = '';
    let fallbackPlate = '';
    let fallbackIdCard = '';
    let fallbackAddress = '';

    if (reservation.vehicle_info) {
      const raw = reservation.vehicle_info;
      const cccdMatch = raw.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
      if (cccdMatch) fallbackIdCard = cccdMatch[1].trim();

      const dcMatch = raw.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);
      if (dcMatch) fallbackAddress = dcMatch[1].trim();

      const brandMatch = raw.match(/^([^-]+)\s*-\s*Biển số:\s*([^\[]+)/i);
      if (brandMatch) {
        fallbackBrand = brandMatch[1].trim();
        fallbackPlate = brandMatch[2].trim();
      }
    }

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
        facility_id: reservation.facility?.id,
        facility_name: reservation.facility?.name,
        facility_address: reservation.facility?.address,
        provider_id: reservation.facility?.provider?.id || reservation.facility?.provider_id || parseInt(providerId, 10),
        provider_name: reservation.facility?.provider?.full_name || 'Chủ cơ sở bãi xe',
        provider_phone: reservation.facility?.provider?.phone_number || 'Chưa cập nhật',
        provider_email: reservation.facility?.provider?.email || ''
      },

      // MỤC 3: Thông tin Customer (Khách hàng thuê)
      customer_info: {
        customer_id: reservation.customer.id,
        customer_name: reservation.customer.full_name,
        customer_phone: reservation.customer.phone_number,
        customer_email: reservation.customer.email,
        customer_address:
          customerAddress && customerAddress !== 'Chưa cập nhật' && customerAddress.trim() !== ''
            ? customerAddress.trim()
            : fallbackAddress || reservation.customer?.address || 'Chưa cập nhật',
        customer_id_card:
          customerIdCard && customerIdCard !== 'Chưa cập nhật' && customerIdCard.trim() !== ''
            ? customerIdCard.trim()
            : fallbackIdCard || 'Chưa cập nhật'
      },

      // MỤC 4: Thông tin xe đăng ký đỗ
      vehicle_info: {
        vehicle_info_raw: reservation.vehicle_info,
        vehicle_type: vehicleType || fallbackBrand || 'Phương tiện đăng ký đỗ',
        license_plate: licensePlate || fallbackPlate || reservation.vehicle_info
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

      // MỤC 6: Điều khoản hợp đồng gửi giữ xe ô tô (Bộ luật Dân sự 2015 & Luật Giao dịch điện tử)
      terms_and_conditions: {
        customer_obligations:
          terms?.customer_obligations ||
          '- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên A ít nhất 15 ngày.\n- Yêu cầu bồi thường thiệt hại, nếu bên giữ làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Phải trả đủ tiền dịch vụ trông giữ xe đúng thời hạn và đúng phương thức đã thỏa thuận. Trường hợp đóng tiền trễ so với thời gian quy định hợp đồng quá 3 lần/năm thì mặc định thanh lý hợp đồng trước thời hạn và khách hàng phải nộp tiền nợ (nếu có).\n- Trả phí giữ xe khi hết hạn hợp đồng mà không kịp thời nhận lại xe đã gửi.\n- Bên B tự bảo quản chìa khoá xe, thẻ xe, tài sản, tư trang trong xe ô tô.\n- Thực hiện theo đúng nội quy của bãi đậu xe.',
        owner_obligations:
          terms?.owner_obligations ||
          '- Yêu cầu bên gửi trả tiền dịch vụ trông giữ xe theo thỏa thuận.\n- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên B ít nhất 15 ngày.\n- Bảo quản xe ô tô theo đúng thỏa thuận, trả lại xe ô tô cho bên gửi theo đúng tình trạng như khi nhận giữ.\n- Chỉ được thay đổi cách bảo quản xe ô tô nếu việc thay đổi là cần thiết nhằm bảo quản tốt hơn xe ô tô đó, nhưng phải báo ngay cho bên gửi biết về việc thay đổi.\n- Thông báo kịp thời cho bên gửi biết về nguy cơ hư hỏng, tiêu hủy xe ô tô do tính chất của xe ô tô đó và yêu cầu bên gửi cho biết cách giải quyết trong một thời hạn; nếu hết thời hạn đó mà bên gửi không trả lời thì bên giữ có quyền thực hiện các biện pháp cần thiết để bảo quản và yêu cầu bên gửi thanh toán chi phí.\n- Quá thời gian thanh toán, bên A có quyền thu hồi vị trí gửi xe và yêu cầu bên B trả phí giữ xe.\n- Phải bồi thường thiệt hại, nếu làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Bảo quản cẩn thận xe gửi giữ, không được sử dụng xe trong thời gian bảo quản.',
        termination_conditions:
          terms?.termination_conditions ||
          '- Hợp đồng này có hiệu lực từ ngày bắt đầu đến ngày kết thúc thỏa thuận. Hợp đồng đương nhiên được thanh lý khi hai bên hoàn thành toàn bộ các nghĩa vụ theo nội dung Hợp đồng và hai bên không có nhu cầu thỏa thuận gia hạn hợp đồng.\n- Mỗi bên có quyền chấm dứt hợp đồng trước thời hạn nhưng phải báo trước cho bên kia ít nhất 15 ngày.\n- Hợp đồng này được lập dưới dạng hợp đồng điện tử có giá trị pháp lý theo quy định của Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam; mỗi bên lưu giữ một bản có giá trị như nhau để thực hiện.',
        dispute_resolution:
          terms?.dispute_resolution ||
          '- Hai bên cần chủ động thông báo cho nhau biết tình hình thực hiện hợp đồng, nếu có gì bất lợi phát sinh, các bên phải kịp thời thông báo cho nhau biết và tích cực giải quyết trên cơ sở thương lượng, bình đẳng, có lợi (có lập biên bản).\n- Trường hợp các bên không tự giải quyết được mới đưa việc tranh chấp ra Tòa án giải quyết.'
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

    // Tự động bổ sung thông tin CCCD và Địa chỉ nếu trước đó bị lưu là 'Chưa cập nhật'
    if (record.contract_snapshot && record.contract_snapshot.customer_info) {
      const custInfo = record.contract_snapshot.customer_info;
      const raw = record.reservation?.vehicle_info || '';
      if (!custInfo.customer_id_card || custInfo.customer_id_card === 'Chưa cập nhật') {
        const cccdMatch = raw.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
        if (cccdMatch) {
          custInfo.customer_id_card = cccdMatch[1].trim();
        }
      }
      if (!custInfo.customer_address || custInfo.customer_address === 'Chưa cập nhật') {
        const dcMatch = raw.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);
        if (dcMatch) {
          custInfo.customer_address = dcMatch[1].trim();
        } else if (record.reservation?.customer?.address) {
          custInfo.customer_address = record.reservation.customer.address;
        }
      }
    }

    return record;
  }

  /**
   * 3. [CUSTOMER] Chấp nhận / Ký Biên bản xác nhận điện tử (Accept confirmation record)
   */
  async acceptConfirmationRecord(recordId, customerId, customerData = {}) {
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
    const rawVeh = record.reservation?.vehicle_info || '';
    const cccdM = rawVeh.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
    const dcM = rawVeh.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);

    const existingCust = currentSnapshot.customer_info || {};
    const finalIdCard =
      customerData.customerIdCard && customerData.customerIdCard !== 'Chưa cập nhật' && customerData.customerIdCard.trim() !== ''
        ? customerData.customerIdCard.trim()
        : (existingCust.customer_id_card && existingCust.customer_id_card !== 'Chưa cập nhật' && existingCust.customer_id_card.trim() !== ''
          ? existingCust.customer_id_card
          : (cccdM ? cccdM[1].trim() : (existingCust.customer_id_card || 'Chưa cập nhật')));

    const finalAddress =
      customerData.customerAddress && customerData.customerAddress !== 'Chưa cập nhật' && customerData.customerAddress.trim() !== ''
        ? customerData.customerAddress.trim()
        : (existingCust.customer_address && existingCust.customer_address !== 'Chưa cập nhật' && existingCust.customer_address.trim() !== ''
          ? existingCust.customer_address
          : (dcM ? dcM[1].trim() : (record.reservation?.customer?.address || existingCust.customer_address || 'Chưa cập nhật')));

    const updatedCustomerInfo = {
      ...existingCust,
      customer_id_card: finalIdCard,
      customer_address: finalAddress
    };

    const updatedSnapshot = {
      ...currentSnapshot,
      customer_info: updatedCustomerInfo,
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

  /**
   * [ADMIN] Xem toàn bộ Hợp đồng / Biên bản xác nhận trên nền tảng
   * Hỗ trợ tìm kiếm từ khóa, lọc theo trạng thái, cơ sở, ngày lập, phân trang & tổng hợp doanh thu
   */
  async getAllConfirmationRecordsForAdmin({
    search = '',
    status = '',
    facilityId = null,
    providerId = null,
    customerId = null,
    startDate = null,
    endDate = null,
    page = 1,
    limit = 20
  }) {
    const result = await confirmationRecordRepository.findAllContracts({
      search,
      status,
      facilityId,
      providerId,
      customerId,
      startDate,
      endDate,
      page,
      limit
    });

    // Chuẩn hóa và làm sạch dữ liệu hiển thị cho từng hợp đồng
    const formattedRecords = result.records.map((record) => {
      const snapshot = record.contract_snapshot || {};
      const custInfo = snapshot.customer_info || {};
      const vehInfo = snapshot.vehicle_info || {};
      const rentInfo = snapshot.rental_info || {};
      const rawVeh = record.reservation?.vehicle_info || '';

      const cccdMatch = rawVeh.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
      const dcMatch = rawVeh.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);

      const finalIdCard =
        custInfo.customer_id_card && custInfo.customer_id_card !== 'Chưa cập nhật'
          ? custInfo.customer_id_card
          : (cccdMatch ? cccdMatch[1].trim() : 'Chưa cập nhật');

      const finalAddress =
        custInfo.customer_address && custInfo.customer_address !== 'Chưa cập nhật'
          ? custInfo.customer_address
          : (dcMatch ? dcMatch[1].trim() : 'Chưa cập nhật');

      return {
        id: record.id,
        contract_code: record.contract_code,
        status: record.status,
        start_date: record.start_date,
        end_date: record.end_date,
        agreed_price: Number(record.agreed_price || 0),
        payment_deadline_day: record.payment_deadline_day || 5,
        customer_agreed_at: record.customer_agreed_at,
        provider_agreed_at: record.provider_agreed_at,
        created_at: record.created_at,
        updated_at: record.updated_at,
        reservation_id: record.reservation_id,
        customer: {
          id: record.reservation?.customer?.id,
          full_name: record.reservation?.customer?.full_name || custInfo.customer_name || 'Khách hàng',
          email: record.reservation?.customer?.email || custInfo.customer_email,
          phone_number: record.reservation?.customer?.phone_number || custInfo.customer_phone,
          address: finalAddress,
          id_card: finalIdCard
        },
        facility: {
          id: record.reservation?.facility?.id,
          name: record.reservation?.facility?.name,
          address: record.reservation?.facility?.address,
          capacity: record.reservation?.facility?.capacity,
          price_per_month: Number(record.reservation?.facility?.price_per_month || 0)
        },
        provider: {
          id: record.reservation?.facility?.provider?.id,
          full_name: record.reservation?.facility?.provider?.full_name,
          email: record.reservation?.facility?.provider?.email,
          phone_number: record.reservation?.facility?.provider?.phone_number
        },
        vehicle: {
          raw_info: rawVeh,
          vehicle_type: vehInfo.vehicle_type || 'Phương tiện đăng ký đỗ',
          license_plate: vehInfo.license_plate || rawVeh
        },
        rental: {
          parking_spot: rentInfo.parking_spot || 'Vị trí đỗ tự do',
          amenities: rentInfo.amenities || []
        },
        contract_snapshot: snapshot
      };
    });

    return {
      confirmation_records: formattedRecords,
      pagination: result.pagination,
      summary: result.summary
    };
  }

  /**
   *  [PARKING PROVIDER] Xem danh sách Khách hàng đang có hợp đồng hiệu lực (Active) tại cơ sở
   * Kiểm tra quyền sở hữu cơ sở bãi xe, trích xuất đầy đủ thông tin khách hàng, xe, ô đỗ và số ngày còn lại
   */
  async getActiveCustomersAtFacility({
    providerId,
    facilityId = null,
    search = '',
    page = 1,
    limit = 20
  }) {
    let targetFacility = null;

    // 1. Nếu có truyền facilityId, xác minh cơ sở bãi đỗ xe thuộc quyền sở hữu của Provider
    if (facilityId) {
      targetFacility = await facilityRepository.findById(parseInt(facilityId, 10));
      if (!targetFacility) {
        const error = new Error('Không tìm thấy thông tin cơ sở bãi đỗ xe!');
        error.status = 404;
        throw error;
      }
      if (targetFacility.provider_id !== parseInt(providerId, 10)) {
        const error = new Error('Bạn không có quyền quản lý cơ sở bãi đỗ xe này!');
        error.status = 403;
        throw error;
      }
    } else {
      // Nếu không truyền, lấy facility mặc định của Provider
      targetFacility = await facilityRepository.getFacilityByProviderId(parseInt(providerId, 10));
    }

    // 2. Truy vấn danh sách hợp đồng ACTIVE từ repository
    const result = await confirmationRecordRepository.findActiveCustomersByFacility({
      providerId,
      facilityId: targetFacility ? targetFacility.id : null,
      search,
      page,
      limit
    });

    const now = new Date();

    // 3. Chuẩn hóa dữ liệu danh sách khách hàng hoạt động (Active Customers)
    const activeCustomers = result.records.map((record) => {
      const snapshot = record.contract_snapshot || {};
      const custInfo = snapshot.customer_info || {};
      const vehInfo = snapshot.vehicle_info || {};
      const rentInfo = snapshot.rental_info || {};
      const rawVeh = record.reservation?.vehicle_info || '';

      const cccdMatch = rawVeh.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
      const dcMatch = rawVeh.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);

      const finalIdCard =
        custInfo.customer_id_card && custInfo.customer_id_card !== 'Chưa cập nhật'
          ? custInfo.customer_id_card
          : (cccdMatch ? cccdMatch[1].trim() : 'Chưa cập nhật');

      const finalAddress =
        custInfo.customer_address && custInfo.customer_address !== 'Chưa cập nhật'
          ? custInfo.customer_address
          : (dcMatch ? dcMatch[1].trim() : 'Chưa cập nhật');

      const endDateObj = new Date(record.end_date);
      const diffTime = endDateObj.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const isExpired = endDateObj < now;

      return {
        contract_id: record.id,
        contract_code: record.contract_code,
        status: record.status,
        start_date: record.start_date,
        end_date: record.end_date,
        days_remaining: daysRemaining,
        is_expired: isExpired,
        customer_agreed_at: record.customer_agreed_at,
        created_at: record.created_at,
        customer: {
          id: record.reservation?.customer?.id,
          full_name: record.reservation?.customer?.full_name || custInfo.customer_name || 'Khách hàng',
          phone_number: record.reservation?.customer?.phone_number || custInfo.customer_phone,
          email: record.reservation?.customer?.email || custInfo.customer_email,
          address: finalAddress,
          id_card: finalIdCard
        },
        vehicle: {
          raw_info: rawVeh,
          vehicle_type: vehInfo.vehicle_type || 'Phương tiện đăng ký đỗ',
          license_plate: vehInfo.license_plate || rawVeh
        },
        rental: {
          parking_spot: rentInfo.parking_spot || 'Vị trí đỗ tự do',
          agreed_price: Number(record.agreed_price || 0),
          payment_deadline_day: record.payment_deadline_day || 5
        },
        facility: {
          id: record.reservation?.facility?.id,
          name: record.reservation?.facility?.name,
          address: record.reservation?.facility?.address,
          capacity: record.reservation?.facility?.capacity
        }
      };
    });

    const facilityCapacity = targetFacility ? targetFacility.capacity : null;
    const occupiedSlots = result.summary.total_active_customers;
    const availableSlots = facilityCapacity !== null ? Math.max(0, facilityCapacity - occupiedSlots) : null;
    const occupancyRate =
      facilityCapacity && facilityCapacity > 0
        ? Math.min(100, Math.round((occupiedSlots / facilityCapacity) * 100))
        : 0;

    return {
      active_customers: activeCustomers,
      pagination: result.pagination,
      summary: {
        total_active_customers: result.summary.total_active_customers,
        total_matching: result.summary.total_matching,
        total_monthly_revenue: result.summary.total_monthly_revenue,
        facility_capacity: facilityCapacity,
        occupied_slots: occupiedSlots,
        available_slots: availableSlots,
        occupancy_rate: occupancyRate
      }
    };
  }
}

module.exports = new ConfirmationRecordService();
