const prisma = require('../config/prisma');

/**
 * Chỉ giao tiếp với bảng platform_fees 
 */
class PlatformFeeRepository {
  /**
   * Lấy toàn bộ danh sách cấu hình đơn giá biểu phí 
   */
  async findAll() {
    return await prisma.platform_Fee.findMany({
      orderBy: {
        min_slots: 'asc'
      }
    });
  }

  /**
   * Lấy danh sách các đơn giá đang hoạt động 
   */
  async findActiveFees() {
    return await prisma.platform_Fee.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        min_slots: 'asc'
      }
    });
  }

  /**
   * Lấy cấu hình đơn giá biểu phí đang áp dụng (Active)
   */
  async findActiveFee() {
    return await prisma.platform_Fee.findFirst({
      where: {
        is_active: true
      },
      orderBy: {
        updated_at: 'desc'
      }
    });
  }

  /**
   * Tìm biểu phí theo ID
   */
  async findById(id) {
    return await prisma.platform_Fee.findUnique({
      where: { id }
    });
  }

  /**
   * Tìm biểu phí theo tên
   */
  async findByName(name) {
    return await prisma.platform_Fee.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive' // Tìm kiếm không phân biệt chữ hoa thường
        }
      }
    });
  }

  /**
   * Tìm biểu phí phù hợp dựa trên số lượng slot 
   */
  async findFeeBySlots(slots) {
    return await prisma.platform_Fee.findFirst({
      where: {
        is_active: true,
        min_slots: { lte: slots },
        OR: [
          { max_slots: { gte: slots } },
          { max_slots: null }
        ]
      },
      orderBy: {
        min_slots: 'desc'
      }
    });
  }

  /**
   * Tạo mới một gói biểu phí nền tảng
   */
  async create(data) {
    return await prisma.platform_Fee.create({
      data
    });
  }

  /**
   * Cập nhật thông tin gói biểu phí nền tảng
   */
  async update(id, data) {
    return await prisma.platform_Fee.update({
      where: { id },
      data
    });
  }

  /**
   * Cập nhật trạng thái kích hoạt 
   */
  async updateStatus(id, isActive) {
    return await prisma.platform_Fee.update({
      where: { id },
      data: {
        is_active: isActive
      }
    });
  }
}

module.exports = new PlatformFeeRepository();
