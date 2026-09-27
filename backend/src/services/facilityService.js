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
}

module.exports = new FacilityService();
