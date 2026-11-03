const complaintRepository = require('../repositories/complaintRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { getIO } = require('../config/socket');

function parseComplaintHistory(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [raw];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
  } catch (e) {
    return [
      {
        sender_role: 'SYSTEM',
        sender_name: 'Phản hồi trước đó',
        message: raw,
        created_at: new Date().toISOString()
      }
    ];
  }
  return [];
}

function formatComplaintItem(complaint) {
  if (!complaint) return null;
  const history = parseComplaintHistory(complaint.admin_response);
  const lastItem = history.length > 0 ? history[history.length - 1] : null;

  return {
    ...complaint,
    response_history: history,
    latest_reply: lastItem ? (lastItem.message || lastItem.reason) : complaint.admin_response
  };
}

class ComplaintService {
  async createComplaint(data) {
    const { reservation_id, customer_id, title, description, image_urls } = data;

    const reservation = await complaintRepository.getReservationById(reservation_id);

    if (!reservation) {
      const error = new Error('Yêu cầu thuê không tồn tại.');
      error.status = 404;
      throw error;
    }

    if (reservation.customer_id !== customer_id) {
      const error = new Error('Bạn không có quyền khiếu nại yêu cầu thuê này.');
      error.status = 403;
      throw error;
    }

    if (reservation.status === 'PENDING' || reservation.status === 'REJECTED' || reservation.status === 'CANCELLED') {
      const error = new Error('Lượt thuê này không đủ điều kiện khiếu nại.');
      error.status = 400;
      throw error;
    }

    const newComplaint = await complaintRepository.createComplaint({
      customer_id,
      facility_id: reservation.facility_id,
      title,
      description,
      image_urls
    });

    try {
      const facility = await complaintRepository.getFacilityById(reservation.facility_id);
      if (facility?.provider_id) {
        await notificationRepository.createNotification({
          user_id: facility.provider_id,
          title: `Khiếu nại mới tại bãi xe "${facility.name}"`,
          content: `Khách hàng vừa gửi khiếu nại #${newComplaint.id}: "${title}". Vui lòng kiểm tra và xử lý.`,
          type: 'COMPLAINT'
        });

        const io = getIO();
        if (io) {
          io.to(`user_${facility.provider_id}`).emit('complaint_updated', {
            action: 'CREATED',
            complaint: formatComplaintItem(newComplaint)
          });
        }
      }
    } catch (notifErr) {
      console.warn('[ComplaintService] Thông báo cho Provider:', notifErr.message);
    }

    return formatComplaintItem(newComplaint);
  }

  async getMyComplaints(customer_id) {
    const list = await complaintRepository.getCustomerComplaints(customer_id);
    return list.map(formatComplaintItem);
  }

  async getProviderComplaints(provider_id) {
    const list = await complaintRepository.getProviderComplaints(provider_id);
    return list.map(formatComplaintItem);
  }

  async getAllComplaints(filters = {}) {
    const list = await complaintRepository.getAllComplaints(filters);
    return list.map(formatComplaintItem);
  }

  async getComplaintById(complaint_id, currentUser) {
    const complaint = await complaintRepository.getComplaintById(complaint_id);
    if (!complaint) {
      const error = new Error('Khiếu nại không tồn tại hoặc đã bị xóa.');
      error.status = 404;
      throw error;
    }

    const userId = parseInt(currentUser?.userId || currentUser?.id);
    const role = currentUser?.role;

    if (role === 'CUSTOMER' && complaint.customer_id !== userId) {
      const error = new Error('Bạn không có quyền truy cập khiếu nại này.');
      error.status = 403;
      throw error;
    }

    if (role === 'PROVIDER' && complaint.facility?.provider_id !== userId) {
      const error = new Error('Bạn không có quyền truy cập khiếu nại của bãi xe khác.');
      error.status = 403;
      throw error;
    }

    return formatComplaintItem(complaint);
  }

