const facilityRepository = require('../repositories/facilityRepository');
const vehicleTypeRepository = require('../repositories/vehicleTypeRepository');

class FacilityService {
  /**
   * Tìm kiếm bãi đỗ xe theo keyword, loại xe, tiện ích và khoảng cách (location)
   */
  async searchFacilities({ keyword, vehicle_type, amenities, lat, lng, radius, bounds, minPrice, maxPrice }) {
    const facilities = await facilityRepository.searchActiveFacilities({
      keyword,
      vehicle_type,
      amenities,
      bounds,
      minPrice,
      maxPrice
    });

    const activeContractsByFacility = await Promise.all(
      facilities.map(async (facility) => [
        facility.id,
        await facilityRepository.getActiveContractsCount(facility.id)
      ])
    );
    const activeContractsMap = new Map(activeContractsByFacility);

    const facilitiesWithRatings = facilities.map((facility) => {
      const ratings = facility.reviews || [];
      const avgRating = ratings.length > 0
        ? parseFloat((ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length).toFixed(1))
        : null;

      const activeContracts = activeContractsMap.get(facility.id) || 0;
      const actualAvailableSlots = Math.max(0, facility.capacity - activeContracts);

      return {
        ...facility,
        active_contracts: activeContracts,
        available_slots: actualAvailableSlots,
        avg_rating: avgRating,
        total_reviews: ratings.length,
      };
    });

    if (bounds) {
      return facilitiesWithRatings.filter((facility) => (
        facility.latitude !== null &&
        facility.longitude !== null
      ));
    }

    const hasLocation = (
      lat !== null &&
      lat !== undefined &&
      lng !== null &&
      lng !== undefined &&
      Number.isFinite(Number(lat)) &&
      Number.isFinite(Number(lng))
    );
    if (!hasLocation) {
      return facilitiesWithRatings;
    }

    const effectiveRadius = Number.isFinite(Number(radius)) && Number(radius) > 0
      ? Number(radius)
      : 3;

    //calculate distant
    const facilitiesWithDistance = facilitiesWithRatings.map(facility => {
      if (!facility.latitude || !facility.longitude) return { ...facility, distance: null };

      const distance = this.calculateDistance(lat, lng, facility.latitude, facility.longitude);
      return { ...facility, distance };
    });

    const withinRadius = facilitiesWithDistance
      .filter(f => f.distance !== null && f.distance <= effectiveRadius)
      .sort((a, b) => a.distance - b.distance);

    return withinRadius;
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

  //compare
  async compareFacilities(ids, location = {}) {
    const normalizedIds = Array.isArray(ids)
      ? ids
        .map(id => Number(id))
        .filter(id => Number.isInteger(id) && id > 0)
      : [];

    //validate number
    if (
      normalizedIds.length < 2 ||
      normalizedIds.length > 4 ||
      new Set(normalizedIds).size !== normalizedIds.length
    ) {
      throw new Error('Vui lòng chọn từ 2 đến 4 bãi đỗ xe để so sánh.');
    }

    //fetch data from repo
    const facilities = await facilityRepository.findByIdsForCompare(normalizedIds);

    //check if id active 
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

    //compare matric
    const comparisonMatrix = facilities.map(facility => {
      //rating
      const ratings = facility.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
        : null;

      const primaryImage = facility.images.find(img => img.is_primary) || facility.images[0] || null;

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

    const [facility, allVehicleTypes] = await Promise.all([
      facilityRepository.getFacilityDetails(facilityId),
      vehicleTypeRepository.findAll()
    ]);
    if (!facility) {
      throw new Error('Không tìm thấy bãi đỗ xe hoặc bãi đỗ xe không hoạt động');
    }

    const activeContractsCount = await facilityRepository.getActiveContractsCount(facilityId);
    const availableSlots = Math.max(0, facility.capacity - activeContractsCount);

    let parsedRawTypes = [];
    if (Array.isArray(facility.vehicle_types)) {
      parsedRawTypes = facility.vehicle_types;
    } else if (typeof facility.vehicle_types === 'string') {
      try {
        const parsed = JSON.parse(facility.vehicle_types);
        if (Array.isArray(parsed)) parsedRawTypes = parsed;
      } catch (e) {
        parsedRawTypes = [];
      }
    }

    // Giữ lại toàn bộ loại xe cơ sở đã đăng ký từ trước, kể cả khi Admin tắt is_active sau này
    const vehicleTypeByCode = new Map(allVehicleTypes.map((vt) => [vt.type_code, vt]));
    let registeredFacilityVehicleTypes = [];
    if (Array.isArray(facility.facility_vehicle_types) && facility.facility_vehicle_types.length > 0) {
      registeredFacilityVehicleTypes = facility.facility_vehicle_types.filter(
        (fvt) => Boolean(fvt.vehicle_type)
      );
    } else {
      registeredFacilityVehicleTypes = parsedRawTypes
        .map((item) => {
          const code = typeof item === 'string' ? item : item?.type_code || item?.id;
          const vt = vehicleTypeByCode.get(code);
          return vt ? { facility_id: facilityId, vehicle_type_id: vt.id, vehicle_type: vt } : null;
        })
        .filter(Boolean);
    }

    //format data
    const ratings = facility.reviews.map(r => r.rating);
    const avgRating = ratings.length > 0
      ? parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1))
      : null;

    return {
      ...facility,
      avg_rating: avgRating,
      total_reviews: ratings.length,
      facility_vehicle_types: registeredFacilityVehicleTypes,
      vehicle_types: registeredFacilityVehicleTypes.map((fvt) => fvt.vehicle_type.type_code),
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

    //count active contract
    const activeContractsCount = await facilityRepository.getActiveContractsCount(facilityId);

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
