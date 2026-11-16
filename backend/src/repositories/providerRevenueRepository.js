const prisma = require('../config/prisma');

class ProviderRevenueRepository {
  async findContractsForYear(providerId, yearStart, nextYearStart) {
    return prisma.confirmation_Record.findMany({
      where: {
        status: { in: ['ACTIVE', 'TERMINATED'] },
        start_date: { lt: nextYearStart },
        end_date: { gte: yearStart },
        reservation: { facility: { provider_id: Number(providerId) } },
      },
      select: {
        id: true,
        contract_code: true,
        agreed_price: true,
        start_date: true,
        end_date: true,
        status: true,
        contract_snapshot: true,
        reservation: {
          select: {
            customer: { select: { id: true, full_name: true } },
            facility: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { start_date: 'asc' },
    });
  }
}

module.exports = new ProviderRevenueRepository();
