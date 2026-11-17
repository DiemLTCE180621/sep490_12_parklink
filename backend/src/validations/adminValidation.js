const validateProviderRevenueQuery = (req, res, next) => {
  const { year, month, facility_id, provider_id } = req.query;

  if (year !== undefined && year !== '') {
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return res.status(400).json({
        status: 'fail',
        message: 'Năm thống kê không hợp lệ (hỗ trợ từ năm 2000 đến 2100).'
      });
    }
  }

  if (month !== undefined && month !== '') {
    const parsedMonth = Number(month);
    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tháng thống kê không hợp lệ (từ tháng 1 đến tháng 12).'
      });
    }
  }

  if (facility_id !== undefined && facility_id !== '') {
    const parsedFacilityId = parseInt(facility_id, 10);
    if (isNaN(parsedFacilityId) || parsedFacilityId <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Mã bãi đỗ xe không hợp lệ.'
      });
    }
  }

  if (provider_id !== undefined && provider_id !== '') {
    const parsedProviderId = parseInt(provider_id, 10);
    if (isNaN(parsedProviderId) || parsedProviderId <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Mã chủ bãi đỗ xe không hợp lệ.'
      });
    }
  }

  next();
};

module.exports = {
  validateProviderRevenueQuery
};
