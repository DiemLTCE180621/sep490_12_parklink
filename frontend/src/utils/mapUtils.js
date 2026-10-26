/**
 * Tiện ích xử lý dữ liệu bản đồ, tuyến đường và định dạng hiển thị cho ParkLink.
 * Tuân thủ nguyên tắc DRY để tái sử dụng giữa SearchPage, FacilityDetailPage và các component bản đồ.
 */

/**
 * Giải mã chuỗi polyline được mã hóa (Google/Vietmap polyline algorithm).
 * @param {string} encoded - Chuỗi polyline đã mã hóa
 * @returns {Array<[number, number]>} Mảng các cặp tọa độ [latitude, longitude]
 */
export const decodePolyline = (encoded) => {
  if (!encoded || typeof encoded !== 'string') return [];
  const coordinates = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude += (result & 1) ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude += (result & 1) ? ~(result >> 1) : result >> 1;

    coordinates.push([latitude / 1e5, longitude / 1e5]);
  }

  return coordinates;
};

/**
 * Chuẩn hóa các điểm tọa độ tuyến đường từ kết quả API Vietmap Route.
 * Hỗ trợ GeoJSON [lng, lat], mảng tọa độ thô hoặc chuỗi polyline đã mã hóa,
 * và chuyển đổi về định dạng chuẩn Leaflet [latitude, longitude].
 * @param {Object} path - Đối tượng path từ API Vietmap Route
 * @returns {Array<[number, number]>} Mảng các cặp tọa độ [lat, lng] hợp lệ cho Leaflet
 */
export const normalizeRoutePoints = (path) => {
  if (!path) return [];
  const rawPoints = path?.points;
  const geoJsonCoordinates = rawPoints?.coordinates || path?.geometry?.coordinates;
  const isGeoJsonCoordinates = Array.isArray(geoJsonCoordinates);

  const coordinates = Array.isArray(rawPoints)
    ? rawPoints
    : isGeoJsonCoordinates
      ? geoJsonCoordinates
      : typeof rawPoints === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(rawPoints);
              return Array.isArray(parsed) ? parsed : decodePolyline(rawPoints);
            } catch {
              return decodePolyline(rawPoints);
            }
          })()
        : [];

  return coordinates
    .map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        const first = Number(point[0]);
        const second = Number(point[1]);
        // GeoJSON quy ước [lng, lat], Leaflet quy ước [lat, lng]
        return isGeoJsonCoordinates ? [second, first] : [first, second];
      }
      if (point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng))) {
        return [Number(point.lat), Number(point.lng)];
      }
      return null;
    })
    .filter((point) => point && point.every(Number.isFinite));
};

/**
 * Định dạng khoảng cách mét sang chuỗi hiển thị thân thiện (m hoặc km).
 * @param {number} meters - Khoảng cách tính bằng mét
 * @returns {string} Chuỗi hiển thị (ví dụ: "850 m" hoặc "3.2 km")
 */
export const formatDistance = (meters) => {
  if (!Number.isFinite(Number(meters))) return '0 m';
  const m = Number(meters);
  if (m < 1000) {
    return `${Math.round(m)} m`;
  }
  return `${(m / 1000).toFixed(1)} km`;
};

/**
 * Định dạng thời gian (mili giây hoặc giây) sang chuỗi phút/giờ trực quan.
 * @param {number} time - Thời gian (mặc định ms từ Vietmap Route)
 * @param {boolean} isSeconds - true nếu đầu vào là giây
 * @returns {string} Chuỗi hiển thị (ví dụ: "7 phút", "1 giờ 15 phút")
 */
export const formatDuration = (time, isSeconds = false) => {
  if (!Number.isFinite(Number(time)) || time <= 0) return '1 phút';
  const ms = isSeconds ? Number(time) * 1000 : Number(time);
  const totalMinutes = Math.round(ms / 60000);

  if (totalMinutes < 1) return '< 1 phút';
  if (totalMinutes < 60) return `${totalMinutes} phút`;

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes > 0 ? `${hours} giờ ${remainingMinutes} phút` : `${hours} giờ`;
};
