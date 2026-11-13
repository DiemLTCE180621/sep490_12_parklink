const prisma = require('../config/prisma');

const USER_BASIC_SELECT = {
  id: true,
  full_name: true,
  email: true,
  phone_number: true
};

const USER_WITH_ADDRESS_SELECT = {
  id: true,
  full_name: true,
  email: true,
  phone_number: true,
  address: true
};

const FACILITY_BASIC_SELECT = {
  id: true,
  name: true,
  address: true,
  price_per_month: true
};

const FACILITY_WITH_PROVIDER_SELECT = {
  ...FACILITY_BASIC_SELECT,
  provider: {
    select: USER_BASIC_SELECT
  }
};

class ConfirmationRecordRepository {
  async create(data) {
    const {
      contract_code,
      reservation_id,
      parent_contract_id,
      agreed_price,
      payment_deadline_day,
      start_date,
      end_date,
      contract_snapshot,
      provider_agreed_at,
      status
    } = data;

    const createPayload = {
      contract_code,
      reservation_id: parseInt(reservation_id, 10),
      agreed_price,
      payment_deadline_day: payment_deadline_day ? parseInt(payment_deadline_day, 10) : 5,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      contract_snapshot,
      provider_agreed_at: provider_agreed_at || new Date(),
      status: status || 'PENDING_SIGNATURE'
    };

    const hasParentContractColumn = Boolean(
      prisma?._runtimeDataModel?.models?.Confirmation_Record?.fields?.some(
        (field) => field.name === 'parent_contract_id'
      )
    );
    if (hasParentContractColumn && parent_contract_id) {
      createPayload.parent_contract_id = parseInt(parent_contract_id, 10);
    }

    return await prisma.confirmation_Record.create({
      data: createPayload,
      include: {
        reservation: {
          include: {
            customer: {
              select: USER_BASIC_SELECT
            },
            facility: {
              select: FACILITY_WITH_PROVIDER_SELECT
            }
          }
        }
      }
    });
  }

