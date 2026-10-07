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
}

module.exports = new ConfirmationRecordRepository();
