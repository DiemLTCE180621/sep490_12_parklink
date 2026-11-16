const prisma = require('../config/prisma');

class TransactionRepository {
  async findHistory(where, page, limit) {
    const [total, transactions, completed] = await Promise.all([
      prisma.system_Transaction.count({ where }),
      prisma.system_Transaction.findMany({
        where,
        select: {
          id: true, amount: true, transaction_type: true, status: true,
          created_at: true, facility_id: true,
          facility: { select: { name: true } },
          provider: { select: { id: true, full_name: true, email: true } },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      where.status && where.status !== 'COMPLETED'
        ? Promise.resolve({ _sum: { amount: 0 } })
        : prisma.system_Transaction.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true },
        }),
    ]);
    return { total, transactions, completedAmount: completed._sum.amount };
  }
}

module.exports = new TransactionRepository();