  async replyToComplaint(complaint_id, currentUser, replyPayload) {
    const complaint = await complaintRepository.getComplaintById(complaint_id);
    if (!complaint) {
      const error = new Error('Khiếu nại không tồn tại hoặc đã bị xóa.');
      error.status = 404;
      throw error;
    }

    const userId = parseInt(currentUser?.userId || currentUser?.id);
    const role = currentUser?.role;
    const responseText = replyPayload.response;

    let newStatus = replyPayload.status;

    if (role === 'PROVIDER') {
      if (complaint.facility?.provider_id !== userId) {
        const error = new Error('Bạn không có quyền phản hồi khiếu nại này vì không thuộc bãi xe do bạn quản lý.');
        error.status = 403;
        throw error;
      }

      if (complaint.status === 'ESCALATED') {
        const error = new Error('Khiếu nại này đã được chuyển cấp lên Ban Quản Trị can thiệp. Chủ bãi xe không thể phản hồi trực tiếp lúc này.');
        error.status = 400;
        throw error;
      }

      if (!newStatus || !['PROCESSING', 'RESOLVED'].includes(newStatus)) {
        newStatus = complaint.status === 'PENDING' ? 'PROCESSING' : (replyPayload.status || 'PROCESSING');
      }

    } else if (role === 'ADMIN') {
      if (complaint.status !== 'ESCALATED') {
        const error = new Error(`Admin chỉ tiếp nhận và xử lý những khiếu nại có trạng thái ESCALATED. Khiếu nại #${complaint.id} hiện đang ở trạng thái ${complaint.status} do Chủ bãi xe phụ trách xử lý trước.`);
        error.status = 400;
        throw error;
      }

      if (!newStatus || !['RESOLVED', 'ESCALATED'].includes(newStatus)) {
        newStatus = 'RESOLVED';
      }

    } else {
      const error = new Error('Bạn không có quyền thực hiện phản hồi khiếu nại.');
      error.status = 403;
      throw error;
    }

    const history = parseComplaintHistory(complaint.admin_response);
    const senderName = role === 'ADMIN'
      ? 'Ban Quản Trị ParkLink'
      : (complaint.facility?.provider?.full_name || 'Chủ bãi xe');

    history.push({
      sender_role: role,
      sender_id: userId,
      sender_name: senderName,
      message: responseText,
      status: newStatus,
      created_at: new Date().toISOString()
    });

    const updatedComplaint = await complaintRepository.replyComplaint(complaint_id, {
      response: JSON.stringify(history),
      status: newStatus
    });

    const formattedComplaint = formatComplaintItem(updatedComplaint);

    try {
      const notifTargetUser = role === 'ADMIN' ? complaint.customer_id : complaint.customer_id;
      const titlePrefix = role === 'ADMIN' ? 'Ban Quản Trị đã giải quyết khiếu nại' : 'Chủ bãi xe đã phản hồi khiếu nại';

      await notificationRepository.createNotification({
        user_id: notifTargetUser,
        title: `${titlePrefix} #${complaint.id}`,
        content: `"${responseText.length > 100 ? responseText.substring(0, 100) + '...' : responseText}" (Trạng thái: ${newStatus})`,
        type: 'COMPLAINT'
      });
    } catch (notifErr) {
      console.warn('[ComplaintService] Thông báo phản hồi:', notifErr.message);
    }

    try {
      const io = getIO();
      if (io) {
        const eventPayload = {
          action: 'REPLIED',
          complaint: formattedComplaint,
          replied_by: { user_id: userId, role }
        };
        io.to(`user_${complaint.customer_id}`).emit('complaint_updated', eventPayload);
        io.to('role_ADMIN').emit('complaint_updated', eventPayload);
        if (complaint.facility?.provider_id) {
          io.to(`user_${complaint.facility.provider_id}`).emit('complaint_updated', eventPayload);
        }
      }
    } catch (socketErr) {
      console.warn('[ComplaintService] Socket emit error:', socketErr.message);
    }

    return formattedComplaint;
  }

