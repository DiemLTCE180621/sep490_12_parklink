const prisma = require('../config/prisma');

class AmenityRepository {
  async findAll({ keyword, is_active, type, page, limit } = {}) {
    const where = {};

    if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
      const cleanKeyword = keyword.trim();
      where.name = { contains: cleanKeyword, mode: 'insensitive' };
    }

    if (typeof is_active === 'boolean') {
      where.is_active = is_active;
    }

    if (type && typeof type === 'string' && type.trim() !== '') {
      where.type = type.trim();
    }

    if (page !== undefined && limit !== undefined) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [amenities, total] = await Promise.all([
        prisma.amenity.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { id: 'asc' },
          include: {
            _count: {
              select: { facility_amenities: true }
            }
          }
        }),
        prisma.amenity.count({ where })
      ]);

      return {
        amenities,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      };
    }

    return await prisma.amenity.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { facility_amenities: true }
        }
      }
    });
  }

  async findActive() {
    return await prisma.amenity.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        id: 'asc'
      }
    });
  }

  async findById(id) {
    return await prisma.amenity.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        _count: {
          select: { facility_amenities: true }
        }
      }
    });
  }

  async findByName(name) {
    if (!name) return null;
    return await prisma.amenity.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });
  }

  async create(data) {
    return await prisma.amenity.create({
      data
    });
  }

  async update(id, data) {
    return await prisma.amenity.update({
      where: {
        id: Number(id)
      },
      data
    });
  }

  async countFacilitiesUsingAmenity(id) {
    return await prisma.facility_Amenity.count({
      where: {
        amenity_id: Number(id)
      }
    });
  }
}

module.exports = new AmenityRepository();
