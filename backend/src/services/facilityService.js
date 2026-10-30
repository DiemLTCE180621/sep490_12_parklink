const facilityRepository = require('../repositories/facilityRepository');

class FacilityService {
  /**
   * Tìm kiếm bãi đỗ xe theo keyword, loại xe, tiện ích và khoảng cách (location)
   */
  async searchFacilities({ keyword, vehicle_type, amenities, lat, lng, radius }) {
    const facilities = await facilityRepository.searchActiveFacilities({ keyword, vehicle_type, amenities });
    const facilitiesWithRatings = facilities.map((facility) => {
      const ratings = facility.reviews || [];
      const avgRating = ratings.length > 0
        ? parseFloat((ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length).toFixed(1))
        : null;

      return {
        ...facility,
        avg_rating: avgRating,
        total_reviews: ratings.length,
      };
    });

    if (!lat || !lng) {
      return facilitiesWithRatings;
    }

    // Tính khoảng cách nếu có tọa độ GPS
    const facilitiesWithDistance = facilitiesWithRatings.map(facility => {
      if (!facility.latitude || !facility.longitude) return { ...facility, distance: null };

      const distance = this.calculateDistance(lat, lng, facility.latitude, facility.longitude);
      return { ...facility, distance };
    });

    // Lọc theo bán kính (mặc định 3km) và sắp xếp theo khoảng cách
    return facilitiesWithDistance
      .filter(f => f.distance !== null && f.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  // Hàm tính khoảng cách bằng công thức Haversine (trả về km)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính trái đất tính bằng km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getAllAmenities() {
    return await facilityRepository.getAllAmenities();
  }

  /**
   * So sánh chi tiết 2–4 bãi đỗ xe.
   * Validate số lượng ID, gọi repository lấy dữ liệu thô,
   * rồi xây dựng ma trận so sánh (comparison matrix) chuẩn hóa để trả về frontend.
   * @param {number[]} ids - Mảng 2–4 ID bãi đỗ xe (đã được parse sang số)
   */
  async compareFacilities(ids, location = {}) {
    const normalizedIds = Array.isArray(ids)
      ? ids
        .map(id => Number(id))
        .filter(id => Number.isInteger(id) && id > 0)
      : [];

    // Validate số lượng: phải từ 2 đến 4 bãi, không được trùng ID
    if (
      normalizedIds.length < 2 ||
      normalizedIds.length > 4 ||
      new Set(normalizedIds).size !== normalizedIds.length
    ) {
      throw new Error('Vui lòng chọn từ 2 đến 4 bãi đỗ xe để so sánh.');
    }

    // Lấy dữ liệu thô từ repository
    const facilities = await facilityRepository.findByIdsForCompare(normalizedIds);

    // Kiểm tra xem tất cả ID có tồn tại và đang ACTIVE không
    if (facilities.length !== normalizedIds.length) {
      const foundIds = facilities.map(f => f.id);
      const notFoundIds = normalizedIds.filter(id => !foundIds.includes(id));
      throw new Error(`Không tìm thấy hoặc bãi đỗ xe không còn hoạt động (ID: ${notFoundIds.join(', ')})`);
    }

    const latitude = Number(location.lat);
    const longitude = Number(location.lng);
    const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);

    const activeContractsByFacility = await Promise.all(
      facilities.map(async (facility) => [
        facility.id,
        await facilityRepository.getActiveContractsCount(facility.id)
      ])
    );
    const activeContractsMap = new Map(activeContractsByFacility);

    // Xây dựng comparison matrix: chuẩn hóa dữ liệu từng bãi
    const comparisonMatrix = facilities.map(facility => {
      // Tính điểm đánh giá trung bình từ danh sách reviews
      const ratings = facility.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
        : null;

      // Lấy ảnh đại diện (primary hoặc ảnh đầu tiên)
      const primaryImage = facility.images.find(img => img.is_primary) || facility.images[0] || null;

      // Danh sách tên tiện ích
      const amenities = facility.facility_amenities.map(fa => fa.amenity.name);
      const activeContracts = activeContractsMap.get(facility.id) || 0;
      const distance = hasLocation && facility.latitude !== null && facility.longitude !== null
        ? this.calculateDistance(latitude, longitude, facility.latitude, facility.longitude)
        : null;

      return {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        price_per_month: parseFloat(facility.price_per_month),
        capacity: facility.capacity,
        active_contracts: activeContracts,
        available_slots: Math.max(facility.capacity - activeContracts, 0),
        amenities,
        latitude: facility.latitude,
        longitude: facility.longitude,
        distance,
        image_url: primaryImage?.image_url || null,
        avg_rating: avgRating ? parseFloat(avgRating) : null,
        total_reviews: ratings.length
      };
    });

    return comparisonMatrix;
  }

  async getFacilityDetails(id) {
    const facilityId = parseInt(id, 10);
    if (isNaN(facilityId)) {
      throw new Error('ID bãi đỗ xe không hợp lệ');
    }
    
    const facility = await facilityRepository.getFacilityDetails(facilityId);
    if (!facility) {
      throw new Error('Không tìm thấy bãi đỗ xe hoặc bãi đỗ xe không hoạt động');
    }

    const activeContractsCount = await facilityRepository.getActiveContractsCount(facilityId);
    const availableSlots = Math.max(0, facility.capacity - activeContractsCount);

    // Format data
    const ratings = facility.reviews.map(r => r.rating);
    const avgRating = ratings.length > 0
      ? parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1))
      : null;

    return {
      ...facility,
      avg_rating: avgRating,
      total_reviews: ratings.length,
      vehicle_types: typeof facility.vehicle_types === 'string' ? JSON.parse(facility.vehicle_types) : facility.vehicle_types,
      active_contracts: activeContractsCount,
      available_slots: availableSlots
    };
  }

  async getFacilityAvailability(id) {
    const facilityId = parseInt(id, 10);
    if (isNaN(facilityId)) {
      throw new Error('ID bãi đỗ xe không hợp lệ');
    }

    const facility = await facilityRepository.getFacilityDetails(facilityId);
    if (!facility) {
      throw new Error('Không tìm thấy bãi đỗ xe hoặc bãi đỗ xe không hoạt động');
    }

    // Đếm số lượng xe/hợp đồng đang gửi hiệu lực (ACTIVE) tại bãi
    const activeContractsCount = await facilityRepository.getActiveContractsCount(facilityId);

    // LOGIC CHUẨN: Số chỗ còn trống thực tế = Sức chứa (capacity) trừ số xe đang gửi (activeContractsCount)
    // Đảm bảo nguyên lý: Sức chứa = Đang gửi + Còn trống
    const availableSlots = Math.max(0, facility.capacity - activeContractsCount);

    return {
      facility_id: facilityId,
      capacity: facility.capacity,
      active_contracts: activeContractsCount,
      available_slots: availableSlots
    };
  }
}

module.exports = new FacilityService();
