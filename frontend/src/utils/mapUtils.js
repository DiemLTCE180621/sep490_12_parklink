/**
 * Tiện ích xử lý dữ liệu bản đồ, tuyến đường và định dạng hiển thị cho ParkLink.
 * Tuân thủ nguyên tắc DRY để tái sử dụng giữa SearchPage, FacilityDetailPage và các component bản đồ.
 */



/**
 * Mở chỉ đường trực tiếp trên Google Maps (Universal URL tương thích cả Desktop & Mobile App).
 * Thay thế giải pháp vẽ lộ trình tự chế nội bộ để đem lại trải nghiệm dẫn đường GPS chuẩn xác, mượt mà nhất.
 * @param {Object} options
 * @param {Array<number>|string} [options.origin] - Tọa độ [lat, lng] hoặc chuỗi địa chỉ xuất phát (tùy chọn)
 * @param {Array<number>|string} options.destination - Tọa độ [lat, lng] hoặc chuỗi địa chỉ đích đến (bắt buộc)
 * @param {string} [options.travelMode='driving'] - Chế độ di chuyển: driving, walking, bicycling, transit
 * @returns {boolean} true nếu mở thành công
 */
export const openGoogleMapsDirections = ({ origin, destination, travelMode = 'driving' }) => {
  if (!destination) return false;

  const formatPoint = (point) => {
    if (Array.isArray(point) && point.length >= 2) {
      const lat = Number(point[0]);
      const lng = Number(point[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return `${lat},${lng}`;
      }
    }
    if (typeof point === 'string' && point.trim()) {
      return encodeURIComponent(point.trim());
    }
    return '';
  };

  const destStr = formatPoint(destination);
  if (!destStr) return false;

  const originStr = origin ? formatPoint(origin) : '';

  // Google Maps Universal Directions URL
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destStr}&travelmode=${travelMode}`;
  if (originStr) {
    url += `&origin=${originStr}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

