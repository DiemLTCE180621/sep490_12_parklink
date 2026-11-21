const prisma = require('../config/prisma');

/**
 * Repository chịu trách nhiệm truy vấn bảng Role qua Prisma Client
 */
class RoleRepository {
  /**
   * Tìm kiếm Role theo tên (CUSTOMER, PROVIDER, ADMIN)
   * @param {string} name 
   * @returns {Promise<Object|null>}
   */
  async findByName(name) {
    return await prisma.role.findUnique({
      where: { name }
    });
  }

  /**
   * Tạo role mới (nếu chưa có)
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async createRole(data) {
    return await prisma.role.create({
      data
    });
  }
}

module.exports = new RoleRepository();
