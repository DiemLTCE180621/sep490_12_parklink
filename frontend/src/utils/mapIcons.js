import L from 'leaflet';

/**
 * Custom Leaflet icon hình xe ô tô cho các bãi đỗ xe trên bản đồ.
 * Sử dụng L.divIcon kết hợp inline SVG để không cần file ảnh bên ngoài.
 * Màu teal (#0d9488) đồng bộ với design system của ParkLink.
 */
const facilityCarIcon = L.divIcon({
  className: 'parklink-facility-icon',
  html: `
    <svg width="44" height="52" viewBox="0 0 44 52" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="22" cy="50" rx="9" ry="2" fill="rgba(15, 23, 42, 0.24)"/>
      <path d="M22 1C10.4 1 1 10.4 1 22c0 15.6 21 28 21 28s21-12.4 21-28C43 10.4 33.6 1 22 1Z"
        fill="#0D9488" stroke="#0F766E" stroke-width="2"/>
      <circle cx="22" cy="21" r="13" fill="white"/>
      <path d="M13 22.2 15.2 16a2.5 2.5 0 0 1 2.4-1.7h8.8a2.5 2.5 0 0 1 2.4 1.7l2.2 6.2v5.1a1.7 1.7 0 0 1-1.7 1.7h-1.1a1.7 1.7 0 0 1-1.7-1.7v-.6h-9.6v.6a1.7 1.7 0 0 1-1.7 1.7h-1.1a1.7 1.7 0 0 1-1.7-1.7v-5.1Z"
        fill="#0D9488"/>
      <path d="m16.3 20.5 1.2-3.2c.2-.5.6-.8 1.2-.8h6.6c.5 0 1 .3 1.2.8l1.2 3.2H16.3Z"
        fill="#CCFBF1"/>
      <circle cx="17.2" cy="24.3" r="1.3" fill="white"/>
      <circle cx="26.8" cy="24.3" r="1.3" fill="white"/>
    </svg>
  `,
  iconSize: [44, 52],
  iconAnchor: [22, 50],
  popupAnchor: [0, -48]
});

export { facilityCarIcon };
