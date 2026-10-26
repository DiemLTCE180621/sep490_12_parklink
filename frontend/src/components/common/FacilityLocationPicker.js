import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2 } from 'lucide-react';
import VietmapAddressAutocomplete from './VietmapAddressAutocomplete';
import vietmapService from '../../services/vietmapService';
import { facilityCarIcon } from '../../utils/mapIcons';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Tọa độ mặc định (Cần Thơ)
const DEFAULT_CENTER = [10.0299, 105.7706];

/**
 * Điều khiển góc nhìn bản đồ đưa đến tâm mới khi chọn địa chỉ
 * Đồng thời tự động invalidateSize để triệt tiêu lỗi bản đồ bị lệch xuống dưới bên phải
 */
const MapViewportController = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    // Sửa lỗi Leaflet tính sai kích thước khung chứa khi render trong form
    const handleResize = () => {
      map.invalidateSize();
    };

    map.invalidateSize();
    const timer = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  useEffect(() => {
    if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      map.invalidateSize();
      map.setView(center, 16, { animate: true });
    }
  }, [center, map]);

  return null;
};

/**
 * Marker vị trí bãi xe sử dụng custom facilityCarIcon từ mapIcons.js,
 * cho phép kéo thả (drag) hoặc click bản đồ để chọn lại vị trí
 */
const DraggableFacilityMarker = ({ position, address, onLocationChange }) => {
  const markerRef = useRef(null);

  // Cho phép người dùng click bất kỳ đâu trên bản đồ để di dời vị trí
  useMapEvents({
    async click(event) {
      if (onLocationChange) {
        await onLocationChange(event.latlng.lat, event.latlng.lng);
      }
    },
  });

  const eventHandlers = useMemo(
    () => ({
      async dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          if (onLocationChange) {
            await onLocationChange(newPos.lat, newPos.lng);
          }
        }
      },
    }),
    [onLocationChange]
  );

  if (!position || !Number.isFinite(position[0]) || !Number.isFinite(position[1])) {
    return null;
  }

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={facilityCarIcon}
    >
      <Popup>
        <div className="p-1">
          <p className="font-bold text-xs text-teal-800">Vị trí bãi đỗ xe</p>
          <p className="text-xs text-slate-700 mt-1">{address || 'Đã đánh dấu trên bản đồ'}</p>
          <p className="text-[10px] text-teal-600 mt-1 italic">
            Kéo thả ghim để tinh chỉnh vị trí chuẩn thực tế
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

