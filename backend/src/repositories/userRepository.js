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
   * Cập nhật mật khẩu mới và hủy cờ yêu cầu đổi mật khẩu
   */
  async updateUserPassword(userId, newPasswordHash) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
        requires_password_change: false
      },
      include: {
        role: true,
        facility: true
      }
    });
  }

  /**
   * Lấy danh sách các bãi đỗ xe chờ phê duyệt cho Admin kèm Tiện ích và Hình ảnh
   */
}

module.exports = new UserRepository();
