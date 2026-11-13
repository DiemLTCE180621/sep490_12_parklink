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

function calculateBusinessDaysDeadline(startDate = new Date(), days = 3) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatComplaintItem(complaint) {
  if (!complaint) return null;
  const history = parseComplaintHistory(complaint.admin_response);
  const lastItem = history.length > 0 ? history[history.length - 1] : null;

  const forwardEntries = history.filter(
    (h) => h.action === 'FORWARDED_TO_PROVIDER' || h.deadline
  );
  const latestForward = forwardEntries.length > 0 ? forwardEntries[forwardEntries.length - 1] : null;
  let deadline = latestForward?.deadline || null;
  if (latestForward && latestForward.created_at) {
    const forwardDate = new Date(latestForward.created_at);
    forwardDate.setDate(forwardDate.getDate() + 3);
    deadline = forwardDate.toISOString();
  }

  const isOverdue = Boolean(
    complaint.status === 'WAITING_PROVIDER' &&
    deadline &&
    new Date() > new Date(deadline)
  );

  return {
    ...complaint,
    response_history: history,
    latest_reply: lastItem ? (lastItem.message || lastItem.reason) : complaint.admin_response,
    deadline,
    is_overdue: isOverdue
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

    if (!reservation.confirmation_record || !['ACTIVE', 'COMPLETED'].includes(reservation.confirmation_record.status)) {
      const error = new Error('Chỉ những lượt thuê xe đã có Hợp đồng chính thức có hiệu lực (ACTIVE) hoặc vừa hoàn tất (COMPLETED) mới đủ điều kiện khiếu nại.');
      error.status = 400;
      throw error;
    }

    const newComplaint = await complaintRepository.createComplaint({
      customer_id,
      facility_id: reservation.facility_id,
      title,
      description,
      image_urls,
      status: 'PENDING_ADMIN'
    });

    try {
      await notificationRepository.createNotification({
        user_id: 1,
        title: `Khiếu nại mới #${newComplaint.id} cần tiếp nhận`,
        content: `Khách hàng vừa gửi khiếu nại #${newComplaint.id}: "${title}". Vui lòng kiểm duyệt và xử lý.`,
        type: 'COMPLAINT'
      });

      const io = getIO();
      if (io) {
        io.to('role_ADMIN').emit('complaint_updated', {
          action: 'CREATED',
          complaint: formatComplaintItem(newComplaint)
        });
        io.to(`user_${customer_id}`).emit('complaint_updated', {
          action: 'CREATED',
          complaint: formatComplaintItem(newComplaint)
        });
      }
    } catch (notifErr) {
      console.warn('[ComplaintService] Thông báo cho Admin:', notifErr.message);
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

      if (complaint.status === 'PENDING_ADMIN') {
        const error = new Error('Khiếu nại này đang chờ Ban Quản Trị thẩm định trước khi chuyển cho bãi xe.');
        error.status = 400;
        throw error;
      }

      newStatus = replyPayload.status || 'RESOLVED';

    } else if (role === 'ADMIN') {
      newStatus = replyPayload.status || 'RESOLVED';

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

  // Admin chuyển tiếp khiếu nại cho Chủ bãi xe
  async forwardToProvider(complaint_id, currentUser, payload = {}) {
    const complaint = await complaintRepository.getComplaintById(complaint_id);
    if (!complaint) {
      const error = new Error('Khiếu nại không tồn tại hoặc đã bị xóa.');
      error.status = 404;
      throw error;
    }

    const role = currentUser?.role;
    if (role !== 'ADMIN') {
      const error = new Error('Chỉ Ban Quản Trị mới có quyền chuyển tiếp khiếu nại cho Chủ bãi xe.');
      error.status = 403;
      throw error;
    }

    const adminNote = payload.note?.trim() || payload.message?.trim() || 'Ban Quản Trị yêu cầu Chủ bãi xe kiểm tra sự việc và gửi phản hồi giải trình.';
    const history = parseComplaintHistory(complaint.admin_response);
    const deadline = calculateBusinessDaysDeadline(new Date(), 3);

    history.push({
      sender_role: 'ADMIN',
      sender_name: 'Ban Quản Trị ParkLink',
      action: 'FORWARDED_TO_PROVIDER',
      message: adminNote,
      created_at: new Date().toISOString(),
      deadline: deadline
    });

    const updatedComplaint = await complaintRepository.replyComplaint(complaint_id, {
      response: JSON.stringify(history),
      status: 'WAITING_PROVIDER'
    });

    const formattedComplaint = formatComplaintItem(updatedComplaint);

    try {
      if (complaint.facility?.provider_id) {
        await notificationRepository.createNotification({
          user_id: complaint.facility.provider_id,
          title: `[YÊU CẦU GIẢI TRÌNH] Khiếu nại #${complaint.id}`,
          content: `Admin đã chuyển tiếp khiếu nại #${complaint.id} kèm yêu cầu: "${adminNote.length > 80 ? adminNote.slice(0, 80) + '...' : adminNote}". Thời hạn phản hồi: 3 ngày làm việc.`,
          type: 'COMPLAINT'
        });
      }

      await notificationRepository.createNotification({
        user_id: complaint.customer_id,
        title: `Khiếu nại #${complaint.id} đã chuyển cho bãi xe`,
        content: `Ban Quản Trị đã yêu cầu Chủ bãi xe "${complaint.facility?.name}" giải trình trong vòng 3 ngày làm việc.`,
        type: 'COMPLAINT'
      });
    } catch (notifErr) {
      console.warn('[ComplaintService] Thông báo forwardToProvider:', notifErr.message);
    }

    try {
      const io = getIO();
      if (io) {
        const eventPayload = {
          action: 'FORWARDED',
          complaint: formattedComplaint,
          admin_note: adminNote
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
        user_id: 1,
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

    const allowedAdminStatuses = ['RESOLVED', 'REJECTED', 'CLOSED', 'PROCESSING', 'WAITING_PROVIDER'];
    if (!allowedAdminStatuses.includes(targetStatus)) {
      const error = new Error(
        `Trạng thái không hợp lệ cho Admin. Cho phép: ${allowedAdminStatuses.join(', ')}`
      );
      error.status = 400;
      throw error;
    }

    // Ghi nhận lịch sử tiến trình khiếu nại 
    const history = parseComplaintHistory(complaint.admin_response);
    const noteText = (typeof note === 'string' && note.trim().length > 0)
      ? note.trim()
      : (targetStatus === 'RESOLVED'
        ? 'Ban Quản Trị đã thẩm tra và đánh dấu khiếu nại đã được giải quyết dứt điểm.'
        : targetStatus === 'REJECTED'
          ? 'Ban Quản Trị đã bác bỏ khiếu nại do không đủ căn cứ hoặc vi phạm điều khoản dịch vụ.'
          : targetStatus === 'PROCESSING'
            ? 'Ban Quản Trị đang tiếp nhận và trực tiếp thẩm tra đối soát với các bên liên quan.'
            : `Ban Quản Trị đã cập nhật khiếu nại sang trạng thái ${targetStatus}.`);

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
