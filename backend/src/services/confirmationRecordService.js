const confirmationRecordRepository = require('../repositories/confirmationRecordRepository');
const reservationRepository = require('../repositories/reservationRepository');
const facilityRepository = require('../repositories/facilityRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { getIO } = require('../config/socket');

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const DEFAULT_CONTRACT_TERMS = {
  customer_obligations:
    '- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên A ít nhất 15 ngày.\n- Yêu cầu bồi thường thiệt hại, nếu bên giữ làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Phải trả đủ tiền dịch vụ trông giữ xe đúng thời hạn và đúng phương thức đã thỏa thuận. Trường hợp đóng tiền trễ so với thời gian quy định hợp đồng quá 3 lần/năm thì mặc định thanh lý hợp đồng trước thời hạn và khách hàng phải nộp tiền nợ (nếu có).\n- Trả phí giữ xe khi hết hạn hợp đồng mà không kịp thời nhận lại xe đã gửi.\n- Bên B tự bảo quản chìa khoá xe, thẻ xe, tài sản, tư trang trong xe ô tô.\n- Thực hiện theo đúng nội quy của bãi đậu xe.',
  owner_obligations:
    '- Yêu cầu bên gửi trả tiền dịch vụ trông giữ xe theo thỏa thuận.\n- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên B ít nhất 15 ngày.\n- Bảo quản xe ô tô theo đúng thỏa thuận, trả lại xe ô tô cho bên gửi theo đúng tình trạng như khi nhận giữ.\n- Chỉ được thay đổi cách bảo quản xe ô tô nếu việc thay đổi là cần thiết nhằm bảo quản tốt hơn xe ô tô đó, nhưng phải báo ngay cho bên gửi biết về việc thay đổi.\n- Thông báo kịp thời cho bên gửi biết về nguy cơ hư hỏng, tiêu hủy xe ô tô do tính chất của xe ô tô đó và yêu cầu bên gửi cho biết cách giải quyết trong một thời hạn; nếu hết thời hạn đó mà bên gửi không trả lời thì bên giữ có quyền thực hiện các biện pháp cần thiết để bảo quản và yêu cầu bên gửi thanh toán chi phí.\n- Quá thời gian thanh toán, bên A có quyền thu hồi vị trí gửi xe và yêu cầu bên B trả phí giữ xe.\n- Phải bồi thường thiệt hại, nếu làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Bảo quản cẩn thận xe gửi giữ, không được sử dụng xe trong thời gian bảo quản.',
  termination_conditions:
    '- Hợp đồng này có hiệu lực từ ngày bắt đầu đến ngày kết thúc thỏa thuận. Hợp đồng đương nhiên được thanh lý khi hai bên hoàn thành toàn bộ các nghĩa vụ theo nội dung Hợp đồng và hai bên không có nhu cầu thỏa thuận gia hạn hợp đồng.\n- Mỗi bên có quyền chấm dứt hợp đồng trước thời hạn nhưng phải báo trước cho bên kia ít nhất 15 ngày.\n- Hợp đồng này được lập dưới dạng hợp đồng điện tử có giá trị pháp lý theo quy định của Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam; mỗi bên lưu giữ một bản có giá trị như nhau để thực hiện.',
  dispute_resolution:
    '- Hai bên cần chủ động thông báo cho nhau biết tình hình thực hiện hợp đồng, nếu có gì bất lợi phát sinh, các bên phải kịp thời thông báo cho nhau biết và tích cực giải quyết trên cơ sở thương lượng, bình đẳng, có lợi (có lập biên bản).\n- Trường hợp các bên không tự giải quyết được mới đưa việc tranh chấp ra Tòa án giải quyết.'
};

class ConfirmationRecordService {
  createError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  extractVehicleMetadata(rawVehicleInfo = '') {
    let brand = '';
    let plate = '';
    let idCard = '';
    let address = '';

    if (rawVehicleInfo) {
      const cccdMatch = rawVehicleInfo.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
      if (cccdMatch) idCard = cccdMatch[1].trim();

      const dcMatch = rawVehicleInfo.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);
      if (dcMatch) address = dcMatch[1].trim();

      const brandMatch = rawVehicleInfo.match(/^([^-]+)\s*-\s*Biển số:\s*([^\[]+)/i);
      if (brandMatch) {
        brand = brandMatch[1].trim();
        plate = brandMatch[2].trim();
      }
    }

    return { brand, plate, idCard, address };
  }

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
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) {
      throw this.createError('Không tìm thấy thông tin yêu cầu thuê bãi xe!', 404);
    }

    if (Number(reservation.facility.provider_id) !== Number(providerId)) {
      throw this.createError('Bạn không có quyền tạo biên bản xác nhận cho bãi đỗ xe này!', 403);
    }

    const approvedTimestamp = reservation.updated_at ? new Date(reservation.updated_at).getTime() : Date.now();
    const isExpired24h = Date.now() - approvedTimestamp > TWENTY_FOUR_HOURS_MS;

    if (reservation.status === 'CANCELLED' || (reservation.status === 'APPROVED' && isExpired24h)) {
      if (reservation.status !== 'CANCELLED') {
        await reservationRepository.updateStatus(reservationId, 'CANCELLED');
        try {
          const facilityName = reservation.facility?.name || 'bãi đỗ xe';
          const targetCustId = reservation.customer?.id || reservation.customer_id;
          if (targetCustId) {
            await notificationRepository.createNotification({
              user_id: Number(targetCustId),
              title: `Yêu cầu đặt chỗ #${reservation.id} đã tự động hủy (Quá 24h lập hợp đồng)`,
              content: `Yêu cầu đặt chỗ của bạn tại ${facilityName} đã tự động hủy do quá thời hạn 24 giờ kể từ khi chủ bãi chấp nhận nhưng chưa hoàn tất tạo hợp đồng.`,
              type: 'RESERVATION_EXPIRED_24H'
            });
          }
        } catch (notiErr) {
          console.error(notiErr.message);
        }
      }

      throw this.createError(
        'Đã hết thời hạn 24 giờ làm hợp đồng kể từ khi chấp nhận yêu cầu! Hệ thống đã tự động hủy yêu cầu đặt chỗ này.',
        400
      );
    }

    if (reservation.status !== 'APPROVED') {
      throw this.createError('Chỉ có thể tạo biên bản xác nhận điện tử cho yêu cầu thuê đã được duyệt (APPROVED)!', 400);
    }

    if (
      reservation.facility &&
      reservation.facility.available_slots !== undefined &&
      Number(reservation.facility.available_slots) <= 0
    ) {
      throw this.createError('Bãi đỗ xe hiện đã hết chỗ trống, không thể tạo hợp đồng điện tử mới!', 400);
    }

    const existingRecord = await confirmationRecordRepository.findByReservationId(reservationId);
    if (existingRecord) {
      throw this.createError('Yêu cầu thuê bãi xe này đã được tạo biên bản xác nhận điện tử trước đó!', 400);
    }

    const contractCode = `HD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { brand: fallbackBrand, plate: fallbackPlate, idCard: fallbackIdCard, address: fallbackAddress } =
      this.extractVehicleMetadata(reservation.vehicle_info);

    const contractSnapshot = {
      contract_info: {
        contract_code: contractCode,
        issue_date: new Date(),
        start_date: startDate,
        end_date: endDate
      },
      owner_info: {
        facility_id: reservation.facility?.id,
        facility_name: reservation.facility?.name,
        facility_address: reservation.facility?.address,
        provider_id: reservation.facility?.provider?.id || reservation.facility?.provider_id || parseInt(providerId, 10),
        provider_name: reservation.facility?.provider?.full_name || 'Chủ cơ sở bãi xe',
        provider_phone: reservation.facility?.provider?.phone_number || 'Chưa cập nhật',
        provider_email: reservation.facility?.provider?.email || ''
      },
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
      vehicle_info: {
        vehicle_info_raw: reservation.vehicle_info,
        vehicle_type: vehicleType || fallbackBrand || 'Phương tiện đăng ký đỗ',
        license_plate: licensePlate || fallbackPlate || reservation.vehicle_info
      },
      rental_info: {
        parking_spot: parkingSpot || 'Vị trí đỗ tự do trong bãi',
        amenities: reservation.facility.facility_amenities
          ? reservation.facility.facility_amenities.map((item) => item.amenity?.name).filter(Boolean)
          : [],
        agreed_price: agreedPrice,
        payment_deadline_day: paymentDeadlineDay || 5
      },
      terms_and_conditions: {
        customer_obligations: terms?.customer_obligations || DEFAULT_CONTRACT_TERMS.customer_obligations,
        owner_obligations: terms?.owner_obligations || DEFAULT_CONTRACT_TERMS.owner_obligations,
        termination_conditions: terms?.termination_conditions || DEFAULT_CONTRACT_TERMS.termination_conditions,
        dispute_resolution: terms?.dispute_resolution || DEFAULT_CONTRACT_TERMS.dispute_resolution
      },
      confirmation: {
        provider_agreed_at: new Date(),
        customer_agreed_at: null,
        is_agreed: false
      }
    };

    return await confirmationRecordRepository.create({
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
  }

  async getCustomerConfirmationRecords(customerId) {
    return await confirmationRecordRepository.findByCustomerId(customerId);
  }

  async getProviderConfirmationRecords(providerId) {
    return await confirmationRecordRepository.findByProviderId(providerId);
  }

  async getConfirmationRecordDetail(recordId, userId, userRole) {
    const record = await confirmationRecordRepository.findById(recordId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin biên bản xác nhận điện tử!', 404);
    }

    const isCustomerOwner = Number(record.reservation.customer_id) === Number(userId);
    const isFacilityProvider = Number(record.reservation.facility.provider_id) === Number(userId);
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomerOwner && !isFacilityProvider && !isAdmin) {
      throw this.createError('Bạn không có quyền xem thông tin biên bản xác nhận điện tử này!', 403);
    }

    if (record.contract_snapshot && record.contract_snapshot.customer_info) {
      const custInfo = record.contract_snapshot.customer_info;
      const { idCard, address } = this.extractVehicleMetadata(record.reservation?.vehicle_info);

      if ((!custInfo.customer_id_card || custInfo.customer_id_card === 'Chưa cập nhật') && idCard) {
        custInfo.customer_id_card = idCard;
      }
      if (!custInfo.customer_address || custInfo.customer_address === 'Chưa cập nhật') {
        if (address) {
          custInfo.customer_address = address;
        } else if (record.reservation?.customer?.address) {
          custInfo.customer_address = record.reservation.customer.address;
        }
      }
    }

    return record;
  }

  async acceptConfirmationRecord(recordId, customerId, customerData = {}) {
    const record = await confirmationRecordRepository.findById(recordId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin biên bản xác nhận điện tử!', 404);
    }

    if (Number(record.reservation.customer_id) !== Number(customerId)) {
      throw this.createError('Bạn không phải người sở hữu yêu cầu thuê để chấp nhận biên bản này!', 403);
    }

    if (record.status !== 'PENDING_SIGNATURE') {
      throw this.createError(`Biên bản xác nhận này đã được xử lý hoặc đang ở trạng thái (${record.status})!`, 400);
    }

    const isRenewalContract = Boolean(
      record.contract_snapshot?.contract_info?.is_renewal_contract ||
      record.contract_snapshot?.contract_info?.renewed_from_contract_id
    );
    const facilityId = record.reservation?.facility_id || record.reservation?.facility?.id;
    let facility = null;
    if (facilityId) {
      facility = await facilityRepository.findById(facilityId);
      if (!isRenewalContract && facility && Number(facility.available_slots) <= 0) {
        await reservationRepository.updateStatus(record.reservation_id, 'CANCELLED');
        await confirmationRecordRepository.updateStatusAndSnapshot(recordId, 'CANCELLED', record.contract_snapshot);
        throw this.createError(
          'Rất tiếc, chỗ trống cuối cùng tại bãi đỗ xe vừa được hoàn tất ký hợp đồng với khách hàng khác! Yêu cầu đặt chỗ của bạn đã tự động hủy.',
          400
        );
      }
    }

    const now = new Date();
    const currentSnapshot = record.contract_snapshot || {};
    const { idCard: parsedIdCard, address: parsedAddress } = this.extractVehicleMetadata(record.reservation?.vehicle_info);

    const existingCust = currentSnapshot.customer_info || {};
    const finalIdCard =
      customerData.customerIdCard && customerData.customerIdCard !== 'Chưa cập nhật' && customerData.customerIdCard.trim() !== ''
        ? customerData.customerIdCard.trim()
        : (existingCust.customer_id_card && existingCust.customer_id_card !== 'Chưa cập nhật' && existingCust.customer_id_card.trim() !== ''
          ? existingCust.customer_id_card
          : (parsedIdCard || existingCust.customer_id_card || 'Chưa cập nhật'));

    const finalAddress =
      customerData.customerAddress && customerData.customerAddress !== 'Chưa cập nhật' && customerData.customerAddress.trim() !== ''
        ? customerData.customerAddress.trim()
        : (existingCust.customer_address && existingCust.customer_address !== 'Chưa cập nhật' && existingCust.customer_address.trim() !== ''
          ? existingCust.customer_address
          : (parsedAddress || record.reservation?.customer?.address || existingCust.customer_address || 'Chưa cập nhật'));

    const updatedSnapshot = {
      ...currentSnapshot,
      customer_info: {
        ...existingCust,
        customer_id_card: finalIdCard,
        customer_address: finalAddress
      },
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

    try {
      if (!isRenewalContract && facility && facility.available_slots > 0) {
        const remainingSlots = Math.max(0, facility.available_slots - 1);
        await facilityRepository.update(facilityId, {
          available_slots: remainingSlots
        });

        if (remainingSlots === 0) {
          const cancelledReservations = await reservationRepository.cancelRemainingReservationsWhenFull(
            facilityId,
            record.reservation_id
          );

          if (cancelledReservations.length > 0) {
            const io = getIO();

            for (const cancelledRes of cancelledReservations) {
              const targetCustId = cancelledRes.customer_id || cancelledRes.customer?.id;
              if (targetCustId) {
                const notiTitle = `Tự động hủy yêu cầu đặt chỗ tại ${facility.name}`;
                const notiContent = `Yêu cầu đặt chỗ của bạn tại ${facility.name} đã tự động hủy do chỗ trống cuối cùng vừa được chủ bãi và khách hàng khác hoàn tất ký hợp đồng.`;

                await notificationRepository.createNotification({
                  user_id: Number(targetCustId),
                  title: notiTitle,
                  content: notiContent,
                  type: 'RESERVATION_AUTO_CANCELLED'
                });

                if (io) {
                  io.to(`user_${targetCustId}`).emit('new_notification', {
                    id: `noti_${Date.now()}_${targetCustId}`,
                    title: notiTitle,
                    content: notiContent,
                    type: 'RESERVATION_AUTO_CANCELLED',
                    reservation_id: cancelledRes.id,
                    facility_id: facilityId,
                    created_at: new Date().toISOString()
                  });
                }
              }
            }
          }
        }
      }
    } catch (slotErr) {
      console.error(slotErr.message);
    }

    return updatedRecord;
  }

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

    const formattedRecords = result.records.map((record) => {
      const snapshot = record.contract_snapshot || {};
      const custInfo = snapshot.customer_info || {};
      const vehInfo = snapshot.vehicle_info || {};
      const rentInfo = snapshot.rental_info || {};
      const rawVeh = record.reservation?.vehicle_info || '';
      const { idCard: parsedIdCard, address: parsedAddress } = this.extractVehicleMetadata(rawVeh);

      const finalIdCard =
        custInfo.customer_id_card && custInfo.customer_id_card !== 'Chưa cập nhật'
          ? custInfo.customer_id_card
          : (parsedIdCard || 'Chưa cập nhật');

      const finalAddress =
        custInfo.customer_address && custInfo.customer_address !== 'Chưa cập nhật'
          ? custInfo.customer_address
          : (parsedAddress || 'Chưa cập nhật');

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

  async getActiveCustomersAtFacility({
    providerId,
    facilityId = null,
    search = '',
    page = 1,
    limit = 20
  }) {
    let targetFacility = null;

    if (facilityId) {
      targetFacility = await facilityRepository.findById(parseInt(facilityId, 10));
      if (!targetFacility) {
        throw this.createError('Không tìm thấy thông tin cơ sở bãi đỗ xe!', 404);
      }
      if (Number(targetFacility.provider_id) !== Number(providerId)) {
        throw this.createError('Bạn không có quyền quản lý cơ sở bãi đỗ xe này!', 403);
      }
    } else {
      targetFacility = await facilityRepository.getFacilityByProviderId(parseInt(providerId, 10));
    }

    const result = await confirmationRecordRepository.findActiveCustomersByFacility({
      providerId,
      facilityId: targetFacility ? targetFacility.id : null,
      search,
      page,
      limit
    });

    const now = new Date();

    const activeCustomers = result.records.map((record) => {
      const snapshot = record.contract_snapshot || {};
      const custInfo = snapshot.customer_info || {};
      const vehInfo = snapshot.vehicle_info || {};
      const rentInfo = snapshot.rental_info || {};
      const rawVeh = record.reservation?.vehicle_info || '';
      const { idCard: parsedIdCard, address: parsedAddress } = this.extractVehicleMetadata(rawVeh);

      const finalIdCard =
        custInfo.customer_id_card && custInfo.customer_id_card !== 'Chưa cập nhật'
          ? custInfo.customer_id_card
          : (parsedIdCard || 'Chưa cập nhật');

      const finalAddress =
        custInfo.customer_address && custInfo.customer_address !== 'Chưa cập nhật'
          ? custInfo.customer_address
          : (parsedAddress || 'Chưa cập nhật');

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

  async requestLeaseExtension({
    contractId,
    customerId,
    extensionMonths,
    newEndDate,
    reason,
    vehicleType,
    licensePlate,
    customerAddress,
    customerPhone
  }) {
    const record = await confirmationRecordRepository.findById(contractId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin hợp đồng thuê bãi xe!', 404);
    }

    if (Number(record.reservation.customer_id) !== Number(customerId)) {
      throw this.createError('Bạn không có quyền yêu cầu gia hạn cho hợp đồng này!', 403);
    }

    if (record.status !== 'ACTIVE') {
      const statusLabel = record.status === 'TERMINATED' ? 'Đã chấm dứt' : record.status === 'PENDING_SIGNATURE' ? 'Chờ xác nhận' : record.status;
      throw this.createError(`Chỉ có thể yêu cầu gia hạn đối với hợp đồng đang có hiệu lực (Trạng thái hiện tại: ${statusLabel})!`, 400);
    }

    const currentSnapshot = record.contract_snapshot || {};
    if (currentSnapshot.extension_request && currentSnapshot.extension_request.status === 'PENDING') {
      throw this.createError('Hợp đồng này đang có một yêu cầu gia hạn đang chờ chủ bãi phê duyệt! Vui lòng không gửi yêu cầu lặp lại.', 400);
    }

    const currentEndDate = new Date(record.end_date);
    let finalMonths = extensionMonths ? Number(extensionMonths) : null;
    let finalNewEndDate = null;

    if (finalMonths) {
      const targetDate = new Date(currentEndDate);
      targetDate.setMonth(targetDate.getMonth() + finalMonths);
      finalNewEndDate = targetDate;
    }

    if (newEndDate) {
      const parsedNewEnd = new Date(newEndDate);
      if (parsedNewEnd <= currentEndDate) {
        throw this.createError('Ngày kết thúc mới mong muốn phải diễn ra sau ngày kết thúc hiện tại của hợp đồng!', 400);
      }
      finalNewEndDate = parsedNewEnd;
      if (!finalMonths) {
        const diffDays = Math.ceil((parsedNewEnd.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24));
        finalMonths = Math.max(1, Math.round(diffDays / 30));
      }
    }

    const currentFacilityPrice = Number(record.reservation?.facility?.price_per_month || record.agreed_price || 0);
    const estimatedTotalAmount = currentFacilityPrice * (finalMonths || 1);

    const currentVeh = currentSnapshot.vehicle_info || {};
    const currentCust = currentSnapshot.customer_info || {};

    const hasNewVehicleType = vehicleType && vehicleType.trim() !== '' && vehicleType.trim() !== currentVeh.vehicle_type;
    const hasNewLicensePlate = licensePlate && licensePlate.trim() !== '' && licensePlate.trim() !== currentVeh.license_plate;
    const isVehicleChanged = Boolean(hasNewVehicleType || hasNewLicensePlate);

    const targetVehicleType = vehicleType && vehicleType.trim() !== ''
      ? vehicleType.trim()
      : (currentVeh.vehicle_type || 'Phương tiện đăng ký đỗ');

    const targetLicensePlate = licensePlate && licensePlate.trim() !== ''
      ? licensePlate.trim()
      : (currentVeh.license_plate || record.reservation?.vehicle_info || 'Chưa cập nhật');

    const hasNewAddress = customerAddress && customerAddress.trim() !== '' && customerAddress.trim() !== currentCust.customer_address;
    const hasNewPhone = customerPhone && customerPhone.trim() !== '' && customerPhone.trim() !== currentCust.customer_phone;
    const isCustomerInfoChanged = Boolean(hasNewAddress || hasNewPhone);

    const targetAddress = customerAddress && customerAddress.trim() !== ''
      ? customerAddress.trim()
      : (currentCust.customer_address || 'Chưa cập nhật');

    const targetPhone = customerPhone && customerPhone.trim() !== ''
      ? customerPhone.trim()
      : (currentCust.customer_phone || record.reservation?.customer?.phone_number);

    const extensionRequestId = `EXT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const extensionRequestData = {
      request_id: extensionRequestId,
      status: 'PENDING',
      extension_months: finalMonths,
      current_end_date: record.end_date,
      requested_end_date: finalNewEndDate ? finalNewEndDate.toISOString().slice(0, 10) : null,
      monthly_price: currentFacilityPrice,
      total_estimated_amount: estimatedTotalAmount,
      reason: reason && reason.trim() ? reason.trim() : 'Khách hàng có nhu cầu tiếp tục thuê đỗ xe theo tháng',
      vehicle_info: {
        is_changed: isVehicleChanged,
        vehicle_type: targetVehicleType,
        license_plate: targetLicensePlate,
        previous_vehicle_type: currentVeh.vehicle_type || null,
        previous_license_plate: currentVeh.license_plate || null
      },
      customer_info: {
        is_changed: isCustomerInfoChanged,
        customer_address: targetAddress,
        customer_phone: targetPhone,
        previous_address: currentCust.customer_address || null,
        previous_phone: currentCust.customer_phone || null
      },
      requested_at: new Date().toISOString(),
      responded_at: null,
      provider_note: null
    };

    const updatedSnapshot = {
      ...currentSnapshot,
      extension_request: extensionRequestData
    };

    const updatedRecord = await confirmationRecordRepository.updateSnapshotAndEndDate(
      contractId,
      updatedSnapshot
    );

    const providerId = record.reservation?.facility?.provider_id || record.reservation?.facility?.provider?.id;
    const customerName = record.reservation?.customer?.full_name || 'Khách hàng';
    const facilityName = record.reservation?.facility?.name || 'bãi xe';

    if (providerId) {
      try {
        let changeNote = '';
        if (isVehicleChanged) {
          changeNote = ` (Đăng ký xe mới: ${targetLicensePlate} - ${targetVehicleType})`;
        }

        const notiTitle = `Yêu cầu gia hạn hợp đồng (${record.contract_code})`;
        const notiContent = `Khách hàng ${customerName} vừa gửi yêu cầu gia hạn hợp đồng ${record.contract_code} tại ${facilityName} thêm ${finalMonths} tháng${changeNote}.`;

        await notificationRepository.createNotification({
          user_id: Number(providerId),
          title: notiTitle,
          content: notiContent,
          type: 'LEASE_EXTENSION'
        });

        const io = getIO();
        if (io) {
          io.to(`user_${providerId}`).emit('new_notification', {
            id: `noti_${Date.now()}`,
            title: notiTitle,
            content: notiContent,
            type: 'LEASE_EXTENSION',
            contract_id: record.id,
            contract_code: record.contract_code,
            is_vehicle_changed: isVehicleChanged,
            created_at: new Date().toISOString()
          });
        }
      } catch (notiErr) {
        console.error(notiErr.message);
      }
    }

    return {
      confirmation_record: updatedRecord,
      extension_request: extensionRequestData
    };
  }

  async getLeaseExtensionDetail(contractId, userId, userRole) {
    const record = await confirmationRecordRepository.findById(contractId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin hợp đồng thuê bãi xe!', 404);
    }

    const isCustomerOwner = Number(record.reservation.customer_id) === Number(userId);
    const isFacilityProvider = Number(record.reservation.facility.provider_id) === Number(userId);
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomerOwner && !isFacilityProvider && !isAdmin) {
      throw this.createError('Bạn không có quyền xem thông tin gia hạn của hợp đồng này!', 403);
    }

    const snapshot = record.contract_snapshot || {};
    return {
      contract_id: record.id,
      contract_code: record.contract_code,
      current_end_date: record.end_date,
      extension_request: snapshot.extension_request || null,
      extension_history: snapshot.extension_history || []
    };
  }

  async cancelLeaseExtension(contractId, customerId) {
    const record = await confirmationRecordRepository.findById(contractId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin hợp đồng thuê bãi xe!', 404);
    }

    if (Number(record.reservation.customer_id) !== Number(customerId)) {
      throw this.createError('Bạn không có quyền hủy yêu cầu gia hạn của hợp đồng này!', 403);
    }

    const snapshot = record.contract_snapshot || {};
    const ext = snapshot.extension_request;

    if (!ext || ext.status !== 'PENDING') {
      throw this.createError('Không có yêu cầu gia hạn nào đang chờ duyệt để hủy!', 400);
    }

    const cancelledExt = {
      ...ext,
      status: 'CANCELLED',
      responded_at: new Date().toISOString()
    };

    const history = Array.isArray(snapshot.extension_history) ? [...snapshot.extension_history] : [];
    history.push(cancelledExt);

    const updatedSnapshot = {
      ...snapshot,
      extension_request: null,
      extension_history: history
    };

    const updatedRecord = await confirmationRecordRepository.updateSnapshotAndEndDate(
      contractId,
      updatedSnapshot
    );

    return {
      confirmation_record: updatedRecord,
      cancelled_extension: cancelledExt
    };
  }

  async respondToLeaseExtension({ contractId, providerId, status, providerNote }) {
    const record = await confirmationRecordRepository.findById(contractId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin hợp đồng thuê bãi xe!', 404);
    }

    if (Number(record.reservation.facility.provider_id) !== Number(providerId)) {
      throw this.createError('Bạn không có quyền phản hồi yêu cầu gia hạn của bãi xe này!', 403);
    }

    const snapshot = record.contract_snapshot || {};
    const ext = snapshot.extension_request;

    if (!ext || ext.status !== 'PENDING') {
      throw this.createError('Không có yêu cầu gia hạn nào đang chờ phản hồi cho hợp đồng này!', 400);
    }

    const now = new Date();
    const isApproved = status.toUpperCase() === 'APPROVED';

    let newContractRecord = null;
    const latestFacility = record.reservation?.facility?.id
      ? await facilityRepository.findById(record.reservation.facility.id)
      : record.reservation?.facility;

    const currentFacilityPrice = Number(
      latestFacility?.price_per_month ||
      record.reservation?.facility?.price_per_month ||
      ext.monthly_price ||
      record.agreed_price ||
      0
    );

    if (isApproved) {
      const newContractCode = `HD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newStartDate = record.end_date ? new Date(record.end_date) : new Date();
      const newEndDate = ext.requested_end_date
        ? new Date(ext.requested_end_date)
        : new Date(new Date(newStartDate).setMonth(newStartDate.getMonth() + Number(ext.extension_months || 1)));

      const oldVeh = snapshot.vehicle_info || {};
      const oldCust = snapshot.customer_info || {};
      const oldOwner = snapshot.owner_info || {};
      const oldRental = snapshot.rental_info || {};
      const oldTerms = snapshot.terms_and_conditions || {};

      const finalVehicleType = ext.vehicle_info?.is_changed && ext.vehicle_info?.vehicle_type
        ? ext.vehicle_info.vehicle_type
        : (oldVeh.vehicle_type || 'Phương tiện đăng ký đỗ');
      const finalLicensePlate = ext.vehicle_info?.is_changed && ext.vehicle_info?.license_plate
        ? ext.vehicle_info.license_plate
        : (oldVeh.license_plate || record.reservation?.vehicle_info || 'Chưa cập nhật');

      const finalCustomerAddress = ext.customer_info?.is_changed && ext.customer_info?.customer_address
        ? ext.customer_info.customer_address
        : (oldCust.customer_address || record.reservation?.customer?.address || 'Chưa cập nhật');
      const finalCustomerPhone = ext.customer_info?.is_changed && ext.customer_info?.customer_phone
        ? ext.customer_info.customer_phone
        : (oldCust.customer_phone || record.reservation?.customer?.phone_number || 'Chưa cập nhật');
      const finalCustomerIdCard = oldCust.customer_id_card || 'Chưa cập nhật';

      const newVehicleInfoString = `${finalVehicleType} - Biển số: ${finalLicensePlate} [CCCD: ${finalCustomerIdCard} | ĐC: ${finalCustomerAddress}]`;

      const renewalReservation = await reservationRepository.createReservation({
        customer_id: record.reservation.customer_id,
        facility_id: record.reservation.facility_id || record.reservation.facility.id,
        vehicle_info: newVehicleInfoString,
        desired_start_date: newStartDate
      });
      await reservationRepository.updateStatus(renewalReservation.id, 'APPROVED');

      const newContractSnapshot = {
        contract_info: {
          contract_code: newContractCode,
          issue_date: now,
          start_date: newStartDate.toISOString().slice(0, 10),
          end_date: newEndDate.toISOString().slice(0, 10),
          is_renewal_contract: true,
          renewed_from_contract_id: record.id,
          renewed_from_contract_code: record.contract_code
        },
        owner_info: {
          ...oldOwner,
          facility_id: record.reservation?.facility?.id || oldOwner.facility_id,
          facility_name: record.reservation?.facility?.name || oldOwner.facility_name,
          facility_address: record.reservation?.facility?.address || oldOwner.facility_address
        },
        customer_info: {
          ...oldCust,
          customer_id: record.reservation?.customer?.id || oldCust.customer_id,
          customer_name: record.reservation?.customer?.full_name || oldCust.customer_name,
          customer_email: record.reservation?.customer?.email || oldCust.customer_email,
          customer_phone: finalCustomerPhone,
          customer_address: finalCustomerAddress,
          customer_id_card: finalCustomerIdCard
        },
        vehicle_info: {
          vehicle_info_raw: newVehicleInfoString,
          vehicle_type: finalVehicleType,
          license_plate: finalLicensePlate
        },
        rental_info: {
          ...oldRental,
          parking_spot: oldRental.parking_spot || 'Vị trí đỗ tự do trong bãi',
          agreed_price: currentFacilityPrice,
          payment_deadline_day: record.payment_deadline_day || oldRental.payment_deadline_day || 5
        },
        terms_and_conditions: {
          ...oldTerms
        },
        confirmation: {
          provider_agreed_at: now,
          customer_agreed_at: null,
          is_agreed: false
        }
      };

      newContractRecord = await confirmationRecordRepository.create({
        contract_code: newContractCode,
        reservation_id: renewalReservation.id,
        parent_contract_id: record.id,
        agreed_price: currentFacilityPrice,
        payment_deadline_day: record.payment_deadline_day || 5,
        start_date: newStartDate,
        end_date: newEndDate,
        contract_snapshot: newContractSnapshot,
        provider_agreed_at: now,
        status: 'PENDING_SIGNATURE'
      });
    }

    const processedExt = {
      ...ext,
      status: isApproved ? 'APPROVED' : 'REJECTED',
      monthly_price: currentFacilityPrice,
      total_estimated_amount: currentFacilityPrice * Number(ext.extension_months || 1),
      new_contract_id: newContractRecord ? newContractRecord.id : null,
      new_contract_code: newContractRecord ? newContractRecord.contract_code : null,
      responded_at: now.toISOString(),
      provider_note: providerNote ? providerNote.trim() : null
    };

    const history = Array.isArray(snapshot.extension_history) ? [...snapshot.extension_history] : [];
    history.push(processedExt);

    const updatedSnapshot = {
      ...snapshot,
      extension_request: isApproved ? processedExt : null,
      extension_history: history
    };

    const updatedRecord = await confirmationRecordRepository.updateSnapshotAndEndDate(
      contractId,
      updatedSnapshot,
      null
    );

    const customerId = record.reservation?.customer_id;
    if (customerId) {
      try {
        const notiTitle = isApproved
          ? `Đã tạo hợp đồng gia hạn mới (${newContractRecord?.contract_code}) từ ${record.contract_code}!`
          : `Yêu cầu gia hạn hợp đồng (${record.contract_code}) đã bị từ chối`;
        const notiContent = isApproved
          ? `Chủ bãi đã chấp thuận gia hạn và khởi tạo hợp đồng mới ${newContractRecord?.contract_code} (Thời hạn: đến ${ext.requested_end_date}, Giá hiện tại: ${currentFacilityPrice.toLocaleString('vi-VN')} đ/tháng). Vui lòng vào xem và ký xác nhận hợp đồng mới!`
          : `Chủ bãi đã từ chối yêu cầu gia hạn hợp đồng ${record.contract_code}.${providerNote ? ` Lý do: ${providerNote}` : ''}`;

        await notificationRepository.createNotification({
          user_id: Number(customerId),
          title: notiTitle,
          content: notiContent,
          type: 'LEASE_EXTENSION'
        });

        const io = getIO();
        if (io) {
          io.to(`user_${customerId}`).emit('new_notification', {
            id: `noti_${Date.now()}`,
            title: notiTitle,
            content: notiContent,
            type: 'LEASE_EXTENSION',
            contract_id: newContractRecord ? newContractRecord.id : record.id,
            status: processedExt.status,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(err.message);
      }
    }

    return {
      confirmation_record: updatedRecord,
      new_confirmation_record: newContractRecord,
      extension_result: processedExt
    };
  }

  async getMyLeaseExtensions(customerId) {
    return await confirmationRecordRepository.findExtensionRequestsByCustomerId(customerId);
  }

  async getProviderLeaseExtensions(providerId) {
    return await confirmationRecordRepository.findExtensionRequestsByProviderId(providerId);
  }

  async requestEarlyTermination({
    contractId,
    userId,
    userRole,
    customerId,
    terminationDate,
    reason,
    bankAccountInfo,
    refundAmount,
    providerNote
  }) {
    const finalUserId = parseInt(userId || customerId, 10);
    const finalRole = userRole ? userRole.toUpperCase() : 'CUSTOMER';

    const record = await confirmationRecordRepository.findById(contractId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin hợp đồng thuê bãi xe!', 404);
    }

    const providerId = record.reservation?.facility?.provider_id || record.reservation?.facility?.provider?.id;
    const targetCustomerId = record.reservation?.customer_id;

    if (finalRole === 'CUSTOMER') {
      if (Number(targetCustomerId) !== finalUserId) {
        throw this.createError('Bạn không có quyền yêu cầu chấm dứt hợp đồng này!', 403);
      }
    } else if (finalRole === 'PROVIDER') {
      if (Number(providerId) !== finalUserId) {
        throw this.createError('Bạn không có quyền yêu cầu chấm dứt hợp đồng tại bãi xe này!', 403);
      }
    } else {
      throw this.createError('Vai trò người dùng không hợp lệ để yêu cầu chấm dứt hợp đồng!', 403);
    }

    if (record.status !== 'ACTIVE') {
      const statusLabel = record.status === 'TERMINATED' ? 'Đã chấm dứt' : record.status === 'PENDING_SIGNATURE' ? 'Chờ xác nhận' : record.status;
      throw this.createError(`Chỉ có thể yêu cầu chấm dứt đối với hợp đồng đang có hiệu lực (Trạng thái hiện tại: ${statusLabel})!`, 400);
    }

    const currentSnapshot = record.contract_snapshot || {};
    if (currentSnapshot.termination_request && currentSnapshot.termination_request.status === 'PENDING') {
      const existingRequestedBy = currentSnapshot.termination_request.requested_by || 'CUSTOMER';
      const errorMsg = existingRequestedBy === finalRole
        ? 'Bạn đã gửi một yêu cầu chấm dứt trước hạn đang chờ xử lý! Vui lòng không gửi lặp lại.'
        : 'Hợp đồng này đang có một yêu cầu chấm dứt trước hạn đang chờ bạn xác nhận!';
      throw this.createError(errorMsg, 400);
    }

    const finalTerminationDate = terminationDate ? new Date(terminationDate) : new Date();
    if (isNaN(finalTerminationDate.getTime())) {
      throw this.createError('Ngày mong muốn chấm dứt hợp đồng không hợp lệ!', 400);
    }

    const terminationRequestId = `TERM-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const terminationRequestData = {
      request_id: terminationRequestId,
      status: 'PENDING',
      requested_by: finalRole,
      requested_termination_date: finalTerminationDate.toISOString().slice(0, 10),
      reason: reason.trim(),
      bank_account_info: bankAccountInfo ? bankAccountInfo.trim() : null,
      refund_amount: refundAmount !== undefined && refundAmount !== null ? Number(refundAmount) : null,
      provider_note: providerNote ? providerNote.trim() : null,
      requested_at: new Date().toISOString(),
      responded_at: null
    };

    const updatedSnapshot = {
      ...currentSnapshot,
      termination_request: terminationRequestData
    };

    const updatedRecord = await confirmationRecordRepository.updateStatusAndSnapshot(
      contractId,
      null,
      updatedSnapshot
    );

    const customerName = record.reservation?.customer?.full_name || 'Khách hàng';
    const facilityName = record.reservation?.facility?.name || 'bãi xe';
    const dateFormatted = finalTerminationDate.toLocaleDateString('vi-VN');

    if (finalRole === 'CUSTOMER' && providerId) {
      try {
        const notiTitle = `Yêu cầu trả chỗ trước hạn (${record.contract_code})`;
        const notiContent = `Khách hàng ${customerName} vừa gửi yêu cầu chấm dứt hợp đồng ${record.contract_code} tại ${facilityName} (Ngày trả chỗ dự kiến: ${dateFormatted}). Lý do: ${reason.trim()}`;

        await notificationRepository.createNotification({
          user_id: Number(providerId),
          title: notiTitle,
          content: notiContent,
          type: 'CONTRACT_TERMINATION'
        });

        const io = getIO();
        if (io) {
          io.to(`user_${providerId}`).emit('new_notification', {
            id: `noti_${Date.now()}`,
            title: notiTitle,
            content: notiContent,
            type: 'CONTRACT_TERMINATION',
            contract_id: record.id,
            contract_code: record.contract_code,
            created_at: new Date().toISOString()
          });
        }
      } catch (notiErr) {
        console.error(notiErr.message);
      }
    } else if (finalRole === 'PROVIDER' && targetCustomerId) {
      try {
        const notiTitle = `Thông báo yêu cầu chấm dứt hợp đồng (${record.contract_code})`;
        const notiContent = `Chủ bãi xe tại ${facilityName} đã gửi yêu cầu chấm dứt hợp đồng ${record.contract_code} trước thời hạn (Ngày dự kiến dừng gửi: ${dateFormatted}). Lý do: ${reason.trim()}`;

        await notificationRepository.createNotification({
          user_id: Number(targetCustomerId),
          title: notiTitle,
          content: notiContent,
          type: 'CONTRACT_TERMINATION'
        });

        const io = getIO();
        if (io) {
          io.to(`user_${targetCustomerId}`).emit('new_notification', {
            id: `noti_${Date.now()}`,
            title: notiTitle,
            content: notiContent,
            type: 'CONTRACT_TERMINATION',
            contract_id: record.id,
            contract_code: record.contract_code,
            created_at: new Date().toISOString()
          });
        }
      } catch (notiErr) {
        console.error(notiErr.message);
      }
    }

    return {
      confirmation_record: updatedRecord,
      termination_request: terminationRequestData
    };
  }

  async cancelEarlyTermination(contractId, userId, userRole = 'CUSTOMER') {
    const finalUserId = parseInt(userId, 10);
    const finalRole = userRole ? userRole.toUpperCase() : 'CUSTOMER';

    const record = await confirmationRecordRepository.findById(contractId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin hợp đồng thuê bãi xe!', 404);
    }

    const snapshot = record.contract_snapshot || {};
    const term = snapshot.termination_request;

    if (!term || term.status !== 'PENDING') {
      throw this.createError('Không có yêu cầu chấm dứt hợp đồng nào đang chờ xử lý để hủy!', 400);
    }

    const requestedBy = term.requested_by || 'CUSTOMER';
    const providerId = record.reservation?.facility?.provider_id || record.reservation?.facility?.provider?.id;
    const customerId = record.reservation?.customer_id;

    if (finalRole === 'CUSTOMER') {
      if (Number(customerId) !== finalUserId || requestedBy !== 'CUSTOMER') {
        throw this.createError('Bạn không có quyền hủy yêu cầu chấm dứt này!', 403);
      }
    } else if (finalRole === 'PROVIDER') {
      if (Number(providerId) !== finalUserId || requestedBy !== 'PROVIDER') {
        throw this.createError('Bạn không có quyền hủy yêu cầu chấm dứt này!', 403);
      }
    }

    const cancelledTerm = {
      ...term,
      status: 'CANCELLED',
      responded_at: new Date().toISOString()
    };

    const history = Array.isArray(snapshot.termination_history) ? [...snapshot.termination_history] : [];
    history.push(cancelledTerm);

    const updatedSnapshot = {
      ...snapshot,
      termination_request: null,
      termination_history: history
    };

    const updatedRecord = await confirmationRecordRepository.updateStatusAndSnapshot(
      contractId,
      null,
      updatedSnapshot
    );

    return {
      confirmation_record: updatedRecord,
      cancelled_termination: cancelledTerm
    };
  }

  async confirmContractTermination({
    contractId,
    userId,
    userRole = 'PROVIDER',
    providerId,
    status = 'CONFIRMED',
    providerNote = '',
    refundAmount = null
  }) {
    const finalUserId = parseInt(userId || providerId, 10);
    const finalRole = userRole ? userRole.toUpperCase() : 'PROVIDER';

    const record = await confirmationRecordRepository.findById(contractId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin hợp đồng thuê bãi xe!', 404);
    }

    const facilityProviderId = record.reservation?.facility?.provider_id || record.reservation?.facility?.provider?.id;
    const targetCustomerId = record.reservation?.customer_id;

    if (finalRole === 'PROVIDER') {
      if (Number(facilityProviderId) !== finalUserId) {
        throw this.createError('Bạn không có quyền xác nhận chấm dứt hợp đồng tại bãi xe này!', 403);
      }
    } else if (finalRole === 'CUSTOMER') {
      if (Number(targetCustomerId) !== finalUserId) {
        throw this.createError('Bạn không có quyền xác nhận chấm dứt hợp đồng này!', 403);
      }
    }

    if (record.status !== 'ACTIVE') {
      const statusLabel = record.status === 'TERMINATED' ? 'Đã chấm dứt' : record.status === 'PENDING_SIGNATURE' ? 'Chờ xác nhận' : record.status;
      throw this.createError(`Không thể chấm dứt hợp đồng ở trạng thái hiện tại (${statusLabel})!`, 400);
    }

    const snapshot = record.contract_snapshot || {};
    const term = snapshot.termination_request || {};
    const now = new Date();
    const isConfirmed = status.toUpperCase() === 'CONFIRMED' || status.toUpperCase() === 'APPROVED';

    const processedTerm = {
      ...term,
      status: isConfirmed ? 'CONFIRMED' : 'REJECTED',
      confirmed_by: finalRole,
      responded_at: now.toISOString(),
      actual_termination_date: isConfirmed ? now.toISOString().slice(0, 10) : null,
      provider_note: providerNote ? providerNote.trim() : (term.provider_note || null),
      refund_amount: refundAmount !== null && refundAmount !== undefined ? Number(refundAmount) : (term.refund_amount || null)
    };

    const history = Array.isArray(snapshot.termination_history) ? [...snapshot.termination_history] : [];
    history.push(processedTerm);

    const updatedSnapshot = {
      ...snapshot,
      termination_request: isConfirmed ? processedTerm : null,
      termination_history: history
    };

    if (isConfirmed && updatedSnapshot.contract_info) {
      updatedSnapshot.contract_info = {
        ...updatedSnapshot.contract_info,
        status: 'TERMINATED',
        terminated_at: now.toISOString()
      };
    }

    const updatedRecord = await confirmationRecordRepository.updateStatusAndSnapshot(
      contractId,
      isConfirmed ? 'TERMINATED' : null,
      updatedSnapshot
    );

    if (isConfirmed) {
      try {
        const facilityId = record.reservation?.facility_id;
        if (facilityId) {
          const facility = await facilityRepository.findById(facilityId);
          if (facility && facility.available_slots < facility.capacity) {
            await facilityRepository.update(facilityId, {
              available_slots: facility.available_slots + 1
            });
          }
        }
      } catch (slotErr) {
        console.error(slotErr.message);
      }
    }

    try {
      const recipientId = finalRole === 'PROVIDER' ? targetCustomerId : facilityProviderId;
      if (recipientId) {
        const notiTitle = isConfirmed
          ? `Hợp đồng ${record.contract_code} đã hoàn tất chấm dứt`
          : `Yêu cầu chấm dứt hợp đồng ${record.contract_code} đã bị từ chối`;
        const notiContent = isConfirmed
          ? `${finalRole === 'PROVIDER' ? 'Chủ bãi xe' : 'Khách hàng'} đã xác nhận chấm dứt hợp đồng và vị trí đỗ xe đã được hoàn trả.${refundAmount ? ` Số tiền hoàn trả: ${Number(refundAmount).toLocaleString('vi-VN')} đ.` : ''}${providerNote ? ` Ghi chú: ${providerNote}` : ''}`
          : `Yêu cầu chấm dứt hợp đồng trước hạn đã bị từ chối.${providerNote ? ` Lý do: ${providerNote}` : ''}`;

        await notificationRepository.createNotification({
          user_id: Number(recipientId),
          title: notiTitle,
          content: notiContent,
          type: 'CONTRACT_TERMINATION'
        });

        const io = getIO();
        if (io) {
          io.to(`user_${recipientId}`).emit('new_notification', {
            id: `noti_${Date.now()}`,
            title: notiTitle,
            content: notiContent,
            type: 'CONTRACT_TERMINATION',
            contract_id: record.id,
            status: isConfirmed ? 'TERMINATED' : 'ACTIVE',
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error(err.message);
    }

    return {
      confirmation_record: updatedRecord,
      termination_result: processedTerm
    };
  }

  async getContractTerminationDetail(contractId, userId, userRole) {
    const record = await confirmationRecordRepository.findById(contractId);
    if (!record) {
      throw this.createError('Không tìm thấy thông tin hợp đồng thuê bãi xe!', 404);
    }

    const isCustomerOwner = Number(record.reservation.customer_id) === Number(userId);
    const isFacilityProvider = Number(record.reservation.facility.provider_id) === Number(userId);
    const isAdmin = userRole === 'ADMIN';

    if (!isCustomerOwner && !isFacilityProvider && !isAdmin) {
      throw this.createError('Bạn không có quyền xem thông tin chấm dứt của hợp đồng này!', 403);
    }

    const snapshot = record.contract_snapshot || {};
    return {
      contract_id: record.id,
      contract_code: record.contract_code,
      status: record.status,
      end_date: record.end_date,
      termination_request: snapshot.termination_request || null,
      termination_history: snapshot.termination_history || []
    };
  }

  async getMyTerminationRequests(customerId) {
    return await confirmationRecordRepository.findTerminationRequestsByCustomerId(customerId);
  }

  async getProviderTerminationRequests(providerId) {
    return await confirmationRecordRepository.findTerminationRequestsByProviderId(providerId);
  }
}

module.exports = new ConfirmationRecordService();
