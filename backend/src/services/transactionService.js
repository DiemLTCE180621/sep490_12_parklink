const transactionRepository = require('../repositories/transactionRepository');

const dateStart = (value) => new Date(Date.parse(`${value}T00:00:00+07:00`));

class TransactionService {
  async getHistory({ role, userId, page, limit, status, from, to }) {
    const where = {};
    if (role === 'PROVIDER') where.provider_id = Number(userId);
    if (status) where.status = status;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = dateStart(from);
      if (to) {
        const next = dateStart(to);
        next.setUTCDate(next.getUTCDate() + 1);
        where.created_at.lt = next;
      }
    }
    const result = await transactionRepository.findHistory(where, page, limit);
    return {
      transactions: result.transactions.map((item) => ({
        id: item.id,
        amount: Number(item.amount),
        transaction_type: item.transaction_type,
        status: item.status,
        created_at: item.created_at,
        facility_id: item.facility_id,
        facility_name: item.facility.name,
        provider_id: item.provider.id,
        provider_name: item.provider.full_name,
        provider_email: item.provider.email,
      })),
      summary: { total: result.total, completed_amount: Number(result.completedAmount || 0) },
      pagination: { page, limit, total_pages: Math.ceil(result.total / limit) },
    };
  }
}

module.exports = new TransactionService();
