const reservationRepository = require('../repositories/reservationRepository');
const facilityRepository = require('../repositories/facilityRepository');
const confirmationRecordRepository = require('../repositories/confirmationRecordRepository');
const notificationRepository = require('../repositories/notificationRepository');
const timelineSettingService = require('./timelineSettingService');
const { getIO } = require('../config/socket');

class ReservationService {
  createError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  async checkAndCancelAllExpired() {
    try {
      const { calculated: timelines } = await timelineSettingService.getTimelineSettings();
      const io = getIO();

      const expiredPending = await reservationRepository.cancelExpiredPendingReservations(
        timelines.reservationResponseMs
      );
      for (const item of expiredPending) {
        const facilityName = item.facility?.name || 'bãi đỗ xe';
        const customerName = item.customer?.full_name || 'Khách hàng';

        if (item.customer_id) {
          const custTitle = `Yêu cầu đặt chỗ #${item.id} đã tự động hủy (Quá hạn phản hồi)`;
          const custContent = `Yêu cầu đặt chỗ của bạn tại ${facilityName} đã tự động hủy do chủ bãi không phản hồi trong vòng ${timelines.reservationResponseText}.`;
          await notificationRepository.createNotification({
            user_id: Number(item.customer_id),
            title: custTitle,
            content: custContent,
            type: 'RESERVATION_EXPIRED_RESPONSE'
          });
          if (io) {
            io.to(`user_${item.customer_id}`).emit('new_notification', {
              id: `noti_${Date.now()}_${item.customer_id}`,
              title: custTitle,
              content: custContent,
              type: 'RESERVATION_EXPIRED_RESPONSE',
              reservation_id: item.id,
              created_at: new Date().toISOString()
            });
          }
        }

        if (item.facility?.provider_id) {
          const provTitle = `Hết hạn phản hồi yêu cầu đặt chỗ #${item.id}`;
          const provContent = `Yêu cầu đặt chỗ #${item.id} của khách hàng ${customerName} tại ${facilityName} đã tự động hủy do quá thời hạn ${timelines.reservationResponseText} chưa được phản hồi.`;
          await notificationRepository.createNotification({
            user_id: Number(item.facility.provider_id),
            title: provTitle,
            content: provContent,
            type: 'RESERVATION_EXPIRED_RESPONSE'
          });
          if (io) {
            io.to(`user_${item.facility.provider_id}`).emit('new_notification', {
              id: `noti_${Date.now()}_${item.facility.provider_id}`,
              title: provTitle,
              content: provContent,
              type: 'RESERVATION_EXPIRED_RESPONSE',
              reservation_id: item.id,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      const expiredApproved = await reservationRepository.cancelExpiredApprovedReservations(
        timelines.contractCreationMs
      );
      for (const item of expiredApproved) {
        const facilityName = item.facility?.name || 'bãi đỗ xe';
        const customerName = item.customer?.full_name || 'Khách hàng';

        if (item.customer_id) {
          const custTitle = `Yêu cầu đặt chỗ #${item.id} đã tự động hủy (Quá hạn lập hợp đồng)`;
          const custContent = `Yêu cầu đặt chỗ của bạn tại ${facilityName} đã tự động hủy do quá thời hạn ${timelines.contractCreationText} kể từ khi được chấp nhận mà chủ bãi chưa hoàn tất lập hợp đồng điện tử.`;
          await notificationRepository.createNotification({
            user_id: Number(item.customer_id),
            title: custTitle,
            content: custContent,
            type: 'RESERVATION_EXPIRED_CREATION'
          });
          if (io) {
            io.to(`user_${item.customer_id}`).emit('new_notification', {
              id: `noti_${Date.now()}_${item.customer_id}`,
              title: custTitle,
              content: custContent,
              type: 'RESERVATION_EXPIRED_CREATION',
              reservation_id: item.id,
              created_at: new Date().toISOString()
            });
          }
        }

        if (item.facility?.provider_id) {
          const provTitle = `Hết hạn lập hợp đồng cho yêu cầu #${item.id}`;
          const provContent = `Yêu cầu đặt chỗ #${item.id} của khách hàng ${customerName} tại ${facilityName} đã tự động hủy do quá ${timelines.contractCreationText} chưa tạo hợp đồng điện tử.`;
          await notificationRepository.createNotification({
            user_id: Number(item.facility.provider_id),
            title: provTitle,
            content: provContent,
            type: 'RESERVATION_EXPIRED_CREATION'
          });
          if (io) {
            io.to(`user_${item.facility.provider_id}`).emit('new_notification', {
              id: `noti_${Date.now()}_${item.facility.provider_id}`,
              title: provTitle,
              content: provContent,
              type: 'RESERVATION_EXPIRED_CREATION',
              reservation_id: item.id,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      const expiredContracts = await reservationRepository.cancelExpiredPendingContracts(
        timelines.contractSigningMs
      );
      for (const contract of expiredContracts) {
        const facilityName = contract.reservation?.facility?.name || 'bãi đỗ xe';
        const customerName = contract.reservation?.customer?.full_name || 'Khách hàng';
        const customerId = contract.reservation?.customer_id;
        const providerId = contract.reservation?.facility?.provider_id;

        if (customerId) {
          const custTitle = `Hợp đồng ${contract.contract_code} đã tự động hủy (Quá hạn ký)`;
          const custContent = `Hợp đồng điện tử ${contract.contract_code} tại ${facilityName} đã tự động hủy do quá thời hạn ${timelines.contractSigningText} mà bạn chưa hoàn tất ký xác nhận.`;
          await notificationRepository.createNotification({
            user_id: Number(customerId),
            title: custTitle,
            content: custContent,
            type: 'CONTRACT_EXPIRED_SIGNATURE'
          });
          if (io) {
            io.to(`user_${customerId}`).emit('new_notification', {
              id: `noti_${Date.now()}_${customerId}`,
              title: custTitle,
              content: custContent,
              type: 'CONTRACT_EXPIRED_SIGNATURE',
              contract_id: contract.id,
              contract_code: contract.contract_code,
              created_at: new Date().toISOString()
            });
          }
        }

        if (providerId) {
          const provTitle = `Hợp đồng ${contract.contract_code} đã tự động hủy do khách không ký`;
          const provContent = `Hợp đồng điện tử ${contract.contract_code} của khách hàng ${customerName} tại ${facilityName} đã tự động hủy do quá thời hạn ${timelines.contractSigningText} khách hàng không ký xác nhận.`;
          await notificationRepository.createNotification({
            user_id: Number(providerId),
            title: provTitle,
            content: provContent,
            type: 'CONTRACT_EXPIRED_SIGNATURE'
          });
          if (io) {
            io.to(`user_${providerId}`).emit('new_notification', {
              id: `noti_${Date.now()}_${providerId}`,
              title: provTitle,
              content: provContent,
              type: 'CONTRACT_EXPIRED_SIGNATURE',
              contract_id: contract.id,
              contract_code: contract.contract_code,
              created_at: new Date().toISOString()
            });
          }
        }
      }
    } catch (err) {
      console.error('[CheckAllExpired] Error:', err.message);
    }
  }

  async checkAndCancelExpiredApproved() {
    return await this.checkAndCancelAllExpired();
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

    const activeReservation = await reservationRepository.findActiveReservationByCustomer(customerId);
    if (activeReservation) {
      const activeFacilityName = activeReservation.facility?.name || 'cơ sở bãi xe khác';
      throw this.createError(
        `Bạn đang có một yêu cầu thuê chỗ tại "${activeFacilityName}" đang trong quá trình xử lý! Mỗi khách hàng chỉ được gửi tối đa 1 yêu cầu thuê tại một thời điểm trên hệ thống. Vui lòng hoàn tất hoặc hủy yêu cầu hiện tại trước khi gửi yêu cầu mới.`,
        400
      );
    }

    const { calculated: timelines } = await timelineSettingService.getTimelineSettings();

    const newReservation = await reservationRepository.createReservation({
      customer_id: customerId,
      facility_id: facilityId,
      vehicle_info: vehicleInfo,
      desired_start_date: desiredStartDate
    });

    const providerId = facility.provider_id;
    const io = getIO();
    if (providerId) {
      const provTitle = `Yêu cầu đặt chỗ mới #${newReservation.id}`;
      const provContent = `Có khách hàng mới gửi yêu cầu thuê chỗ đỗ tại ${facility.name}. Bạn có ${timelines.reservationResponseText} để phản hồi duyệt hoặc từ chối.`;
      try {
        await notificationRepository.createNotification({
          user_id: Number(providerId),
          title: provTitle,
          content: provContent,
          type: 'RESERVATION_NEW'
        });
        if (io) {
          io.to(`user_${providerId}`).emit('new_notification', {
            id: `noti_${Date.now()}_${providerId}`,
            title: provTitle,
            content: provContent,
            type: 'RESERVATION_NEW',
            reservation_id: newReservation.id,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Lỗi gửi thông báo cho Provider khi tạo yêu cầu:', err.message);
      }
    }

    if (customerId) {
      const custTitle = `Đã gửi yêu cầu đặt chỗ #${newReservation.id}`;
      const custContent = `Yêu cầu thuê bãi xe tại ${facility.name} đã được gửi thành công. Chủ bãi có ${timelines.reservationResponseText} để phản hồi duyệt hoặc từ chối.`;
      try {
        await notificationRepository.createNotification({
          user_id: Number(customerId),
          title: custTitle,
          content: custContent,
          type: 'RESERVATION_CREATED'
        });
        if (io) {
          io.to(`user_${customerId}`).emit('new_notification', {
            id: `noti_${Date.now()}_${customerId}`,
            title: custTitle,
            content: custContent,
            type: 'RESERVATION_CREATED',
            reservation_id: newReservation.id,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Lỗi gửi thông báo cho Customer khi tạo yêu cầu:', err.message);
      }
    }

    return {
      reservation: newReservation,
      message: `Gửi yêu cầu thuê bãi đỗ xe thành công! Chủ bãi có ${timelines.reservationResponseText} để phản hồi duyệt hoặc từ chối.`,
      timeline: timelines
    };
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

    if (reservation.status !== 'PENDING' && reservation.status !== 'APPROVED') {
      throw this.createError(`Không thể hủy yêu cầu thuê ở trạng thái hiện tại (${reservation.status})!`, 400);
    }

    if (reservation.confirmation_record && reservation.confirmation_record.status === 'ACTIVE') {
      throw this.createError('Hợp đồng đã có hiệu lực (ACTIVE). Vui lòng gửi yêu cầu chấm dứt hợp đồng thay vì hủy yêu cầu đặt chỗ!', 400);
    }

    const updatedReservation = await reservationRepository.updateStatus(reservationId, 'CANCELLED');

    if (reservation.confirmation_record && reservation.confirmation_record.status === 'PENDING_SIGNATURE') {
      await confirmationRecordRepository.updateStatusAndSnapshot(
        reservation.confirmation_record.id,
        'CANCELLED',
        reservation.confirmation_record.contract_snapshot
      );
    }

    const providerId = reservation.facility?.provider_id || reservation.facility?.provider?.id;
    const facilityName = reservation.facility?.name || 'bãi đỗ xe';
    const customerName = reservation.customer?.full_name || 'Khách hàng';

    if (providerId) {
      const notiTitle = `Khách hàng đã hủy yêu cầu đặt chỗ #${reservation.id}`;
      const notiContent = `Khách hàng ${customerName} đã hủy yêu cầu đặt chỗ tại ${facilityName}.` +
        (reservation.confirmation_record ? ` Hợp đồng điện tử ${reservation.confirmation_record.contract_code} liên quan đã tự động hủy.` : '');

      try {
        await notificationRepository.createNotification({
          user_id: Number(providerId),
          title: notiTitle,
          content: notiContent,
          type: 'RESERVATION_CANCELLED_BY_CUSTOMER'
        });

        const io = getIO();
        if (io) {
          io.to(`user_${providerId}`).emit('new_notification', {
            id: `noti_${Date.now()}_${providerId}`,
            title: notiTitle,
            content: notiContent,
            type: 'RESERVATION_CANCELLED_BY_CUSTOMER',
            reservation_id: reservation.id,
            contract_code: reservation.confirmation_record?.contract_code || null,
            created_at: new Date().toISOString()
          });
        }
      } catch (notiErr) {
        console.warn('Lỗi gửi thông báo khi khách hủy yêu cầu:', notiErr.message);
      }
    }

    return updatedReservation;
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

    const { calculated: timelines } = await timelineSettingService.getTimelineSettings();
    const updated = await reservationRepository.updateStatus(reservationId, status);

    const io = getIO();
    const facilityName = reservation.facility?.name || 'bãi đỗ xe';
    const customerId = reservation.customer_id;

    if (status === 'APPROVED') {
      const provTitle = `Đã duyệt yêu cầu đặt chỗ #${reservation.id}`;
      const provContent = `Bạn đã chấp nhận yêu cầu thuê tại ${facilityName}. Bạn có ${timelines.contractCreationText} để khởi tạo hợp đồng điện tử gửi cho khách hàng.`;
      try {
        await notificationRepository.createNotification({
          user_id: Number(providerId),
          title: provTitle,
          content: provContent,
          type: 'RESERVATION_APPROVED'
        });
        if (io) {
          io.to(`user_${providerId}`).emit('new_notification', {
            id: `noti_${Date.now()}_${providerId}`,
            title: provTitle,
            content: provContent,
            type: 'RESERVATION_APPROVED',
            reservation_id: reservation.id,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Lỗi gửi thông báo cho Provider:', err.message);
      }

      if (customerId) {
        const custTitle = `Yêu cầu đặt chỗ #${reservation.id} đã được chấp nhận!`;
        const custContent = `Chủ bãi ${facilityName} đã chấp nhận yêu cầu thuê của bạn. Chủ bãi có ${timelines.contractCreationText} để khởi tạo hợp đồng điện tử cho bạn.`;
        try {
          await notificationRepository.createNotification({
            user_id: Number(customerId),
            title: custTitle,
            content: custContent,
            type: 'RESERVATION_APPROVED'
          });
          if (io) {
            io.to(`user_${customerId}`).emit('new_notification', {
              id: `noti_${Date.now()}_${customerId}`,
              title: custTitle,
              content: custContent,
              type: 'RESERVATION_APPROVED',
              reservation_id: reservation.id,
              created_at: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn('Lỗi gửi thông báo cho Customer:', err.message);
        }
      }
    } else if (status === 'REJECTED') {
      if (customerId) {
        const custTitle = `Yêu cầu đặt chỗ #${reservation.id} bị từ chối`;
        const custContent = `Rất tiếc, yêu cầu thuê bãi đỗ xe tại ${facilityName} của bạn đã bị chủ bãi từ chối.`;
        try {
          await notificationRepository.createNotification({
            user_id: Number(customerId),
            title: custTitle,
            content: custContent,
            type: 'RESERVATION_REJECTED'
          });
          if (io) {
            io.to(`user_${customerId}`).emit('new_notification', {
              id: `noti_${Date.now()}_${customerId}`,
              title: custTitle,
              content: custContent,
              type: 'RESERVATION_REJECTED',
              reservation_id: reservation.id,
              created_at: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn('Lỗi gửi thông báo từ chối:', err.message);
        }
      }
    }

    return {
      reservation: updated,
      message: status === 'APPROVED'
        ? `Đã chấp nhận yêu cầu thuê bãi xe! Bạn có ${timelines.contractCreationText} để tạo hợp đồng điện tử trước khi yêu cầu tự động hủy.`
        : 'Đã từ chối yêu cầu thuê bãi xe thành công.',
      timeline: timelines
    };
  }
}

module.exports = new ReservationService();
