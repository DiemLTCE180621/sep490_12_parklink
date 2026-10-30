/**
 * Service giao tiếp với hệ thống Vietmap API.
 * Tuân thủ quy tắc kiến trúc Frontend: Nơi DUY NHẤT chứa code gọi API bản đồ Vietmap.
 */

const VIETMAP_API_KEY = process.env.REACT_APP_VIETMAP_API_KEY;

/**
 * Tìm kiếm gợi ý địa chỉ theo từ khóa văn bản (Vietmap Search v3).
 * @param {string} text - Từ khóa tìm kiếm
 * @returns {Promise<Array>} Danh sách kết quả địa điểm
 */
export const searchPlaces = async (text) => {
  if (!VIETMAP_API_KEY || !text?.trim()) return [];
  try {
    const url = `https://maps.vietmap.vn/api/search/v3?apikey=${encodeURIComponent(VIETMAP_API_KEY)}&text=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Lỗi Vietmap Search: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (error) {
    console.error('Lỗi gọi API tìm kiếm Vietmap:', error);
    return [];
  }
};

/**
 * Lấy chi tiết thông tin địa điểm theo ref_id (Vietmap Place v3).
 * @param {string} refId - Mã định danh địa điểm ref_id
 * @returns {Promise<Object|null>} Thông tin chi tiết địa điểm bao gồm lat, lng
 */
export const getPlaceDetail = async (refId) => {
  if (!VIETMAP_API_KEY || !refId) return null;
  try {
    const url = `https://maps.vietmap.vn/api/place/v3?apikey=${encodeURIComponent(VIETMAP_API_KEY)}&refid=${encodeURIComponent(refId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Lỗi Vietmap Place: ${res.status}`);
    const data = await res.json();
    return data || null;
  } catch (error) {
    console.error('Lỗi lấy chi tiết địa điểm Vietmap:', error);
    return null;
  }
};

/**
 * Tìm kiếm tọa độ [lat, lng] từ từ khóa hoặc gợi ý địa chỉ.
 * @param {string} query - Chuỗi địa chỉ tìm kiếm
 * @param {Object} [suggestion] - Gợi ý địa điểm đã chọn trước đó
 * @returns {Promise<[number, number]|null>} Cặp tọa độ [lat, lng] hoặc null nếu không tìm thấy
 */
export const resolveAddressCoordinates = async (query, suggestion = null) => {
  if (!VIETMAP_API_KEY) return null;

  try {
    let coordinates = suggestion;

    // Nếu chỉ có ref_id thì lấy tọa độ qua place detail
    if ((!coordinates?.lat || !coordinates?.lng) && coordinates?.ref_id) {
      coordinates = await getPlaceDetail(coordinates.ref_id);
    }

    // Nếu chưa có tọa độ và có từ khóa text
    if ((!coordinates?.lat || !coordinates?.lng) && query?.trim()) {
      const results = await searchPlaces(query);
      const firstResult = results[0];
      if (firstResult?.lat && firstResult?.lng) {
        coordinates = firstResult;
      } else if (firstResult?.ref_id) {
        coordinates = await getPlaceDetail(firstResult.ref_id);
      }
    }

    if (coordinates?.lat && coordinates?.lng) {
      const lat = Number(coordinates.lat);
      const lng = Number(coordinates.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return [lat, lng];
      }
    }
  } catch (error) {
    console.error('Lỗi phân giải tọa độ địa chỉ Vietmap:', error);
  }

  return null;
};

/**
 * Chuyển đổi tọa độ [lat, lng] thành tên địa chỉ thực tế (Vietmap Reverse v4).
 * KHÔNG bao giờ trả về chuỗi kinh độ vĩ độ. Chỉ trả về chuỗi địa chỉ có nghĩa hoặc null.
 * @param {number} lat - Vĩ độ
 * @param {number} lng - Kinh độ
 * @returns {Promise<string|null>} Tên địa chỉ rõ ràng hoặc null nếu không tìm được
 */
export const reverseGeocode = async (lat, lng) => {
  if (!VIETMAP_API_KEY || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return null;
  }

  try {
    const url = `https://maps.vietmap.vn/api/reverse/v4?apikey=${encodeURIComponent(VIETMAP_API_KEY)}&lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Vietmap reverse geocoding trả về status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const results = Array.isArray(data) ? data : data?.data || (data ? [data] : []);
    const item = results[0];

    if (!item) return null;

    // Ưu tiên chuỗi hiển thị đầy đủ (display), sau đó đến name + address, hoặc address
    const fullDisplay = item.display?.trim();
    if (fullDisplay) return fullDisplay;

    const name = item.name?.trim();
    const address = item.address?.trim();
    if (name && address && !address.toLowerCase().includes(name.toLowerCase())) {
      return `${name}, ${address}`;
    }

    return address || name || null;
  } catch (error) {
    console.error('Lỗi khi đảo ngược tọa độ sang địa chỉ (reverse geocoding):', error);
    return null;
  }
};

const vietmapService = {
  searchPlaces,
  getPlaceDetail,
  resolveAddressCoordinates,
  reverseGeocode,
};

export default vietmapService;
