import axios from 'axios';

const OPEN_API_V2_BASE = 'https://provinces.open-api.vn/api/v2';

// Service lấy dữ liệu địa chính từ Open API v2
const addressService = {
  // Lấy danh sách Tỉnh / Thành phố
  getProvinces: async () => {
    try {
      const res = await axios.get(`${OPEN_API_V2_BASE}/p/`);
      return res.data || [];
    } catch (err) {
      console.error('Lỗi khi tải danh sách Tỉnh/Thành Phố:', err);
      return [];
    }
  },

  // Lấy danh sách Phường / Xã theo Tỉnh
  getWardsByProvince: async (provinceCode) => {
    if (!provinceCode) return [];
    try {
      const res = await axios.get(`${OPEN_API_V2_BASE}/p/${provinceCode}?depth=2`);
      return res.data?.wards || [];
    } catch (err) {
      console.error(`Lỗi khi tải Phường/Xã của tỉnh ${provinceCode}:`, err);
      return [];
    }
  }
};

export default addressService;
