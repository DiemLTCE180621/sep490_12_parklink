const prisma = require('../config/prisma');

/**
 * Repository chịu trách nhiệm giao tiếp với Database thông qua Prisma Client 
 * cho riêng đối tượng Nhân viên khảo sát thực địa (Field Inspector)
 */
class FieldInspectorRepository {
  /**
   * Tìm tài khoản theo Email
   * @param {string} email 
   */
  async findInspectorByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });
  }

  /**
   * Tìm tài khoản Nhân viên khảo sát theo ID
   * @param {number} id 
   */
  async findInspectorById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        status: true,
        requires_password_change: true,
        created_at: true,
        updated_at: true,
        role: true
      }
    });
  }

  /**
   * Tạo tài khoản Nhân viên khảo sát thực địa mới
   * @param {object} userData 
   */
  async createInspector(userData) {
    return await prisma.user.create({
      data: userData,
      include: { role: true }
    });
  }

  /**
   * Lấy danh sách tài khoản Nhân viên khảo sát thực địa kèm phân trang & tìm kiếm
   * @param {object} params - { search, page, limit }
   */
  async findInspectorsPaginated({ search, page = 1, limit = 10 }) {
    const where = {
      role: {
        name: 'FIELD_INSPECTOR'
      }
    };

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone_number: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [inspectors, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          email: true,
          full_name: true,
          phone_number: true,
          status: true,
          requires_password_change: true,
          created_at: true,
          updated_at: true,
          role: true
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: inspectors,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit) || 1,
        limit
      }
    };
  }

  /**
   * Cập nhật thông tin tài khoản Nhân viên khảo sát thực địa theo ID
   * @param {number} id 
   * @param {object} data 
   */
  async updateInspector(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        status: true,
        requires_password_change: true,
        created_at: true,
        updated_at: true,
        role: true
      }
    });
  }
}

module.exports = new FieldInspectorRepository();
