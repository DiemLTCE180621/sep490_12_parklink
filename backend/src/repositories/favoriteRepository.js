const prisma = require("../config/prisma");

class FavoriteRepository {
  async addFavorite(customerId, facilityId) {
    return await prisma.favorite.create({
      data: {
        customer_id: customerId,
        facility_id: facilityId
      }
    });
  }

  async removeFavorite(customerId, facilityId) {
    return await prisma.favorite.deleteMany({
      where: {
        customer_id: customerId,
        facility_id: facilityId
      }
    });
  }

  async checkFavoriteExists(customerId, facilityId) {
    const record = await prisma.favorite.findUnique({
      where: {
        customer_id_facility_id: {
          customer_id: customerId,
          facility_id: facilityId
        }
      }
    });
    return !!record;
  }

  async getFavoritesByCustomer(customerId) {
    return await prisma.favorite.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: "desc" },
      include: {
        facility: {
          include: {
            images: true,
            facility_amenities: {
              include: { amenity: true }
            },
            reviews: {
              where: { status: "VISIBLE" },
              select: { rating: true }
            }
          }
        }
      }
    });
  }
}

module.exports = new FavoriteRepository();
