const facilityRepository = require('../repositories/facilityRepository');

class FacilityService {
  /**
   * Tìm kiếm bãi đỗ xe theo keyword, loại xe, tiện ích và khoảng cách (location)
   */
  async searchFacilities({ keyword, vehicle_type, amenities, lat, lng, radius }) {
    const facilities = await facilityRepository.searchActiveFacilities({ keyword, vehicle_type, amenities });

    if (!lat || !lng) {
      return facilities;
    }

    // Tính khoảng cách nếu có tọa độ GPS
    const facilitiesWithDistance = facilities.map(facility => {
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
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
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
  async compareFacilities(ids) {
    // Validate số lượng: phải từ 2 đến 4 bãi
    if (!ids || ids.length < 2 || ids.length > 4) {
      throw new Error('Vui lòng chọn từ 2 đến 4 bãi đỗ xe để so sánh.');
    }

    // Lấy dữ liệu thô từ repository
    const facilities = await facilityRepository.findByIdsForCompare(ids);

    // Kiểm tra xem tất cả ID có tồn tại và đang ACTIVE không
    if (facilities.length !== ids.length) {
      const foundIds = facilities.map(f => f.id);
      const notFoundIds = ids.filter(id => !foundIds.includes(id));
      throw new Error(`Không tìm thấy hoặc bãi đỗ xe không còn hoạt động (ID: ${notFoundIds.join(', ')})`);
    }

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

      return {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        price_per_month: parseFloat(facility.price_per_month),
        capacity: facility.capacity,
        // Số chỗ còn trống (chức năng này có thể mở rộng sau, hiện tại trả về null)
        available_slots: null,
        amenities,
        latitude: facility.latitude,
        longitude: facility.longitude,
        image_url: primaryImage?.image_url || null,
        avg_rating: avgRating ? parseFloat(avgRating) : null,
        total_reviews: ratings.length
      };
    });

    return comparisonMatrix;
  }

  async getFacilityById(id) {
    const facilityRepository = require('../repositories/facilityRepository');
    return await facilityRepository.findById(id);
  }
}

module.exports = new FacilityService();
