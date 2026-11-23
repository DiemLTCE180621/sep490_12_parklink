const prisma = require('../config/prisma');

/**
 * Truy vấn dữ liệu loại phương tiện
 */
class VehicleTypeRepository {
  /**
   * Tìm và lọc loại phương tiện
   * @param {Object} filter - { keyword, is_active }
   * @returns {Promise<Array>} Danh sách các loại phương tiện
   */
  async findAll({ keyword, is_active } = {}) {
    const where = {};

    // Tìm kiếm theo từ khóa (mã, tên hoặc mô tả)
    if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
      const cleanKeyword = keyword.trim();
      where.OR = [
        { name: { contains: cleanKeyword, mode: 'insensitive' } },
        { type_code: { contains: cleanKeyword, mode: 'insensitive' } },
        { description: { contains: cleanKeyword, mode: 'insensitive' } }
      ];
    }

    // Lọc theo trạng thái hoạt động nếu có truyền vào
    if (typeof is_active === 'boolean') {
      where.is_active = is_active;
    }

    return await prisma.vehicle_Type.findMany({
      where,
      orderBy: {
        id: 'asc'
      },
      include: {
        _count: {
          select: { facility_vehicle_types: true }
        }
      }
    });
  }

  /**
   * Lấy danh sách các loại phương tiện đang hoạt động (Active)
   * Dùng trong danh mục chọn loại phương tiện
   * @returns {Promise<Array>}
   */
  async findActive() {
    return await prisma.vehicle_Type.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        id: 'asc'
      }
    });
  }

  /**
   * Lấy loại phương tiện theo ID
   * @param {number} id - ID của loại phương tiện
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await prisma.vehicle_Type.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        _count: {
          select: { facility_vehicle_types: true }
        }
      }
    });
  }

  /**
   * Tìm loại phương tiện theo mã code (không phân biệt hoa thường)
   * @param {string} type_code - Mã phương tiện (VD: CAR_4_5_SEATER)
   * @returns {Promise<Object|null>}
   */
  async findByCode(type_code) {
    if (!type_code) return null;
    return await prisma.vehicle_Type.findFirst({
      where: {
        type_code: {
          equals: type_code.trim(),
          mode: 'insensitive'
        }
      }
    });
  }

  /**
   * Tìm loại phương tiện theo tên (không phân biệt hoa thường)
   * @param {string} name - Tên loại phương tiện
   * @returns {Promise<Object|null>}
   */
  async findByName(name) {
    if (!name) return null;
    return await prisma.vehicle_Type.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });
  }

  /**
   * Tạo loại phương tiện
   * @param {Object} data - Dữ liệu cần tạo { type_code, name, description, is_active }
   * @returns {Promise<Object>} Bản ghi vừa tạo
   */
  async create(data) {
    return await prisma.vehicle_Type.create({
      data
    });
  }

  /**
   * Cập nhật loại phương tiện
   * @param {number} id - ID loại phương tiện cần sửa
   * @param {Object} data - Dữ liệu cập nhật
   * @returns {Promise<Object>} Bản ghi đã cập nhật
   */
  async update(id, data) {
    return await prisma.vehicle_Type.update({
      where: {
        id: Number(id)
      },
      data
    });
  }

}

module.exports = new VehicleTypeRepository();