const FacilityLocationPicker = ({ address, latitude, longitude, onChange, required = false }) => {
  const hasValidCoords = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  const currentCoords = hasValidCoords ? [Number(latitude), Number(longitude)] : null;

  const [mapCenter, setMapCenter] = useState(currentCoords || DEFAULT_CENTER);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const vietmapTileKey = process.env.REACT_APP_VIETMAP_TILE_KEY;

  // Cập nhật tâm bản đồ khi tải trang nếu đã có sẵn tọa độ (ví dụ trang edit)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (hasValidCoords) {
        setMapCenter([Number(latitude), Number(longitude)]);
      }
    }
  }, [latitude, longitude, hasValidCoords]);

  /**
   * Xử lý di dời marker hoặc click trên bản đồ:
   * 1. Cập nhật ngay tọa độ mới.
   * 2. Gọi API reverse geocode để lấy tên địa chỉ thực tế.
   * 3. Tuyệt đối KHÔNG ghi kinh độ vĩ độ vào ô địa chỉ (giữ nguyên địa chỉ cũ nếu không reverse được).
   */
  const handleLocationMove = async (newLat, newLng) => {
    const latStr = newLat.toString();
    const lngStr = newLng.toString();

    setIsReverseGeocoding(true);
    try {
      const resolvedAddress = await vietmapService.reverseGeocode(newLat, newLng);
      if (resolvedAddress && resolvedAddress.trim()) {
        // Cập nhật thành địa chỉ mới từ điểm đã di dời
        onChange({
          address: resolvedAddress,
          latitude: latStr,
          longitude: lngStr,
        });
      } else {
        // Giữ nguyên thanh địa chỉ hiện tại, tuyệt đối không ghi kinh độ vĩ độ
        onChange({
          address: address || '',
          latitude: latStr,
          longitude: lngStr,
        });
      }
    } catch (error) {
      console.error('Lỗi phân giải địa chỉ khi di dời marker:', error);
      onChange({
        address: address || '',
        latitude: latStr,
        longitude: lngStr,
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  /**
   * Xử lý khi nhấn nút "Đưa bản đồ đến địa chỉ":
   * Tự động đánh dấu vị trí ghim và đưa bản đồ đến địa chỉ đó
   */
  const handleGeocode = async () => {
    if (!address) return;
    setGeocodeLoading(true);
    try {
      const coords = await vietmapService.resolveAddressCoordinates(address);
      if (coords) {
        setMapCenter(coords);
        // Tự động đánh dấu điểm đã tìm kiếm
        onChange({
          address,
          latitude: coords[0].toString(),
          longitude: coords[1].toString(),
        });
      }
    } catch (error) {
      console.error('Lỗi tìm khu vực trên bản đồ Vietmap:', error);
    } finally {
      setGeocodeLoading(false);
    }
  };

  /**
   * Xử lý khi người dùng chọn gợi ý địa chỉ từ Autocomplete:
   * Tự động đánh dấu ghim ngay tại vị trí gợi ý và di chuyển bản đồ đến đó
   */
  const handleAddressSelect = async (suggestion, label) => {
    setGeocodeLoading(true);
    try {
      const coords = await vietmapService.resolveAddressCoordinates(label, suggestion);
      if (coords) {
        setMapCenter(coords);
        // Tự động đánh dấu vị trí ngay khi chọn gợi ý
        onChange({
          address: label,
          latitude: coords[0].toString(),
          longitude: coords[1].toString(),
        });
      } else {
        onChange({ address: label, latitude: '', longitude: '' });
      }
    } catch (error) {
      console.error('Lỗi tìm tọa độ gợi ý địa chỉ Vietmap:', error);
      onChange({ address: label, latitude: '', longitude: '' });
    } finally {
      setGeocodeLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Thanh nhập địa chỉ và nút đưa bản đồ đến địa chỉ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <VietmapAddressAutocomplete
            value={address}
            onChange={(value) => {
              // Khi người dùng gõ tay đổi text, giữ nguyên hoặc reset tọa độ chờ xác nhận
              onChange({ address: value, latitude: '', longitude: '' });
            }}
            onSelect={handleAddressSelect}
            placeholder="Nhập địa chỉ rồi chọn một gợi ý..."
            inputClassName="py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required={required}
          />
        </div>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocodeLoading || !address}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {geocodeLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang định vị...
            </>
          ) : (
            'Đưa bản đồ đến địa chỉ'
          )}
        </button>
      </div>

      {/* Bản đồ định vị */}
      <div className="h-72 rounded-xl overflow-hidden border border-slate-300 relative z-0">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url={`https://maps.vietmap.vn/api/tm/{z}/{x}/{y}.png?apikey=${vietmapTileKey}`}
            keepBuffer={1}
            updateWhenIdle
            updateWhenZooming={false}
          />
          <MapViewportController center={mapCenter} />
          {/* Marker duy nhất: Tự động đánh dấu và cho phép kéo thả di dời */}
          {currentCoords && (
            <DraggableFacilityMarker
              position={currentCoords}
              address={address}
              onLocationChange={handleLocationMove}
            />
          )}
        </MapContainer>

        {isReverseGeocoding && (
          <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs font-semibold text-teal-800 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" /> Đang cập nhật địa chỉ...
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center font-medium">
        Ghim sẽ tự động đánh dấu theo địa chỉ. Bạn có thể kéo thả ghim hoặc click trên bản đồ để tinh chỉnh vị trí chuẩn thực tế hơn.
      </p>

      {/* Thông báo xác nhận vị trí đã chọn bằng tên địa chỉ, tuyệt đối không hiển thị kinh độ vĩ độ */}
      {hasValidCoords && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-teal-800">Vị trí bãi đỗ xe đã chọn: </span>
            <span className="font-medium text-slate-800">{address || 'Đã xác định vị trí trên bản đồ'}</span>
            <p className="text-[11px] text-teal-700 mt-0.5">
              (Hệ thống đã tự động ghim vị trí. Bạn có thể kéo ghim trên bản đồ để vị trí chính xác nhất).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityLocationPicker;
