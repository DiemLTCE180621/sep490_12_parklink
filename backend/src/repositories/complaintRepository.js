const prisma = require('../config/prisma');

class ComplaintRepository {
  async createComplaint(data) {
    return await prisma.complaint.create({
      data: {
        customer_id: parseInt(data.customer_id),
        facility_id: parseInt(data.facility_id),
        title: data.title,
        description: data.description,
        image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],
        status: data.status || 'PENDING_ADMIN'
      }
    });
  }

  async getReservationById(reservation_id) {
    return await prisma.reservation_Request.findUnique({
      where: { id: parseInt(reservation_id) },
      include: { facility: true, confirmation_record: true }
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
        },
        status: {
          notIn: ['PENDING_ADMIN']
        }
      },
      include: {
        customer: { select: { full_name: true, email: true, phone_number: true } },
        facility: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getAllComplaints(filters = {}) {
    const where = {};
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    return await prisma.complaint.findMany({
      where,
      include: {
        customer: { select: { id: true, full_name: true, email: true, phone_number: true } },
        facility: {
          select: {
            id: true,
            name: true,
            provider_id: true,
            provider: { select: { id: true, full_name: true, email: true, phone_number: true } }
          }
        }
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

  async getComplaintById(complaint_id) {
    return await prisma.complaint.findUnique({
      where: { id: parseInt(complaint_id) },
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            provider_id: true,
            provider: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone_number: true
              }
            }
          }
        }
      }
    });
  }

  //Phản hồi khiếu nại (Admin hoặc Provider)
  async replyComplaint(complaint_id, updateData) {
    const dataToUpdate = {
      admin_response: updateData.response
    };

    if (updateData.status) {
      dataToUpdate.status = updateData.status;
    }

    return await prisma.complaint.update({
      where: { id: parseInt(complaint_id) },
      data: dataToUpdate,
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            provider_id: true,
            provider: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async updateStatus(complaint_id, status) {
    return await prisma.complaint.update({
      where: { id: parseInt(complaint_id) },
      data: { status },
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            provider_id: true
          }
        }
      }
    });
  }

  async updateComplaintStatus(complaint_id, updateData) {
    const dataToUpdate = {};
    if (updateData.status) {
      dataToUpdate.status = updateData.status;
    }
    if (updateData.admin_response !== undefined) {
      dataToUpdate.admin_response = updateData.admin_response;
    }

    return await prisma.complaint.update({
      where: { id: parseInt(complaint_id) },
      data: dataToUpdate,
      include: {
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true
          }
        },
        facility: {
          select: {
            id: true,
            name: true,
            provider_id: true,
            provider: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone_number: true
              }
            }
          }
        }
      }
    });
  }
}

module.exports = new ComplaintRepository();