  // Customer yêu cầu chuyển cấp khiếu nại lên Admin 
  async escalateComplaint(complaint_id, currentUser, reason) {
    const complaint = await complaintRepository.getComplaintById(complaint_id);
    if (!complaint) {
      const error = new Error('Khiếu nại không tồn tại hoặc đã bị xóa.');
      error.status = 404;
      throw error;
    }

    const userId = parseInt(currentUser?.userId || currentUser?.id);
    const role = currentUser?.role;

    if (role !== 'CUSTOMER' || complaint.customer_id !== userId) {
      const error = new Error('Chỉ khách hàng tạo khiếu nại mới có quyền yêu cầu Ban Quản Trị can thiệp.');
      error.status = 403;
      throw error;
    }

    if (complaint.status === 'ESCALATED') {
      const error = new Error('Khiếu nại này đã được chuyển cấp lên Ban Quản Trị trước đó.');
      error.status = 400;
      throw error;
    }

    if (complaint.status === 'RESOLVED') {
    }

    const history = parseComplaintHistory(complaint.admin_response);
    const escalationReason = reason?.trim() || 'Khách hàng không hài lòng với hướng xử lý hoặc Chủ bãi xe không phản hồi đúng hạn.';

    history.push({
      sender_role: 'CUSTOMER',
      sender_id: userId,
      sender_name: complaint.customer?.full_name || 'Khách hàng',
      action: 'ESCALATED',
      reason: escalationReason,
      status: 'ESCALATED',
      created_at: new Date().toISOString()
    });

    const updatedComplaint = await complaintRepository.replyComplaint(complaint_id, {
      response: JSON.stringify(history),
      status: 'ESCALATED'
    });

    const formattedComplaint = formatComplaintItem(updatedComplaint);

    try {
      await notificationRepository.createNotification({
        user_id: 1, // Admin notification
        title: `[CẦN CAN THIỆP] Khiếu nại #${complaint.id} đã chuyển cấp lên Admin`,
        content: `Khách hàng ${complaint.customer?.full_name || ''} yêu cầu Admin can thiệp khiếu nại tại "${complaint.facility?.name}". Lý do: ${escalationReason}`,
        type: 'COMPLAINT'
      });
    } catch (notifErr) {
      console.warn('[ComplaintService] Lỗi thông báo chuyển cấp:', notifErr.message);
    }

    try {
      const io = getIO();
      if (io) {
        const eventPayload = {
          action: 'ESCALATED',
          complaint: formattedComplaint,
          reason: escalationReason
        };
        io.to('role_ADMIN').emit('complaint_updated', eventPayload);
        io.to(`user_${complaint.customer_id}`).emit('complaint_updated', eventPayload);
        if (complaint.facility?.provider_id) {
          io.to(`user_${complaint.facility.provider_id}`).emit('complaint_updated', eventPayload);
        }
      }
    } catch (socketErr) {
      console.warn('[ComplaintService] Socket emit error:', socketErr.message);
    }

    return formattedComplaint;
  }

