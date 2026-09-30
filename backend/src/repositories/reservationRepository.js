const prisma = require('../config/prisma');

/**
 * Repository xử lý các thao tác Database liên quan đến Yêu cầu thuê bãi đỗ xe (Reservation Request)
 */
class ReservationRepository {
  /**
   * Lấy danh sách bãi đỗ xe đã được duyệt và đang hiển thị (phục vụ Customer chọn bãi đỗ để gửi yêu cầu thuê)
   */
  async findAvailableFacilities() {
    return await prisma.facility.findMany({
      where: {
        verification_status: 'APPROVED',
        visibility_status: 'VISIBLE'
      },
      include: {
        images: true,
        facility_amenities: {
          include: {
            amenity: true
          }
        },
        provider: {
          select: {
            id: true,
            full_name: true,
            phone_number: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Lấy thông tin cơ sở bãi đỗ xe theo ID
   */
  async findFacilityById(facilityId) {
    return await prisma.facility.findUnique({
      where: { id: parseInt(facilityId, 10) },
      include: {
        provider: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true
          }
        }
      }
    });
  }

  /**
   * Kiểm tra xem Customer đã có yêu cầu thuê ở trạng thái PENDING tại bãi xe này chưa
   */
  async findPendingReservation(customerId, facilityId) {
    return await prisma.reservation_Request.findFirst({
      where: {
        customer_id: parseInt(customerId, 10),
        facility_id: parseInt(facilityId, 10),
        status: 'PENDING'
      }
    });
  }

  /**
   * Tạo yêu cầu thuê đỗ xe mới vào Database
   */
  async createReservation(data) {
    const { customer_id, facility_id, vehicle_info, desired_start_date } = data;
    return await prisma.reservation_Request.create({
      data: {
        customer_id: parseInt(customer_id, 10),
        facility_id: parseInt(facility_id, 10),
        vehicle_info: vehicle_info.trim(),
        desired_start_date: new Date(desired_start_date),
        status: 'PENDING'
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            price_per_month: true
          }
        },
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true
          }
        }
      }
    });
  }

  /**
   * Lấy thông tin chi tiết một yêu cầu thuê theo ID
   */
  async findById(id) {
    return await prisma.reservation_Request.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        facility: {
          include: {
            provider: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone_number: true
              }
            },
            images: true
          }
        },
        customer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true
          }
        },
        confirmation_record: true
      }
    });
  }

  /**
   * Lấy danh sách yêu cầu thuê xe của một Customer
   */
  async findByCustomerId(customerId) {
    return await prisma.reservation_Request.findMany({
      where: { customer_id: parseInt(customerId, 10) },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            price_per_month: true,
            images: {
              where: { is_primary: true },
              take: 1
            }
          }
        },
        confirmation_record: {
          select: {
            id: true,
            contract_code: true,
            status: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Lấy danh sách yêu cầu thuê xe gửi tới các bãi đỗ của một Provider
   */
  async findByProviderId(providerId) {
    return await prisma.reservation_Request.findMany({
      where: {
        facility: {
          provider_id: parseInt(providerId, 10)
        }
      },
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
            address: true,
            price_per_month: true
          }
        },
        confirmation_record: {
          select: {
            id: true,
            contract_code: true,
            status: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Cập nhật trạng thái Yêu cầu thuê xe (APPROVED / REJECTED / CANCELLED) cho Iteration 2
   */
  async updateStatus(id, status) {
    return await prisma.reservation_Request.update({
      where: { id: parseInt(id, 10) },
      data: { status },
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
            address: true,
            price_per_month: true
          }
        },
        confirmation_record: true
      }
    });
  }
}

module.exports = new ReservationRepository();
