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
