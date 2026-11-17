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

  async findAllContractsForRevenue({ yearStart, nextYearStart, facilityId, providerId }) {
    const where = {
      status: { in: ['ACTIVE', 'TERMINATED'] },
      start_date: { lt: nextYearStart },
      end_date: { gte: yearStart },
    };

    if (facilityId) {
      where.reservation = { facility_id: Number(facilityId) };
    } else if (providerId) {
      where.reservation = { facility: { provider_id: Number(providerId) } };
    }

    return prisma.confirmation_Record.findMany({
      where,
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
            customer: {
              select: {
                id: true,
                full_name: true,
                phone_number: true,
                email: true
              }
            },
            facility: {
              select: {
                id: true,
                name: true,
                address: true,
                capacity: true,
                price_per_month: true,
                provider: {
                  select: {
                    id: true,
                    full_name: true,
                    phone_number: true,
                    email: true
                  }
                }
              }
            },
          },
        },
      },
      orderBy: { start_date: 'asc' },
    });
  }

  async findAllFacilitiesForFilter() {
    return prisma.facility.findMany({
      where: {
        verification_status: 'APPROVED'
      },
      select: {
        id: true,
        name: true,
        address: true,
        capacity: true,
        provider: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findAvailableYears() {
    const records = await prisma.confirmation_Record.findMany({
      where: {
        status: { in: ['ACTIVE', 'TERMINATED'] }
      },
      select: { start_date: true, end_date: true }
    });
    const current = new Date().getFullYear();
    const yearsSet = new Set([current, current + 1]);
    records.forEach((r) => {
      if (r.start_date) yearsSet.add(new Date(r.start_date).getUTCFullYear());
      if (r.end_date) yearsSet.add(new Date(r.end_date).getUTCFullYear());
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }
}

module.exports = new ProviderRevenueRepository();
