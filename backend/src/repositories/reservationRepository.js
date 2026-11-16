const prisma = require('../config/prisma');

const USER_BASIC_SELECT = {
  id: true,
  full_name: true,
  email: true,
  phone_number: true
};

const CONTRACT_SUMMARY_SELECT = {
  id: true,
  contract_code: true,
  status: true
};

class ReservationRepository {
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
          select: USER_BASIC_SELECT
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findFacilityById(facilityId) {
    return await prisma.facility.findUnique({
      where: { id: parseInt(facilityId, 10) },
      include: {
        provider: {
          select: USER_BASIC_SELECT
        }
      }
    });
  }

  async findActiveReservationByCustomer(customerId) {
    return await prisma.reservation_Request.findFirst({
      where: {
        customer_id: parseInt(customerId, 10),
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { confirmation_record: null },
          { confirmation_record: { status: 'PENDING_SIGNATURE' } }
        ]
      },
      include: {
        facility: true,
        confirmation_record: true
      }
    });
  }

  async findPendingReservation(customerId, facilityId) {
    return await prisma.reservation_Request.findFirst({
      where: {
        customer_id: parseInt(customerId, 10),
        facility_id: parseInt(facilityId, 10),
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { confirmation_record: null },
          { confirmation_record: { status: 'PENDING_SIGNATURE' } }
        ]
      },
      include: {
        confirmation_record: true
      }
    });
  }

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
              select: USER_BASIC_SELECT
            }
          }
        },
        customer: {
          select: USER_BASIC_SELECT
        }
      }
    });
  }

  async findById(id) {
    return await prisma.reservation_Request.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        facility: {
          include: {
            provider: {
              select: USER_BASIC_SELECT
            },
            images: true
          }
        },
        customer: {
          select: USER_BASIC_SELECT
        },
        confirmation_record: true
      }
    });
  }

  async findByCustomerId(customerId) {
    return await prisma.reservation_Request.findMany({
      where: { customer_id: parseInt(customerId, 10) },
      include: {
        facility: {
          include: {
            provider: {
              select: USER_BASIC_SELECT
            },
            images: {
              where: { is_primary: true },
              take: 1
            }
          }
        },
        confirmation_record: {
          select: CONTRACT_SUMMARY_SELECT
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findByProviderId(providerId) {
    return await prisma.reservation_Request.findMany({
      where: {
        facility: {
          provider_id: parseInt(providerId, 10)
        }
      },
      include: {
        customer: {
          select: USER_BASIC_SELECT
        },
        facility: {
          include: {
            provider: {
              select: USER_BASIC_SELECT
            }
          }
        },
        confirmation_record: {
          select: CONTRACT_SUMMARY_SELECT
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async updateStatus(id, status) {
    return await prisma.reservation_Request.update({
      where: { id: parseInt(id, 10) },
      data: { status },
      include: {
        customer: {
          select: USER_BASIC_SELECT
        },
        facility: {
          include: {
            provider: {
              select: USER_BASIC_SELECT
            }
          }
        },
        confirmation_record: true
      }
    });
  }

  async cancelRemainingReservationsWhenFull(facilityId, excludeReservationId) {
    const parsedFacilityId = parseInt(facilityId, 10);
    const parsedExcludeId = parseInt(excludeReservationId, 10);

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
          select: USER_BASIC_SELECT
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

    await prisma.reservation_Request.updateMany({
      where: { id: { in: affectedIds } },
      data: { status: 'CANCELLED' }
    });

    if (pendingContractIds.length > 0) {
      await prisma.confirmation_Record.updateMany({
        where: { id: { in: pendingContractIds } },
        data: { status: 'CANCELLED' }
      });
    }

    return affectedReservations;
  }

  async cancelExpiredPendingReservations(deadlineMs = 12 * 60 * 60 * 1000) {
    const deadlineDate = new Date(Date.now() - deadlineMs);

    const expiredPendingList = await prisma.reservation_Request.findMany({
      where: {
        status: 'PENDING',
        created_at: { lt: deadlineDate }
      },
      include: {
        customer: {
          select: USER_BASIC_SELECT
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

    if (expiredPendingList.length === 0) {
      return [];
    }

    const expiredIds = expiredPendingList.map((r) => r.id);
    await prisma.reservation_Request.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: 'CANCELLED' }
    });

    return expiredPendingList;
  }

  async cancelExpiredApprovedReservations(deadlineMs = 24 * 60 * 60 * 1000) {
    const deadlineDate = new Date(Date.now() - deadlineMs);

    const expiredApprovedList = await prisma.reservation_Request.findMany({
      where: {
        status: 'APPROVED',
        updated_at: { lt: deadlineDate },
        confirmation_record: null
      },
      include: {
        customer: {
          select: USER_BASIC_SELECT
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

  async cancelExpiredPendingContracts(deadlineMs = 24 * 60 * 60 * 1000) {
    const deadlineDate = new Date(Date.now() - deadlineMs);

    const expiredContracts = await prisma.confirmation_Record.findMany({
      where: {
        status: 'PENDING_SIGNATURE',
        created_at: { lt: deadlineDate }
      },
      include: {
        reservation: {
          include: {
            customer: {
              select: USER_BASIC_SELECT
            },
            facility: {
              select: {
                id: true,
                name: true,
                provider_id: true
              }
            }
          }
        }
      }
    });

    if (expiredContracts.length === 0) {
      return [];
    }

    const contractIds = expiredContracts.map((c) => c.id);
    const reservationIds = expiredContracts.map((c) => c.reservation_id);

    await prisma.confirmation_Record.updateMany({
      where: { id: { in: contractIds } },
      data: { status: 'CANCELLED' }
    });

    await prisma.reservation_Request.updateMany({
      where: { id: { in: reservationIds } },
      data: { status: 'CANCELLED' }
    });

    return expiredContracts;
  }
}

module.exports = new ReservationRepository();