  async findById(id) {
    return await prisma.confirmation_Record.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        reservation: {
          include: {
            customer: {
              select: USER_BASIC_SELECT
            },
            facility: {
              select: {
                ...FACILITY_WITH_PROVIDER_SELECT,
                provider_id: true
              }
            }
          }
        }
      }
    });
  }

  async findByReservationId(reservationId) {
    return await prisma.confirmation_Record.findUnique({
      where: { reservation_id: parseInt(reservationId, 10) }
    });
  }

  async findByCustomerId(customerId) {
    return await prisma.confirmation_Record.findMany({
      where: {
        reservation: {
          customer_id: parseInt(customerId, 10)
        }
      },
      include: {
        reservation: {
          include: {
            facility: {
              select: FACILITY_WITH_PROVIDER_SELECT
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findByProviderId(providerId) {
    return await prisma.confirmation_Record.findMany({
      where: {
        reservation: {
          facility: {
            provider_id: parseInt(providerId, 10)
          }
        }
      },
      include: {
        reservation: {
          include: {
            customer: {
              select: USER_BASIC_SELECT
            },
            facility: {
              select: FACILITY_BASIC_SELECT
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async updateStatusAndAgree(id, status, customerAgreedAt, updatedSnapshot) {
    const updateData = {
      status,
      customer_agreed_at: customerAgreedAt || new Date()
    };
    if (updatedSnapshot) {
      updateData.contract_snapshot = updatedSnapshot;
    }

    return await prisma.confirmation_Record.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      include: {
        reservation: {
          include: {
            customer: {
              select: USER_BASIC_SELECT
            },
            facility: {
              select: FACILITY_BASIC_SELECT
            }
          }
        }
      }
    });
  }

  async findAllContracts({
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
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const reservationWhere = {};
    if (facilityId) {
      reservationWhere.facility_id = parseInt(facilityId, 10);
    }
    if (customerId) {
      reservationWhere.customer_id = parseInt(customerId, 10);
    }
    if (providerId) {
      reservationWhere.facility = {
        provider_id: parseInt(providerId, 10)
      };
    }
    if (Object.keys(reservationWhere).length > 0) {
      where.reservation = reservationWhere;
    }

    if (startDate) {
      where.start_date = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.end_date = { lte: new Date(endDate) };
    }

    if (search && search.trim() !== '') {
      const keyword = search.trim();
      where.OR = [
        { contract_code: { contains: keyword, mode: 'insensitive' } },
        {
          reservation: {
            customer: {
              OR: [
                { full_name: { contains: keyword, mode: 'insensitive' } },
                { email: { contains: keyword, mode: 'insensitive' } },
                { phone_number: { contains: keyword, mode: 'insensitive' } }
              ]
            }
          }
        },
        {
          reservation: {
            facility: {
              OR: [
                { name: { contains: keyword, mode: 'insensitive' } },
                { address: { contains: keyword, mode: 'insensitive' } },
                {
                  provider: {
                    OR: [
                      { full_name: { contains: keyword, mode: 'insensitive' } },
                      { phone_number: { contains: keyword, mode: 'insensitive' } },
                      { email: { contains: keyword, mode: 'insensitive' } }
                    ]
                  }
                }
              ]
            }
          }
        },
        {
          reservation: {
            vehicle_info: { contains: keyword, mode: 'insensitive' }
          }
        }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [totalMatching, records, totalAll, totalActive, totalPending] = await Promise.all([
      prisma.confirmation_Record.count({ where }),
      prisma.confirmation_Record.findMany({
        where,
        include: {
          reservation: {
            include: {
              customer: {
                select: USER_BASIC_SELECT
              },
              facility: {
                select: {
                  ...FACILITY_WITH_PROVIDER_SELECT,
                  capacity: true,
                  provider_id: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.confirmation_Record.count(),
      prisma.confirmation_Record.count({ where: { status: 'ACTIVE' } }),
      prisma.confirmation_Record.count({ where: { status: 'PENDING_SIGNATURE' } })
    ]);

    const activeContracts = await prisma.confirmation_Record.findMany({
      where: { status: 'ACTIVE' },
      select: { agreed_price: true }
    });
    const totalActiveMonthlyRevenue = activeContracts.reduce(
      (sum, item) => sum + Number(item.agreed_price || 0),
      0
    );

    return {
      records,
      pagination: {
        total: totalMatching,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(totalMatching / limitNum) || 1
      },
      summary: {
        total_all: totalAll,
        total_active: totalActive,
        total_pending_signature: totalPending,
        total_matching: totalMatching,
        total_active_monthly_revenue: totalActiveMonthlyRevenue
      }
    };
  }

  async findActiveCustomersByFacility({
    providerId,
    facilityId = null,
    search = '',
    page = 1,
    limit = 20
  }) {
    const reservationWhere = {
      facility: {
        provider_id: parseInt(providerId, 10)
      }
    };

    if (facilityId) {
      reservationWhere.facility_id = parseInt(facilityId, 10);
    }

    const where = {
      status: 'ACTIVE',
      reservation: reservationWhere
    };

    if (search && search.trim() !== '') {
      const keyword = search.trim();
      where.OR = [
        { contract_code: { contains: keyword, mode: 'insensitive' } },
        {
          reservation: {
            customer: {
              OR: [
                { full_name: { contains: keyword, mode: 'insensitive' } },
                { email: { contains: keyword, mode: 'insensitive' } },
                { phone_number: { contains: keyword, mode: 'insensitive' } }
              ]
            }
          }
        },
        {
          reservation: {
            vehicle_info: { contains: keyword, mode: 'insensitive' }
          }
        }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [totalMatching, records, totalActiveForProvider] = await Promise.all([
      prisma.confirmation_Record.count({ where }),
      prisma.confirmation_Record.findMany({
        where,
        include: {
          reservation: {
            include: {
              customer: {
                select: USER_BASIC_SELECT
              },
              facility: {
                select: {
                  ...FACILITY_BASIC_SELECT,
                  capacity: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.confirmation_Record.count({
        where: {
          status: 'ACTIVE',
          reservation: {
            facility: {
              provider_id: parseInt(providerId, 10)
            }
          }
        }
      })
    ]);

    const activeContracts = await prisma.confirmation_Record.findMany({
      where: {
        status: 'ACTIVE',
        reservation: reservationWhere
      },
      select: { agreed_price: true }
    });
    const totalMonthlyRevenue = activeContracts.reduce(
      (sum, item) => sum + Number(item.agreed_price || 0),
      0
    );

    return {
      records,
      pagination: {
        total: totalMatching,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(totalMatching / limitNum) || 1
      },
      summary: {
        total_active_customers: totalActiveForProvider,
        total_matching: totalMatching,
        total_monthly_revenue: totalMonthlyRevenue
      }
    };
  }

  async updateSnapshotAndEndDate(id, updatedSnapshot, newEndDate = null) {
    const updateData = {
      contract_snapshot: updatedSnapshot
    };

    if (newEndDate) {
      updateData.end_date = new Date(newEndDate);
    }

    return await prisma.confirmation_Record.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      include: {
        reservation: {
          include: {
            customer: {
              select: USER_WITH_ADDRESS_SELECT
            },
            facility: {
              select: {
                ...FACILITY_WITH_PROVIDER_SELECT,
                provider_id: true
              }
            }
          }
        }
      }
    });
  }

  async findExtensionRequestsByCustomerId(customerId) {
    const records = await prisma.confirmation_Record.findMany({
      where: {
        reservation: {
          customer_id: parseInt(customerId, 10)
        }
      },
      include: {
        reservation: {
          include: {
            facility: {
              select: FACILITY_WITH_PROVIDER_SELECT
            }
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    return records.filter((r) => {
      const snap = r.contract_snapshot;
      return snap && (snap.extension_request || (Array.isArray(snap.extension_history) && snap.extension_history.length > 0));
    });
  }

  async findExtensionRequestsByProviderId(providerId) {
    const records = await prisma.confirmation_Record.findMany({
      where: {
        reservation: {
          facility: {
            provider_id: parseInt(providerId, 10)
          }
        }
      },
      include: {
        reservation: {
          include: {
            customer: {
              select: USER_BASIC_SELECT
            },
            facility: {
              select: FACILITY_BASIC_SELECT
            }
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    return records.filter((r) => {
      const snap = r.contract_snapshot;
      return snap && (snap.extension_request || (Array.isArray(snap.extension_history) && snap.extension_history.length > 0));
    });
  }

  async updateStatusAndSnapshot(id, status, updatedSnapshot) {
    const updateData = {
      contract_snapshot: updatedSnapshot
    };
    if (status) {
      updateData.status = status;
    }

    return await prisma.confirmation_Record.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      include: {
        reservation: {
          include: {
            customer: {
              select: USER_WITH_ADDRESS_SELECT
            },
            facility: {
              select: {
                ...FACILITY_WITH_PROVIDER_SELECT,
                provider_id: true,
                capacity: true,
                available_slots: true
              }
            }
          }
        }
      }
    });
  }

  async findTerminationRequestsByCustomerId(customerId) {
    const records = await prisma.confirmation_Record.findMany({
      where: {
        reservation: {
          customer_id: parseInt(customerId, 10)
        }
      },
      include: {
        reservation: {
          include: {
            facility: {
              select: FACILITY_WITH_PROVIDER_SELECT
            }
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    return records.filter((r) => {
      const snap = r.contract_snapshot;
      return snap && (snap.termination_request || (Array.isArray(snap.termination_history) && snap.termination_history.length > 0));
    });
  }

  async findTerminationRequestsByProviderId(providerId) {
    const records = await prisma.confirmation_Record.findMany({
      where: {
        reservation: {
          facility: {
            provider_id: parseInt(providerId, 10)
          }
        }
      },
      include: {
        reservation: {
          include: {
            customer: {
              select: USER_BASIC_SELECT
            },
            facility: {
              select: FACILITY_BASIC_SELECT
            }
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    return records.filter((r) => {
      const snap = r.contract_snapshot;
      return snap && (snap.termination_request || (Array.isArray(snap.termination_history) && snap.termination_history.length > 0));
    });
  }
}

module.exports = new ConfirmationRecordRepository();
