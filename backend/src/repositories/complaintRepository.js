const prisma = require('../config/prisma');

class ComplaintRepository {
  async createComplaint(data) {
    return await prisma.complaint.create({
      data: {
        customer_id: parseInt(data.customer_id),
        facility_id: parseInt(data.facility_id),
        title: data.title,
        description: data.description,
        status: 'PENDING'
      }
    });
  }

  async getReservationById(reservation_id) {
    return await prisma.reservation_Request.findUnique({
      where: { id: parseInt(reservation_id) },
      include: { facility: true }
    });
  }

  async getCustomerComplaints(customer_id) {
    return await prisma.complaint.findMany({
      where: { customer_id: parseInt(customer_id) },
      include: { facility: true },
      orderBy: { created_at: 'desc' }
    });
  }

  async getProviderComplaints(provider_id) {
    return await prisma.complaint.findMany({
      where: {
        facility: {
          provider_id: parseInt(provider_id)
        }
      },
      include: { 
        customer: { select: { full_name: true, email: true, phone_number: true } },
        facility: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getAllComplaints() {
    return await prisma.complaint.findMany({
      include: { 
        customer: { select: { full_name: true, email: true, phone_number: true } },
        facility: { select: { name: true, provider: { select: { full_name: true, email: true } } } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getFacilityById(facility_id) {
    return await prisma.facility.findUnique({
      where: { id: parseInt(facility_id) }
    });
  }

  // Kiểm tra khách đã từng có hợp đồng ở bãi đỗ xe này chưa
  async checkCustomerContract(customer_id, facility_id) {
    return await prisma.reservation_Request.findFirst({
      where: {
        customer_id: parseInt(customer_id),
        facility_id: parseInt(facility_id),
        confirmation_record: {
            isNot: null 
        }
      }
    });
  }
}

module.exports = new ComplaintRepository();
