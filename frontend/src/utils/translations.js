//util to translate dynamic data from DB to English

const normalizeKey = (value) => (value || '').trim().toLowerCase();

const normalizeBlock = (value) =>
  (value || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()
    .toLowerCase();



const VEHICLE_TYPE_BY_CODE_EN = {
  CAR_4_5_SEATER: '4–5 Seater Car (Sedan, Hatchback, CUV)',
  CAR_7_SEATER: '7-Seater Car (SUV, MPV)',
  PICKUP_TRUCK: 'Pickup / Light Truck (Under 1.5 tons)',
  ELECTRIC_CAR: 'Electric Car (EV)',
};

const VEHICLE_TYPE_BY_NAME_EN = {
  'ô tô 4 - 5 chỗ (sedan, hatchback, cuv)': '4–5 Seater Car (Sedan, Hatchback, CUV)',
  'ô tô 7 chỗ (suv, mpv)': '7-Seater Car (SUV, MPV)',
  'xe bán tải / xe tải nhỏ (dưới 1.5 tấn)': 'Pickup / Light Truck (Under 1.5 tons)',
  'xe ô tô điện (ev)': 'Electric Car (EV)',
};

const AMENITY_BY_NAME_EN = {
  'có thể thuê chỗ cố định': 'Fixed Monthly Spot Available',
  'camera an ninh 24/7': '24/7 Security Cameras',
  'mái che mưa nắng': 'Weatherproof Roof Cover',
  'bảo vệ trực trực tiếp': 'On-site Security Guard',
  'bảo vệ trực tiếp': 'On-site Security Guard',
  'hệ thống chiếu sáng đêm': 'Night Lighting System',
  'trang bị pccc đạt chuẩn': 'Certified Fire Safety Equipment',
  'có wifi': 'Wi-Fi Available',
  'wifi miễn phí': 'Free Wi-Fi',
};

const PLATFORM_FEE_BY_NAME_EN = {
  'gói bãi xe nhỏ (1 - 3 chỗ)': 'Small Facility Package (1 - 3 slots)',
  'gói bãi xe vừa (4 - 7 chỗ)': 'Medium Facility Package (4 - 7 slots)',
  'gói bãi xe lớn (từ 8 chỗ trở lên)': 'Large Facility Package (8+ slots)',
};

export const translateVehicleTypeName = (vehicleType, language = 'vi') => {
  if (!vehicleType) return '';
  if (!language?.startsWith('en')) return vehicleType.name || '';

  const byCode = vehicleType.type_code ? VEHICLE_TYPE_BY_CODE_EN[vehicleType.type_code] : null;
  if (byCode) return byCode;

  return VEHICLE_TYPE_BY_NAME_EN[normalizeKey(vehicleType.name)] || vehicleType.name || '';
};


export const translateAmenityName = (amenityName, language = 'vi') => {
  if (!amenityName) return '';
  if (!language?.startsWith('en')) return amenityName;

  return AMENITY_BY_NAME_EN[normalizeKey(amenityName)] || amenityName;
};


export const translatePlatformFeeName = (feeName, language = 'vi') => {
  if (!feeName) return '';
  if (!language?.startsWith('en')) return feeName;

  const exact = PLATFORM_FEE_BY_NAME_EN[normalizeKey(feeName)];
  if (exact) return exact;

  //Fallback
  const rangeMatch = feeName.match(/\((\d+)\s*-\s*(\d+)\s*chỗ\)/i);
  if (rangeMatch) {
    return `Facility Package (${rangeMatch[1]} - ${rangeMatch[2]} slots)`;
  }

  const fromMatch = feeName.match(/\(từ\s*(\d+)\s*chỗ\s*trở\s*lên\)/i);
  if (fromMatch) {
    return `Facility Package (${fromMatch[1]}+ slots)`;
  }

  return feeName;
};

const PLATFORM_FEE_DESC_BY_TEXT_EN = {
  'bãi đỗ xe quy mô nhỏ từ 1 đến 3 chỗ': 'Small parking facility (1 to 3 slots)',
  'bãi đỗ xe quy mô vừa từ 4 đến 7 chỗ': 'Medium parking facility (4 to 7 slots)',
  'bãi đỗ xe quy mô lớn từ 8 chỗ trở lên': 'Large parking facility (8+ slots)',
};

/**
 * Dịch mô tả gói phí nền tảng từ DB theo ngôn ngữ hiện tại.
 */
export const translatePlatformFeeDescription = (description, language = 'vi') => {
  if (!description) return '';
  if (!language?.startsWith('en')) return description;

  return PLATFORM_FEE_DESC_BY_TEXT_EN[normalizeKey(description)] || description;
};

// ---------------------------------------------------------------------------
// 2. CHÍNH SÁCH & ĐIỀU KHOẢN DỊCH VỤ (SYSTEM POLICIES / TERMS OF SERVICE)
// ---------------------------------------------------------------------------

const POLICY_TITLES_EN = {
  'chính sách & điều khoản dịch vụ dành cho khách hàng': 'Terms of Service and Customer Policies',
  'quy chế vận hành & chính sách dành cho chủ bãi đỗ xe (đối tác)': 'Operating Policies & Terms for Parking Providers',
};

// Ánh xạ từng đoạn văn bản chuẩn trong DB để nếu Admin sửa 1 mục riêng lẻ,
// các mục còn lại vẫn dịch sang Tiếng Anh bình thường và chỉ fallback đoạn mới sửa.
const POLICY_SECTIONS_EN = {
  [normalizeBlock(`1. PHẠM VI DỊCH VỤ VÀ NỀN TẢNG:
- ParkLink là nền tảng số trung gian kết nối giữa khách hàng có nhu cầu gửi xe ô tô theo tháng với các chủ bãi đỗ xe tận dụng diện tích có sẵn tại khu vực thử nghiệm (quận Ninh Kiều, thành phố Cần Thơ).
- Nền tảng chỉ hỗ trợ dịch vụ gửi xe theo tháng cho xe ô tô, không hỗ trợ hình thức gửi theo giờ, theo ngày hoặc các dịch vụ phụ trợ khác.`)]: `1. SCOPE OF SERVICES & PLATFORM:
- ParkLink is an intermediary digital platform connecting customers seeking monthly car parking with Parking Providers offering available parking spaces in the pilot area (Ninh Kieu District, Can Tho City).
- The platform strictly supports monthly car parking rentals only and does not support hourly, daily, or other ancillary services.`,

  [normalizeBlock(`2. MIỄN TRỪ TRÁCH NHIỆM TÀI SẢN:
- ParkLink đóng vai trò là kênh cung cấp thông tin, hỗ trợ khảo sát sơ bộ và tạo biên bản thỏa thuận điện tử giữa hai bên.
- ParkLink không sở hữu, không trực tiếp vận hành bãi đỗ và không chịu bất kỳ trách nhiệm pháp lý, dân sự hoặc bồi thường tài chính nào đối với các sự cố xảy ra tại bãi đỗ, bao gồm nhưng không giới hạn: mất cắp tài sản trên xe, mất xe, va quẹt, hư hỏng phương tiện, ngập lụt, cháy nổ hoặc thiên tai.
- Trách nhiệm bảo vệ tài sản thuộc về thỏa thuận trực tiếp giữa Khách thuê và Chủ bãi đỗ xe.`)]: `2. PROPERTY LIABILITY DISCLAIMER:
- ParkLink acts solely as an information listing platform, initial field survey facilitator, and provider of electronic confirmation records between both parties.
- ParkLink does not own or directly operate any parking facility and bears no legal, civil, or financial liability for incidents occurring at the facility, including but not limited to theft of vehicle belongings, vehicle theft, collisions, damage, flooding, fire, or natural disasters.
- Property protection obligations are governed directly by the agreement between the Customer and the Parking Provider.`,

  [normalizeBlock(`3. THANH TOÁN VÀ GIAO DỊCH NGOÀI HỆ THỐNG:
- ParkLink không thu hộ, không giữ tiền đặt cọc và không xử lý thanh toán tiền thuê bãi hàng tháng giữa Khách thuê và Chủ bãi.
- Mọi giao dịch tài chính về tiền gửi xe được hai bên trực tiếp thanh toán và thống nhất ngoài nền tảng (chuyển khoản trực tiếp hoặc tiền mặt). ParkLink không can thiệp và không giải quyết tranh chấp tài chính giữa hai bên.`)]: `3. OFF-PLATFORM PAYMENTS & TRANSACTIONS:
- ParkLink does not collect, hold deposits, or process monthly parking rent payments between Customers and Parking Providers.
- All parking rental payments are settled directly between both parties outside the platform (bank transfer or cash). ParkLink does not intervene in or arbitrate financial disputes between the parties.`,

  [normalizeBlock(`4. BẢN CHẤT BIÊN BẢN XÁC NHẬN THUÊ XE:
- Biên bản xác nhận thuê xe trên hệ thống là chứng từ điện tử ghi nhận sự đồng thuận về thời hạn, vị trí và mức giá đã trao đổi giữa hai bên nhằm cập nhật tình trạng chỗ trống trên hệ thống.
- Biên bản này không có giá trị pháp lý thay thế cho hợp đồng công chứng hoặc dịch vụ định danh điện tử eKYC được chứng thực bởi cơ quan nhà nước.`)]: `4. NATURE OF E-CONFIRMATION RECORDS:
- The electronic rental confirmation record on ParkLink is a digital document recording mutual agreement on duration, parking slot, and price in order to update slot availability on the system.
- This record does not carry the legal force of a notarized contract or state-certified electronic identity verification (eKYC).`,

  [normalizeBlock(`5. NGHĨA VỤ CỦA KHÁCH THUÊ:
- Khai báo chính xác thông tin cá nhân, biển số và dòng phương tiện khi gửi yêu cầu thuê chỗ.
- Chấp hành nghiêm ngặt nội quy riêng, quy chuẩn an toàn phòng cháy chữa cháy và khung giờ ra vào do Chủ bãi đỗ xe quy định.`)]: `5. CUSTOMER OBLIGATIONS:
- Provide accurate personal details, license plate number, and vehicle category when submitting a reservation request.
- Strictly comply with facility rules, fire safety regulations, and operating hours set by the Parking Provider.`,

  [normalizeBlock(`1. ĐĂNG KÝ VÀ KHẢO SÁT XÁC MINH THỰC ĐỊA:
- Để đảm bảo tính trung thực và chất lượng cơ sở, bãi đỗ xe đăng ký mới sẽ được nhân viên khảo sát thực địa của ParkLink đến trực tiếp để kiểm tra hiện trạng, chụp ảnh xác thực, đo đạc tọa độ GPS và xác nhận công suất đỗ xe trước khi được phê duyệt kích hoạt trên bản đồ tìm kiếm.
- Chủ bãi có nghĩa vụ phối hợp, hỗ trợ và cung cấp thông tin trung thực cho nhân viên khảo sát.`)]: `1. REGISTRATION & ON-SITE FIELD SURVEY:
- To ensure accuracy and facility quality, newly registered parking facilities are visited by a ParkLink Field Inspector to verify physical conditions, capture verification photos, record GPS coordinates, and confirm slot capacity prior to map activation.
- Parking Providers must cooperate with and provide truthful information to the Field Inspector.`,

  [normalizeBlock(`2. PHÍ DỊCH VỤ NỀN TẢNG:
- Nền tảng áp dụng mức phí dịch vụ thu một lần duy nhất cho việc khảo sát, số hóa bãi xe, setup hệ thống và hỗ trợ kết nối:
  + Bãi từ 1 đến 3 chỗ đỗ: 2.000.000 VNĐ.
  + Bãi từ 4 đến 7 chỗ đỗ: 4.000.000 VNĐ.
  + Bãi từ 8 chỗ đỗ trở lên: 6.000.000 VNĐ.
- Phí nền tảng được thanh toán qua cổng thanh toán SePay. Phí này không hoàn lại sau khi cơ sở đã hoàn tất khảo sát và kích hoạt thành công trên hệ thống ParkLink.`)]: `2. PLATFORM SERVICE FEE:
- ParkLink applies a one-time platform fee covering field inspection, facility digitization, system onboarding, and listing support:
  + 1 to 3 parking slots: 2,000,000 VND.
  + 4 to 7 parking slots: 4,000,000 VND.
  + 8 or more parking slots: 6,000,000 VND.
- The platform fee is paid via SePay and is non-refundable once the facility has passed inspection and been activated on ParkLink.`,

  [normalizeBlock(`3. KHÔNG TÍCH HỢP HẠ TẦNG PHẦN CỨNG TỰ ĐỘNG:
- Hệ thống ParkLink là nền tảng quản lý thông tin phần mềm, không bao gồm và không kết nối với barrier tự động, camera AI nhận diện biển số hay cảm biến IoT.
- Việc quản lý ra vào, giao nhận chìa khóa, thẻ xe và kiểm soát phương tiện vật lý tại chỗ do Chủ bãi hoàn toàn tự chủ quản lý bằng quy trình nội bộ.`)]: `3. NO AUTOMATED HARDWARE INTEGRATION:
- ParkLink is a software management platform and does not include or integrate with automated barriers, AI license-plate cameras, or IoT sensors.
- Physical access control, key/card handling, and on-site vehicle management remain fully under the Parking Provider's internal procedures.`,

  [normalizeBlock(`4. NGHĨA VỤ QUẢN LÝ VÀ AN NINH CƠ SỞ:
- Chủ bãi có trách nhiệm cập nhật chính xác trạng thái chỗ đỗ trên hệ thống thông qua việc xác nhận các yêu cầu thuê tháng.
- Chủ bãi chịu trách nhiệm pháp lý đầy đủ về giấy phép sử dụng mặt bằng, an ninh trật tự, trang thiết bị phòng cháy chữa cháy và đảm bảo an toàn cho phương tiện được gửi tại cơ sở theo quy định của pháp luật.
- Chủ bãi cam kết không thu thêm bất kỳ chi phí phát sinh bất hợp lý nào ngoài mức giá đã niêm yết và thỏa thuận trong biên bản xác nhận với khách hàng.`)]: `4. FACILITY MANAGEMENT & SECURITY OBLIGATIONS:
- Parking Providers are responsible for keeping slot availability accurate by reviewing and confirming monthly reservation requests.
- Parking Providers bear full legal responsibility for premises usage permits, public security, fire safety equipment, and vehicle safety in accordance with applicable laws.
- Parking Providers commit not to charge any unreasonable hidden fees beyond the listed price and agreed confirmation record.`,
};

/**
 * Dịch tiêu đề và nội dung chính sách hệ thống (Terms of Service) lấy từ DB.
 */
export const translateSystemPolicy = (policy, language = 'vi') => {
  if (!policy) return null;
  if (!language?.startsWith('en')) return policy;

  const translatedTitle =
    POLICY_TITLES_EN[normalizeKey(policy.title)] ||
    (policy.policy_type === 'CUSTOMER'
      ? 'Terms of Service and Customer Policies'
      : policy.policy_type === 'PROVIDER'
        ? 'Operating Policies & Terms for Parking Providers'
        : policy.title);

  const rawContent = policy.content || '';
  const translatedSections = rawContent
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((section) => POLICY_SECTIONS_EN[normalizeBlock(section)] || section);

  return {
    ...policy,
    title: translatedTitle,
    content: translatedSections.join('\n\n'),
  };
};

// ---------------------------------------------------------------------------
// 3. THỜI HẠN, PHƯƠNG TIỆN & ĐIỀU KHOẢN HỢP ĐỒNG (TIMELINES & CONTRACTS)
// ---------------------------------------------------------------------------

/**
 * Chuyển đổi chuỗi thời lượng Tiếng Việt từ API cấu hình (vd: "5 phút", "15 ngày", "24 giờ") sang Tiếng Anh.
 */
export const translateDurationText = (durationText, language = 'vi') => {
  if (!durationText) return '';
  if (!language?.startsWith('en')) return durationText;

  return String(durationText)
    .replace(/(\d+(?:[.,]\d+)?)\s*ngày\b/gi, (_, n) => `${n} ${Number(n) === 1 ? 'day' : 'days'}`)
    .replace(/(\d+(?:[.,]\d+)?)\s*giờ\b/gi, (_, n) => `${n} ${Number(n) === 1 ? 'hour' : 'hours'}`)
    .replace(/(\d+(?:[.,]\d+)?)\s*phút\b/gi, (_, n) => `${n} ${Number(n) === 1 ? 'minute' : 'minutes'}`)
    .replace(/(\d+(?:[.,]\d+)?)\s*giây\b/gi, (_, n) => `${n} ${Number(n) === 1 ? 'second' : 'seconds'}`);
};

/**
 * Dịch chuỗi thông tin xe (vd: "Ô tô 4 - 5 chỗ (...) - Biển số: 65A-123.45") sang Tiếng Anh.
 */
export const translateVehicleInfoText = (rawVehicleInfo, language = 'vi') => {
  if (!rawVehicleInfo) return '';
  if (!language?.startsWith('en')) return rawVehicleInfo;

  let result = String(rawVehicleInfo);
  Object.entries(VEHICLE_TYPE_BY_NAME_EN).forEach(([viName, enName]) => {
    const idx = result.toLowerCase().indexOf(viName);
    if (idx !== -1) {
      result = result.slice(0, idx) + enName + result.slice(idx + viName.length);
    }
  });

  // Fallback rút gọn nếu tên dòng xe là "Ô tô" đơn lẻ
  result = result.replace(/^ô tô$/i, 'Car');
  result = result.replace(/Biển số\s*:/gi, 'License Plate:');
  return result;
};
