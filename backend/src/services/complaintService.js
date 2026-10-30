const complaintRepository = require('../repositories/complaintRepository');

class ComplaintService {
  async createComplaint(data) {
    const { reservation_id, customer_id, title, description, image_urls } = data;

    const reservation = await complaintRepository.getReservationById(reservation_id);
    
    if (!reservation) {
      throw new Error('Yêu cầu thuê không tồn tại.');
    }

    if (reservation.customer_id !== customer_id) {
      throw new Error('Bạn không có quyền khiếu nại yêu cầu thuê này.');
    }

    if (reservation.status === 'PENDING' || reservation.status === 'REJECTED' || reservation.status === 'CANCELLED') {
      throw new Error('Lượt thuê này không đủ điều kiện khiếu nại.');
    }
    
    // Lưu xuống DB với facility_id lấy từ reservation
    return await complaintRepository.createComplaint({
      customer_id,
      facility_id: reservation.facility_id,
      title,
      description,
      image_urls
    });
  }

  async getMyComplaints(customer_id) {
    return await complaintRepository.getCustomerComplaints(customer_id);
  }

  async getProviderComplaints(provider_id) {
    return await complaintRepository.getProviderComplaints(provider_id);
  }

  async getAllComplaints() {
    return await complaintRepository.getAllComplaints();
  }
}

module.exports = new ComplaintService();
