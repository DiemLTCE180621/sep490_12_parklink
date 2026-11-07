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
          include: {
            provider: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone_number: true
              }
            },
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
        },
        confirmation_record: true
      }
    });
  }

  /**
   * Tự động hủy các yêu cầu đặt chỗ còn lại (PENDING / APPROVED chưa ký xong hợp đồng)
   * tại bãi xe khi chỗ trống cuối cùng đã được 2 bên ký hợp đồng thành công (available_slots === 0)
   */
  async cancelRemainingReservationsWhenFull(facilityId, excludeReservationId) {
    const parsedFacilityId = parseInt(facilityId, 10);
    const parsedExcludeId = parseInt(excludeReservationId, 10);

    // 1. Tìm tất cả các yêu cầu đặt chỗ khác đang chờ hoặc đã duyệt nhưng chưa hoàn tất ký hợp đồng ACTIVE
    const affectedReservations = await prisma.reservation_Request.findMany({
      where: {
        facility_id: parsedFacilityId,
        id: { not: parsedExcludeId },
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { confirmation_record: null },
          { confirmation_record: { status: 'PENDING_SIGNATURE' } }
        ]
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
        confirmation_record: true
      }
    });

    if (affectedReservations.length === 0) {
      return [];
    }

    const affectedIds = affectedReservations.map((r) => r.id);
    const pendingContractIds = affectedReservations
      .filter((r) => r.confirmation_record && r.confirmation_record.status === 'PENDING_SIGNATURE')
      .map((r) => r.confirmation_record.id);

    // 2. Chuyển trạng thái các Reservation_Request đó sang CANCELLED
    await prisma.reservation_Request.updateMany({
      where: { id: { in: affectedIds } },
      data: { status: 'CANCELLED' }
    });

    // 3. Nếu có biên bản PENDING_SIGNATURE nào đang chờ khách ký thì cũng chuyển sang CANCELLED
    if (pendingContractIds.length > 0) {
      await prisma.confirmation_Record.updateMany({
        where: { id: { in: pendingContractIds } },
        data: { status: 'CANCELLED' }
      });
    }

    return affectedReservations;
  }

  /**
   * Tự động hủy các yêu cầu đặt chỗ đã được Provider chấp nhận (APPROVED)
   * nhưng quá 24 giờ mà Provider vẫn chưa tạo hợp đồng điện tử (confirmation_record === null)
   */
  async cancelExpiredApprovedReservations() {
    const deadline24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredApprovedList = await prisma.reservation_Request.findMany({
      where: {
        status: 'APPROVED',
        updated_at: { lt: deadline24hAgo },
        confirmation_record: null
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
            provider_id: true
          }
        }
      }
    });

    if (expiredApprovedList.length === 0) {
      return [];
    }

    const expiredIds = expiredApprovedList.map((r) => r.id);
    await prisma.reservation_Request.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: 'CANCELLED' }
    });

    return expiredApprovedList;
  }
}

module.exports = new ReservationRepository();
