const transactionService = require('../services/transactionService');

const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

class TransactionController {
  async getHistory(req, res, next) {
    try {
      const { status, from, to } = req.query;
      const page = req.query.page === undefined ? 1 : Number(req.query.page);
      const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
      if (!Number.isSafeInteger(page) || page < 1 ||
          !Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
          (status && !['PENDING', 'COMPLETED', 'FAILED'].includes(status)) ||
          (from && !validDate(from)) || (to && !validDate(to)) ||
          (from && to && from > to)) {
        return res.status(400).json({ status: 'fail', message: 'Bộ lọc giao dịch không hợp lệ.' });
      }
      const data = await transactionService.getHistory({
        role: req.user.role, userId: req.user.userId || req.user.id,
        page, limit, status, from, to,
      });
      return res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransactionController();
