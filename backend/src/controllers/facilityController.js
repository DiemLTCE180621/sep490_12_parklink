const facilityService = require('../services/facilityService');

exports.searchFacilities = async (req, res) => {
  try {
    const { keyword, vehicle_type, amenities, lat, lng, radius } = req.query;

    // Parse amenities string to array if provided (e.g., '1,2,3' -> [1,2,3])
    let parsedAmenities = [];
    if (amenities) {
      parsedAmenities = amenities.split(',').map(a => parseInt(a)).filter(a => !isNaN(a));
    }

    const data = await facilityService.searchFacilities({
      keyword,
      vehicle_type,
      amenities: parsedAmenities,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      radius: radius ? parseFloat(radius) : 3 // default 3km
    });
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getAllAmenities = async (req, res) => {
  try {
    const data = await facilityService.getAllAmenities();
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * So sánh 2–4 bãi đỗ xe theo danh sách ID.
 * Query param: ids=1,2,3 (chuỗi ID cách nhau bằng dấu phẩy)
 */
exports.compareFacilities = async (req, res) => {
  try {
    const { ids } = req.query;

    // Parse chuỗi '1,2,3' thành mảng số [1, 2, 3]
    const parsedIds = ids
      ? ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
      : [];

    const data = await facilityService.compareFacilities(parsedIds);

    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    // Lỗi validation nghiệp vụ trả về 400, lỗi server trả về 500
    const statusCode = error.message.includes('Vui lòng chọn') || error.message.includes('Không tìm thấy') ? 400 : 500;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

exports.getFacilityDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await facilityService.getFacilityDetails(id);
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};

exports.getFacilityAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await facilityService.getFacilityAvailability(id);
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
    res.status(statusCode).json({ status: 'error', message: error.message });
  }
};
