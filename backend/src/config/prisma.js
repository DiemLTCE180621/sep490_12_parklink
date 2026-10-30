const { PrismaClient } = require('@prisma/client');

// Khởi tạo một singleton instance của PrismaClient dùng chung cho toàn bộ ứng dụng
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
