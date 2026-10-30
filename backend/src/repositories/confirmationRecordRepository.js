const prisma = require('../config/prisma');

/**
 * Repository xử lý thao tác Database cho Biên bản xác nhận / Hợp đồng điện tử (Confirmation_Record)
 */
class ConfirmationRecordRepository {
  /**
   * Tạo mới một Biên bản xác nhận điện tử
   */
  async create(data) {
    const {
      contract_code,
      reservation_id,
      agreed_price,
      payment_deadline_day,
      start_date,
      end_date,
      contract_snapshot,
      provider_agreed_at,
      status
    } = data;

    return await prisma.confirmation_Record.create({
      data: {
        contract_code,
        reservation_id: parseInt(reservation_id, 10),
        agreed_price,
        payment_deadline_day: payment_deadline_day ? parseInt(payment_deadline_day, 10) : 5,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        contract_snapshot,
        provider_agreed_at: provider_agreed_at || new Date(),
        status: status || 'PENDING_SIGNATURE'
      },
      include: {
        reservation: {
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
                price_per_month: true,
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
        }
      }
    });
  }

  /**
   * Tìm Biên bản xác nhận theo ID
   */
  async findById(id) {
    return await prisma.confirmation_Record.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        reservation: {
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
                price_per_month: true,
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
        }
      }
    });
  }

  /**
   * Tìm Biên bản xác nhận theo Reservation ID
   */
  async findByReservationId(reservationId) {
    return await prisma.confirmation_Record.findUnique({
      where: { reservation_id: parseInt(reservationId, 10) }
    });
  }

  /**
   * Lấy danh sách Biên bản xác nhận của một Khách hàng (Customer)
   */
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
              select: {
                id: true,
                name: true,
                address: true,
                price_per_month: true,
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
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Lấy danh sách Biên bản xác nhận của một Chủ bãi (Provider)
   */
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
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Khách hàng chấp nhận / xác nhận Biên bản điện tử (Cập nhật status & customer_agreed_at)
   */
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
            }
          }
        }
      }
    });
  }

  /**
   *  [ADMIN] Lấy danh sách tất cả Hợp đồng / Biên bản xác nhận trên nền tảng
   * Hỗ trợ tìm kiếm từ khóa, lọc theo trạng thái, cơ sở, ngày lập, phân trang & thống kê
   */
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

    // 1. Lọc theo trạng thái
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // 2. Lọc theo mối quan hệ Reservation
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

    // 3. Lọc theo ngày hiệu lực hợp đồng
    if (startDate) {
      where.start_date = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.end_date = { lte: new Date(endDate) };
    }

    // 4. Tìm kiếm từ khóa đa trường
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

    // Thực hiện truy vấn song song tối ưu hiệu năng
    const [totalMatching, records, totalAll, totalActive, totalPending] = await Promise.all([
      prisma.confirmation_Record.count({ where }),
      prisma.confirmation_Record.findMany({
        where,
        include: {
          reservation: {
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
                  capacity: true,
                  price_per_month: true,
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

    // Thống kê tổng doanh thu hàng tháng từ các hợp đồng đang ACTIVE
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

  /**
   *  [PROVIDER] Lấy danh sách Khách hàng đang thuê xe hiệu lực (Active) tại cơ sở bãi đỗ xe
   * Phục vụ quản lý danh sách khách thuê đỗ xe hiện hữu, kiểm tra thời hạn và thông tin phương tiện
   */
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

    // Tìm kiếm từ khóa đa trường (Tên khách hàng, SĐT, Email, Biển số xe/Thông tin xe, Mã hợp đồng)
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
                  capacity: true,
                  price_per_month: true
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

    // Tính tổng doanh thu hàng tháng từ các khách hàng đang active của cơ sở
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
}

module.exports = new ConfirmationRecordRepository();
