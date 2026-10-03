const prisma = require('../config/prisma');

/**
 * Repository chịu trách nhiệm truy vấn bảng User, Facility, Amenity, Facility_Image và System_Transaction qua Prisma Client
 */
class UserRepository {
  /**
   * Lấy toàn bộ danh mục tiện ích từ bảng Amenity
   */
  async findAmenities() {
    return await prisma.amenity.findMany({
      orderBy: { id: 'asc' }
    });
  }

  /**
   * Tìm user theo địa chỉ email (bao gồm thông tin Role, Facility, Amenity và Images)
   */
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        facility: {
          include: {
            images: true,
            facility_amenities: {
              include: {
                amenity: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Tìm user theo ID
   */
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        facility: {
          include: {
            images: true,
            facility_amenities: {
              include: {
                amenity: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Tạo tài khoản Khách hàng (Customer) mới với mật khẩu ngẫu nhiên
   */
  async createUser(userData) {
    return await prisma.user.create({
      data: userData,
      include: {
        role: true
      }
    });
  }

  /**
   * Tạo tài khoản Provider + Bãi đỗ xe (Facility) + Tiện ích (Facility_Amenity) + 4 Ảnh bãi đỗ (Facility_Image) trong Transaction
   */
  async createProviderWithFacility(userData, facilityData, amenityIds = [], images = []) {
    return await prisma.$transaction(async (tx) => {
      // 1. Tạo User tài khoản Provider (status = PENDING)
      const newUser = await tx.user.create({
        data: userData
      });

      // 2. Tạo Cơ sở bãi đỗ xe gán provider_id bằng newUser.id
      const newFacility = await tx.facility.create({
        data: {
          ...facilityData,
          provider_id: newUser.id
        }
      });

      // 3. Liên kết Danh mục tiện ích (Facility_Amenity)
      if (amenityIds && amenityIds.length > 0) {
        await tx.facility_Amenity.createMany({
          data: amenityIds.map(amenityId => ({
            facility_id: newFacility.id,
            amenity_id: parseInt(amenityId, 10)
          }))
        });
      }

      // 4. Lưu Danh sách Hình ảnh bãi đỗ (Cổng, đường vào, trong bãi, bao quát...)
      if (images && images.length > 0) {
        await tx.facility_Image.createMany({
          data: images.map((url, idx) => ({
            facility_id: newFacility.id,
            image_url: url,
            is_primary: idx === 0
          }))
        });
      }

      return await tx.user.findUnique({
        where: { id: newUser.id },
        include: {
          role: true,
          facility: {
            include: {
              images: true,
              facility_amenities: {
                include: {
                  amenity: true
                }
              }
            }
          }
        }
      });
    });
  }

  /**
   * Cập nhật mật khẩu mới và thay đổi cờ yêu cầu đổi mật khẩu
   */
  async updateUserPassword(userId, newPasswordHash, requiresChange = false) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
        requires_password_change: requiresChange
      },
      include: {
        role: true,
        facility: true
      }
    });
  }

  /**
   * UC-Admin: Lấy danh sách tài khoản người dùng có tìm kiếm, lọc theo Role, Status và Phân trang
   */
  async findUsersPaginated({ search, role, status, page = 1, limit = 10 }) {
    const where = {};

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone_number: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role && role !== 'ALL') {
      where.role = {
        name: { equals: role, mode: 'insensitive' }
      };
    }

    if (status && status !== 'ALL') {
      where.status = { equals: status, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
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
      users,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit) || 1,
        limit
      }
    };
  }

  /**
   * UC-Admin: Lấy chi tiết thông tin tài khoản người dùng theo ID (không kèm thông tin nhạy cảm như password_hash)
   */
  async findUserDetailById(id) {
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
}

module.exports = new UserRepository();
