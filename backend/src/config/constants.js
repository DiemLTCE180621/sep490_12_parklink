/**
 * Các hằng số cấu hình hệ thống ParkLink phía Backend
 */
const VEHICLE_TYPES = [
  { id: 'CAR_4_5_SEATER', label: 'Ô tô 4 - 5 chỗ (Sedan, Hatchback, CUV)' },
  { id: 'CAR_7_SEATER', label: 'Ô tô 7 chỗ (SUV, MPV)' },
  { id: 'PICKUP_TRUCK', label: 'Xe bán tải / Xe tải nhỏ (Dưới 1.5 tấn)' },
  { id: 'ELECTRIC_CAR', label: 'Xe ô tô điện (EV)' }
];

const PLATFORM_FEE_RULES = [
  { minSlots: 1, maxSlots: 3, fee: 2000000 },
  { minSlots: 4, maxSlots: 7, fee: 4000000 },
  { minSlots: 8, maxSlots: 999, fee: 6000000 }
];

module.exports = {
  VEHICLE_TYPES,
  PLATFORM_FEE_RULES
};
