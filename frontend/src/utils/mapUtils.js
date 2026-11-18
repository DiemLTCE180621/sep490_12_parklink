
export const SEA_MAP_BOUNDS = [
  [-11.5, 92.0], // Tây Nam Đông Nam Á 
  [28.5, 141.5], // Đông Bắc Đông Nam Á 
];

export const VIETNAM_SEA_MAP_OPTIONS = {
  minZoom: 6,
  maxZoom: 18,
  maxBounds: SEA_MAP_BOUNDS,
  maxBoundsViscosity: 1.0,
};

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

  try {
    const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
    return Boolean(openedWindow);
  } catch (error) {
    return false;
  }
};
