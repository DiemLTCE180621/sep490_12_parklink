import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import VietmapAddressAutocomplete from './VietmapAddressAutocomplete';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = [10.0299, 105.7706];

const MapViewportController = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1 });
    }
  }, [center, map]);

  return null;
};

const LocationMarker = ({ latitude, longitude, onChange }) => {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat.toString(),
        longitude: event.latlng.lng.toString(),
      });
    },
  });

  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? <Marker position={[lat, lng]} /> : null;
};

const FacilityLocationPicker = ({ address, latitude, longitude, onChange, required = false }) => {
  const [mapCenter, setMapCenter] = useState(
    Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
      ? [Number(latitude), Number(longitude)]
      : DEFAULT_CENTER
  );
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const vietmapApiKey = process.env.REACT_APP_VIETMAP_API_KEY;
  const vietmapTileKey = process.env.REACT_APP_VIETMAP_TILE_KEY;

  const lookupAddress = async (query, refId) => {
    if (!vietmapApiKey || (!query && !refId)) return null;

    const url = refId
      ? `https://maps.vietmap.vn/api/place/v3?apikey=${encodeURIComponent(vietmapApiKey)}&refid=${encodeURIComponent(refId)}`
      : `https://maps.vietmap.vn/api/search/v3?apikey=${encodeURIComponent(vietmapApiKey)}&text=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Vietmap address lookup failed with status ${response.status}`);

    const data = await response.json();
    if (refId) return data?.lat && data?.lng ? [Number(data.lat), Number(data.lng)] : null;

    const results = Array.isArray(data) ? data : data?.data || [];
    const firstResult = results.find((item) => item?.ref_id);
    if (!firstResult) return null;
    return lookupAddress(null, firstResult.ref_id);
  };

  const moveMapToAddress = async (query, refId) => {
    const coordinates = await lookupAddress(query, refId);
    if (coordinates) {
      setMapCenter(coordinates);
      setSearchedLocation(coordinates);
    }
    return coordinates;
  };

  const handleGeocode = async () => {
    if (!address) return;
    setGeocodeLoading(true);
    try {
      await moveMapToAddress(address);
    } catch (error) {
      console.error('Lỗi tìm khu vực trên bản đồ Vietmap:', error);
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleAddressSelect = async (suggestion, label) => {
    onChange({ address: label, latitude: '', longitude: '' });
    if (!suggestion?.ref_id) return;

    setGeocodeLoading(true);
    try {
      await moveMapToAddress(null, suggestion.ref_id);
    } catch (error) {
      console.error('Lỗi tìm khu vực của địa chỉ Vietmap:', error);
    } finally {
      setGeocodeLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <VietmapAddressAutocomplete
            value={address}
            onChange={(value) => onChange({ address: value, latitude: '', longitude: '' })}
            onSelect={handleAddressSelect}
            placeholder="Nhập địa chỉ rồi chọn một gợi ý..."
            inputClassName="py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required={required}
          />
        </div>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocodeLoading}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition whitespace-nowrap disabled:opacity-60"
        >
          {geocodeLoading ? 'Đang đưa bản đồ...' : 'Đưa bản đồ đến địa chỉ'}
        </button>
      </div>
      <div className="h-72 rounded-xl overflow-hidden border border-slate-300 relative z-0">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url={`https://maps.vietmap.vn/api/tm/{z}/{x}/{y}.png?apikey=${vietmapTileKey}`}
            keepBuffer={1}
            updateWhenIdle
            updateWhenZooming={false}
          />
          <MapViewportController center={mapCenter} />
          {searchedLocation && <Marker position={searchedLocation} />}
          <LocationMarker latitude={latitude} longitude={longitude} onChange={onChange} />
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500 text-center font-medium">
        Chọn gợi ý địa chỉ hoặc đưa bản đồ đến địa chỉ, sau đó click vị trí chính xác để đặt ghim.
      </p>
      {latitude && longitude && (
        <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-xs text-teal-800 font-mono">
          Tọa độ hiện tại: [{latitude}, {longitude}]
        </div>
      )}
    </div>
  );
};

export default FacilityLocationPicker;
