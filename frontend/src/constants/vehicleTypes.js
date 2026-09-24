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
