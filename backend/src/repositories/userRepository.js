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
   * Tìm user theo số điện thoại ngoại trừ ID hiện tại (dùng cho kiểm tra trùng lặp khi cập nhật thông tin)
   */
  async findByPhoneExceptId(phone_number, userId) {
    return await prisma.user.findFirst({
      where: {
        phone_number,
        id: { not: userId }
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
          address: true,
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
        address: true,
        status: true,
        requires_password_change: true,
        created_at: true,
        updated_at: true,
        role: true,
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            capacity: true,
            available_slots: true,
            price_per_month: true,
            verification_status: true,
            payment_status: true,
            visibility_status: true
          }
        },
        assigned_facilities: {
          select: {
            id: true,
            name: true,
            address: true,
            verification_status: true
          }
        },
        _count: {
          select: {
            reservations: true
          }
        }
      }
    });
  }

  /**
   * Cập nhật thông tin tài khoản người dùng theo ID
   */
  async updateUser(id, data) {
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
        role: true,
        facility: {
          select: {
            id: true,
            name: true,
            visibility_status: true
          }
        }
      }
    });
  }

  /**
   * Khóa tài khoản Provider đồng thời ẩn luôn cơ sở bãi đỗ xe (visibility_status = 'HIDDEN') trong một Transaction
   * @param {number} userId - ID người dùng (Provider)
   * @param {number} facilityId - ID cơ sở bãi đỗ xe
   */
  async blockProviderAndHideFacility(userId, facilityId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái hiển thị của cơ sở bãi đỗ xe thành HIDDEN (ẩn khỏi tìm kiếm/đặt chỗ)
      await tx.facility.update({
        where: { id: facilityId },
        data: { visibility_status: 'HIDDEN' }
      });

      // 2. Cập nhật trạng thái tài khoản người dùng thành BLOCKED
      return await tx.user.update({
        where: { id: userId },
        data: { status: 'BLOCKED' },
        select: {
          id: true,
          email: true,
          full_name: true,
          phone_number: true,
          status: true,
          requires_password_change: true,
          created_at: true,
          updated_at: true,
          role: true,
          facility: {
            select: {
              id: true,
              name: true,
              visibility_status: true
            }
          }
        }
      });
    });
  }

  /**
   * Khóa tài khoản Customer và tự động hủy các yêu cầu đặt chỗ đang PENDING
   */
  async blockCustomerAndCancelPendingReservations(userId) {
    return await prisma.$transaction(async (tx) => {
      // Hủy các yêu cầu đặt chỗ đang chờ duyệt của Customer
      await tx.reservation_Request.updateMany({
        where: {
          customer_id: userId,
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED'
        }
      });

      // Cập nhật trạng thái người dùng thành BLOCKED
      return await tx.user.update({
        where: { id: userId },
        data: { status: 'BLOCKED' },
        select: {
          id: true,
          email: true,
          full_name: true,
          phone_number: true,
          status: true,
          requires_password_change: true,
          created_at: true,
          updated_at: true,
          role: true,
          facility: {
            select: {
              id: true,
              name: true,
              visibility_status: true
            }
          }
        }
      });
    });
  }

  /**
   * Lấy thông tin liên hệ của Admin (email, số điện thoại) phục vụ hiển thị Hotline
   */
  async findAdminContact() {
    return await prisma.user.findFirst({
      where: {
        role: { name: 'ADMIN' },
        status: 'ACTIVE'
      },
      select: {
        email: true,
        phone_number: true
      },
      orderBy: { id: 'asc' }
    });
  }

  /**
   * Lấy thông tin user phục vụ middleware xác thực JWT và kiểm tra token version
   */
  async findAuthUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        status: true,
        password_hash: true,
        requires_password_change: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });
  }
}

module.exports = new UserRepository();