  // Cập nhật trạng thái khiếu nại độc lập (Dành cho Admin & Provider)
  async updateComplaintStatus(complaint_id, currentUser, payload) {
    const status = typeof payload === 'object' ? payload.status : payload;
    const note = typeof payload === 'object' ? (payload.note || payload.admin_note || payload.reason) : null;

    const role = currentUser?.role;

    if (role === 'ADMIN') {
      return await this.updateComplaintStatusByAdmin(complaint_id, currentUser, { status, note });
    }

    const complaint = await complaintRepository.getComplaintById(complaint_id);
    if (!complaint) {
      const error = new Error('Khiếu nại không tồn tại hoặc đã bị xóa.');
      error.status = 404;
      throw error;
    }

    const userId = parseInt(currentUser?.userId || currentUser?.id, 10);

    if (role === 'PROVIDER') {
      if (complaint.facility?.provider_id !== userId) {
        const error = new Error('Bạn không có quyền thay đổi trạng thái khiếu nại của bãi xe khác.');
        error.status = 403;
        throw error;
      }
      if (complaint.status === 'ESCALATED') {
        const error = new Error('Khiếu nại đang do Ban Quản Trị xử lý, Chủ bãi xe không thể thay đổi trạng thái lúc này.');
        error.status = 400;
        throw error;
      }
      if (!['PROCESSING', 'RESOLVED'].includes(status)) {
        const error = new Error('Chủ bãi xe chỉ có thể cập nhật trạng thái thành PROCESSING hoặc RESOLVED.');
        error.status = 400;
        throw error;
      }
    } else {
      const error = new Error('Bạn không có quyền thay đổi trạng thái khiếu nại.');
      error.status = 403;
      throw error;
    }

    // Ghi nhận thay đổi trạng thái vào lịch sử
    const history = parseComplaintHistory(complaint.admin_response);
    const noteText = note?.trim() || `Chủ bãi xe đã cập nhật trạng thái sang ${status}.`;

    history.push({
      sender_role: role,
      sender_id: userId,
      sender_name: complaint.facility?.provider?.full_name || 'Chủ bãi xe',
      action: 'STATUS_CHANGED',
      previous_status: complaint.status,
      status: status,
      message: noteText,
      created_at: new Date().toISOString()
    });

    const updatedComplaint = await complaintRepository.updateComplaintStatus(complaint_id, {
      status: status,
      admin_response: JSON.stringify(history)
    });

    const formattedComplaint = formatComplaintItem(updatedComplaint);

    // Gửi thông báo đến Customer
    try {
      await notificationRepository.createNotification({
        user_id: complaint.customer_id,
        title: `Chủ bãi xe đã cập nhật trạng thái khiếu nại #${complaint.id}`,
        content: `Khiếu nại tại bãi xe "${complaint.facility?.name}" chuyển sang: ${status}.`,
        type: 'COMPLAINT'
      });
    } catch (notifErr) {
      console.warn('[ComplaintService] Thông báo Provider update status:', notifErr.message);
    }

    try {
      const io = getIO();
      if (io) {
        const eventPayload = {
          action: 'STATUS_CHANGED',
          complaint: formattedComplaint,
          updated_by: { user_id: userId, role }
        };
        io.to(`user_${complaint.customer_id}`).emit('complaint_updated', eventPayload);
        io.to('role_ADMIN').emit('complaint_updated', eventPayload);
        if (complaint.facility?.provider_id) {
          io.to(`user_${complaint.facility.provider_id}`).emit('complaint_updated', eventPayload);
        }
      }
    } catch (socketErr) {
      console.warn('[ComplaintService] Socket emit error:', socketErr.message);
    }

    return formattedComplaint;
  }

