const favoriteRepository = require('../repositories/favoriteRepository');

class FavoriteService {
  async addFavorite(customerId, facilityId) {
    // Parse cả hai ID về integer để đảm bảo đúng kiểu dữ liệu với Prisma composite key
    const parsedCustomerId = parseInt(customerId, 10);
    const parsedFacilityId = parseInt(facilityId, 10);

    if (isNaN(parsedCustomerId) || isNaN(parsedFacilityId)) {
      throw new Error('ID không hợp lệ');
    }

    const exists = await favoriteRepository.checkFavoriteExists(parsedCustomerId, parsedFacilityId);
    if (exists) {
      throw new Error('Bãi đỗ xe đã nằm trong danh sách yêu thích');
    }

    return await favoriteRepository.addFavorite(parsedCustomerId, parsedFacilityId);
  }

  async removeFavorite(customerId, facilityId) {
    const parsedCustomerId = parseInt(customerId, 10);
    const parsedFacilityId = parseInt(facilityId, 10);

    if (isNaN(parsedCustomerId) || isNaN(parsedFacilityId)) {
      throw new Error('ID không hợp lệ');
    }

    const exists = await favoriteRepository.checkFavoriteExists(parsedCustomerId, parsedFacilityId);
    if (!exists) {
      throw new Error('Bãi đỗ xe chưa nằm trong danh sách yêu thích');
    }

    await favoriteRepository.removeFavorite(parsedCustomerId, parsedFacilityId);
    return { success: true };
  }

  async getFavorites(customerId) {
    const parsedCustomerId = parseInt(customerId, 10);
    const favorites = await favoriteRepository.getFavoritesByCustomer(parsedCustomerId);
    
    // Format data similar to search facilities
    return favorites
      .filter(fav => fav.facility.verification_status === "APPROVED" && fav.facility.visibility_status === "VISIBLE")
      .map(fav => {
        const facility = fav.facility;
        const ratings = facility.reviews.map(r => r.rating);
        const avgRating = ratings.length > 0
          ? parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1))
          : null;

        return {
          ...facility,
          avg_rating: avgRating,
          total_reviews: ratings.length,
          vehicle_types: typeof facility.vehicle_types === 'string' ? JSON.parse(facility.vehicle_types) : facility.vehicle_types,
          saved_at: fav.created_at
        };
      });
  }
}

module.exports = new FavoriteService();
