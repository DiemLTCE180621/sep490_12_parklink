const providerRevenueRepository = require('../repositories/providerRevenueRepository');

class ProviderRevenueService {
  async getMonthlyReport(providerId, year, month) {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));
    const rows = await providerRevenueRepository.findContractsForYear(providerId, yearStart, nextYearStart);
    const contractsForMonth = (monthNumber) => {
      const monthStart = new Date(Date.UTC(year, monthNumber - 1, 1));
      const nextMonthStart = new Date(Date.UTC(year, monthNumber, 1));
      const monthStartInBangkok = new Date(monthStart.getTime() - 7 * 60 * 60 * 1000);
      return rows.filter((row) => {
        if (row.start_date >= nextMonthStart || row.end_date < monthStart) return false;
        if (row.status !== 'TERMINATED') return true;
        const terminatedAt = row.contract_snapshot?.contract_info?.terminated_at;
        return terminatedAt && new Date(terminatedAt) >= monthStartInBangkok;
      });
    };
    const contracts = contractsForMonth(month).map((row) => ({
      id: row.id,
      contract_code: row.contract_code,
      customer_id: row.reservation.customer.id,
      customer_name: row.reservation.customer.full_name,
      facility_id: row.reservation.facility.id,
      facility_name: row.reservation.facility.name,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      monthly_amount: Number(row.agreed_price),
    }));
    const monthlyTrend = Array.from({ length: 12 }, (_, index) => {
      const monthNumber = index + 1;
      const items = contractsForMonth(monthNumber);
      return {
        month: monthNumber,
        contract_count: items.length,
        revenue: items.reduce((sum, row) => sum + Number(row.agreed_price), 0),
      };
    });

    return {
      year,
      month,
      currency: 'VND',
      basis: 'CONTRACTED_MONTHLY_AMOUNT',
      total_revenue: contracts.reduce((sum, row) => sum + row.monthly_amount, 0),
      contract_count: contracts.length,
      monthly_trend: monthlyTrend,
      contracts,
    };
  }
}

module.exports = new ProviderRevenueService();
