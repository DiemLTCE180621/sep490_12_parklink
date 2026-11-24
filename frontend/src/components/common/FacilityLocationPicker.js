import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const DEFAULT_CENTER = [10.0299, 105.7706];

const MapViewportController = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    let isMounted = true;
    const handleResize = () => {
      if (!isMounted) return;
      try {
        if (map._mapPane) map.invalidateSize();
      } catch (err) {}
    };

    try {
      if (map._mapPane) map.invalidateSize();
    } catch (err) {}

    const timer = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  useEffect(() => {
    if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      try {
        if (map._mapPane) {
          map.invalidateSize();
          map.setView(center, 16, { animate: true });
        }
      } catch (err) {}
    }
  }, [center, map]);

  return null;
};

const DraggableFacilityMarker = ({ position, address, onLocationChange, t }) => {
  const markerRef = useRef(null);

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
          <p className="font-bold text-xs text-teal-800">{t('mapPicker.popupTitle')}</p>
          <p className="text-xs text-slate-700 mt-1">{address || t('mapPicker.popupMarked')}</p>
          <p className="text-[10px] text-teal-600 mt-1 italic">
            {t('mapPicker.popupDragHint')}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

const FacilityLocationPicker = ({ address, latitude, longitude, onChange, required = false }) => {
  const { t } = useTranslation('common');
  const hasValidCoords = latitude !== '' && longitude !== '' && latitude != null && longitude != null &&
    Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  const currentCoords = hasValidCoords ? [Number(latitude), Number(longitude)] : null;

  const [mapCenter, setMapCenter] = useState(currentCoords || DEFAULT_CENTER);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const vietmapTileKey = process.env.REACT_APP_VIETMAP_TILE_KEY;

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (hasValidCoords) {
        setMapCenter([Number(latitude), Number(longitude)]);
      }
    }
  }, [latitude, longitude, hasValidCoords]);

  const handleLocationMove = async (newLat, newLng) => {
    const latStr = newLat.toString();
    const lngStr = newLng.toString();

    setIsReverseGeocoding(true);
    try {
      const resolvedAddress = await vietmapService.reverseGeocode(newLat, newLng);
      if (resolvedAddress && resolvedAddress.trim()) {
        onChange({
          address: resolvedAddress,
          latitude: latStr,
          longitude: lngStr,
        });
      } else {
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

  const handleGeocode = async () => {
    if (!address) return;
    setGeocodeLoading(true);
    try {
      const coords = await vietmapService.resolveAddressCoordinates(address);
      if (coords) {
        setMapCenter(coords);
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

  const handleAddressSelect = async (suggestion, label) => {
    setGeocodeLoading(true);
    try {
      const coords = await vietmapService.resolveAddressCoordinates(label, suggestion);
      if (coords) {
        setMapCenter(coords);
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
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <VietmapAddressAutocomplete
            value={address}
            onChange={(value) => {
              onChange({ address: value, latitude: '', longitude: '' });
            }}
            onSelect={handleAddressSelect}
            placeholder={t('mapPicker.addressPlaceholder')}
            inputClassName="py-2.5 px-3.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white shadow-2xs"
            required={required}
          />
        </div>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocodeLoading || !address}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition whitespace-nowrap disabled:opacity-60 flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
        >
          {geocodeLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('mapPicker.locating')}
            </>
          ) : (
            t('mapPicker.centerMap')
          )}
        </button>
      </div>

      <div className="h-72 rounded-xl overflow-hidden border border-slate-200 relative z-0 shadow-2xs">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url={`https://maps.vietmap.vn/api/tm/{z}/{x}/{y}.png?apikey=${vietmapTileKey}`}
            keepBuffer={1}
            updateWhenIdle
            updateWhenZooming={false}
          />
          <MapViewportController center={mapCenter} />
          {currentCoords && (
            <DraggableFacilityMarker
              position={currentCoords}
              address={address}
              onLocationChange={handleLocationMove}
              t={t}
            />
          )}
        </MapContainer>

        {isReverseGeocoding && (
          <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs text-xs font-semibold text-teal-800 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-teal-600" /> {t('mapPicker.updatingAddress')}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center font-normal">
        {t('mapPicker.helperHint')}
      </p>

      {hasValidCoords && (
        <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-bold text-teal-800">{t('mapPicker.selectedLabel')}</span>
            <span className="font-medium text-slate-800">{address || t('mapPicker.selectedFallback')}</span>
            <p className="text-xs text-teal-700 mt-0.5">
              {t('mapPicker.selectedDragHint')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityLocationPicker;
