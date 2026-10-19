/**
 * Danh mục loại phương tiện (Vehicle Types) dùng chung toàn hệ thống ParkLink
 */
export const VEHICLE_TYPES = [
  {
    id: 'CAR_4_5_SEATER',
    label: 'Ô tô 4 - 5 chỗ (Sedan, Hatchback, CUV)',
    shortLabel: 'Ô tô 4-5 chỗ',
    icon: 'car'
  },
  {
    id: 'CAR_7_SEATER',
    label: 'Ô tô 7 chỗ (SUV, MPV)',
    shortLabel: 'Ô tô 7 chỗ',
    icon: 'car-suv'
  },
  {
    id: 'PICKUP_TRUCK',
    label: 'Xe bán tải / Xe tải nhỏ (Dưới 1.5 tấn)',
    shortLabel: 'Xe bán tải / Tải nhỏ',
    icon: 'truck'
  },
  {
    id: 'ELECTRIC_CAR',
    label: 'Xe ô tô điện (EV)',
    shortLabel: 'Ô tô điện',
    icon: 'zap'
  }
];

export const getVehicleTypeLabel = (typeId) => {
  const found = VEHICLE_TYPES.find(v => v.id === typeId);
  return found ? found.label : typeId;
};

/**
 * Trích xuất danh sách loại xe hỗ trợ thực tế của Bãi đỗ xe từ Database (facility.vehicle_types)
 */
export const getFacilitySupportedTypes = (vehicleTypesData) => {
  if (!vehicleTypesData) return VEHICLE_TYPES;

  let raw = vehicleTypesData;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      raw = [];
    }
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    return VEHICLE_TYPES;
  }

  const mapped = raw
    .map((item) => {
      const typeId = typeof item === 'string' ? item : item?.id;
      const standard = VEHICLE_TYPES.find((v) => v.id === typeId);
      if (standard) return standard;
      return {
        id: typeId,
        label: typeof item === 'string' ? item : (item.label || typeId),
        shortLabel: typeof item === 'string' ? item : (item.shortLabel || item.label || typeId)
      };
    })
    .filter(Boolean);

  return mapped.length > 0 ? mapped : VEHICLE_TYPES;
};

