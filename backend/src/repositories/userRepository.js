const prisma = require('../config/prisma');

class UserRepository {
  
  async findAmenities() {
    return await prisma.amenity.findMany({
      orderBy: { id: 'asc' }
    });
  }

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

  async findByPhoneExceptId(phone_number, userId) {
    return await prisma.user.findFirst({
      where: {
        phone_number,
        id: { not: userId }
      }
    });
  }

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

  async createUser(userData) {
    return await prisma.user.create({
      data: userData,
      include: {
        role: true
      }
    });
  }

  async createProviderWithFacility(userData, facilityData, amenityIds = [], images = []) {
    return await prisma.$transaction(async (tx) => {
      
      const newUser = await tx.user.create({
        data: userData
      });

      const newFacility = await tx.facility.create({
        data: {
          ...facilityData,
          provider_id: newUser.id
        }
      });

      if (amenityIds && amenityIds.length > 0) {
        await tx.facility_Amenity.createMany({
          data: amenityIds.map(amenityId => ({
            facility_id: newFacility.id,
            amenity_id: parseInt(amenityId, 10)
          }))
        });
      }

      if (images && images.length > 0) {
        await tx.facility_Image.createMany({
          data: images.map((url, idx) => ({
            facility_id: newFacility.id,
            image_url: url,
            is_primary: idx === 0
          }))
        });
      }

      // 5. Liên kết Danh mục loại phương tiện (Facility_Vehicle_Type)
      const vehicleCodes = Array.isArray(facilityData.vehicle_types)
        ? facilityData.vehicle_types
        : (typeof facilityData.vehicle_types === 'string' ? JSON.parse(facilityData.vehicle_types) : []);

      if (vehicleCodes && vehicleCodes.length > 0) {
        const foundVehicleTypes = await tx.vehicle_Type.findMany({
          where: {
            type_code: { in: vehicleCodes }
          }
        });

        if (foundVehicleTypes.length > 0) {
          await tx.facility_Vehicle_Type.createMany({
            data: foundVehicleTypes.map(vt => ({
              facility_id: newFacility.id,
              vehicle_type_id: vt.id
            })),
            skipDuplicates: true
          });
        }
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
              },
              facility_vehicle_types: {
                include: {
                  vehicle_type: true
                }
              }
            }
          }
        }
      });
    });
  }

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

  async blockProviderAndHideFacility(userId, facilityId) {
    return await prisma.$transaction(async (tx) => {
      
      await tx.facility.update({
        where: { id: facilityId },
        data: { visibility_status: 'HIDDEN' }
      });

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

  async blockCustomerAndCancelPendingReservations(userId) {
    return await prisma.$transaction(async (tx) => {
      
      await tx.reservation_Request.updateMany({
        where: {
          customer_id: userId,
          status: 'PENDING'
        },
        data: {
          status: 'CANCELLED'
        }
      });

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