  async updateComplaintStatusByAdmin(complaint_id, currentUser, { status, note }) {
    const role = currentUser?.role;
    if (role !== 'ADMIN') {
      const error = new Error('Chức năng này chỉ dành riêng cho Quản trị viên (ADMIN).');
      error.status = 403;
      throw error;
    }

    const complaint = await complaintRepository.getComplaintById(complaint_id);
    if (!complaint) {
      const error = new Error('Khiếu nại không tồn tại hoặc đã bị xóa.');
      error.status = 404;
      throw error;
    }

    const userId = parseInt(currentUser?.userId || currentUser?.id, 10);
    const targetStatus = status ? status.toUpperCase().trim() : 'RESOLVED';

    const allowedAdminStatuses = ['RESOLVED', 'PROCESSING', 'CLOSED'];
    if (!allowedAdminStatuses.includes(targetStatus)) {
      const error = new Error(
        `Trạng thái không hợp lệ cho Admin. Cho phép: ${allowedAdminStatuses.join(', ')}`
      );
      error.status = 400;
      throw error;
    }

    // Quy tắc nghiệp vụ Hội đồng:
    // Khiếu nại PENDING là trách nhiệm ban đầu của Chủ bãi xe xử lý.
    if (complaint.status === 'PENDING') {
      const error = new Error(
        `Khiếu nại #${complaint.id} đang ở trạng thái PENDING do Chủ bãi xe phụ trách xử lý ban đầu. Khách hàng cần chuyển cấp (ESCALATED) hoặc Chủ bãi phản hồi trước khi Admin can thiệp.`
      );
      error.status = 400;
      throw error;
    }

    // Ghi nhận vào lịch sử tiến trình khiếu nại (Audit Trail)
    const history = parseComplaintHistory(complaint.admin_response);
    const noteText = (typeof note === 'string' && note.trim().length > 0)
      ? note.trim()
      : (targetStatus === 'RESOLVED'
        ? 'Ban Quản Trị đã thẩm tra và đánh dấu khiếu nại đã được giải quyết dứt điểm.'
        : targetStatus === 'PROCESSING'
          ? 'Ban Quản Trị đang tiếp nhận và trực tiếp thẩm tra đối soát với các bên liên quan.'
          : `Ban Quản Trị đã đóng khiếu nại với trạng thái ${targetStatus}.`);

    history.push({
      sender_role: 'ADMIN',
      sender_id: userId,
      sender_name: 'Ban Quản Trị ParkLink',
      action: 'STATUS_CHANGED',
      previous_status: complaint.status,
      status: targetStatus,
      message: noteText,
      created_at: new Date().toISOString()
    });

    const updatedComplaint = await complaintRepository.updateComplaintStatus(complaint_id, {
      status: targetStatus,
      admin_response: JSON.stringify(history)
    });

    const formattedComplaint = formatComplaintItem(updatedComplaint);

    // Gửi thông báo đến Khách hàng
    try {
      await notificationRepository.createNotification({
        user_id: complaint.customer_id,
        title: `Ban Quản Trị đã cập nhật khiếu nại #${complaint.id}`,
        content: `Khiếu nại của bạn đã chuyển sang trạng thái: ${targetStatus}. Kết luận: "${noteText.length > 80 ? noteText.substring(0, 80) + '...' : noteText}"`,
        type: 'COMPLAINT'
      });
    } catch (notifErr) {
      console.warn('[ComplaintService.updateComplaintStatusByAdmin] Lỗi thông báo Customer:', notifErr.message);
    }

    // 2. Gửi thông báo đến Chủ bãi xe
    if (complaint.facility?.provider_id) {
      try {
        await notificationRepository.createNotification({
          user_id: complaint.facility.provider_id,
          title: `Ban Quản Trị cập nhật khiếu nại #${complaint.id}`,
          content: `Ban Quản Trị đã cập nhật trạng thái khiếu nại tại "${complaint.facility.name}" sang ${targetStatus}.`,
          type: 'COMPLAINT'
        });
      } catch (notifErr) {
        console.warn('[ComplaintService.updateComplaintStatusByAdmin] Lỗi thông báo Provider:', notifErr.message);
      }
    }

    try {
      const io = getIO();
      if (io) {
        const eventPayload = {
          action: 'STATUS_CHANGED',
          complaint: formattedComplaint,
          updated_by: { user_id: userId, role: 'ADMIN' },
          note: noteText
        };
        io.to(`user_${complaint.customer_id}`).emit('complaint_updated', eventPayload);
        io.to('role_ADMIN').emit('complaint_updated', eventPayload);
        if (complaint.facility?.provider_id) {
          io.to(`user_${complaint.facility.provider_id}`).emit('complaint_updated', eventPayload);
        }
      }
    } catch (socketErr) {
      console.warn('[ComplaintService.updateComplaintStatusByAdmin] Socket emit error:', socketErr.message);
    }

    return formattedComplaint;
  }
}

module.exports = new ComplaintService();
