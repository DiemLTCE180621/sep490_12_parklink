const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function seedAll() {
  try {
    console.log('Bắt đầu khởi tạo dữ liệu hệ thống...');

    // 1. Roles
    const roles = [
      { name: 'CUSTOMER', description: 'Khách hàng thuê bãi đỗ xe' },
      { name: 'PROVIDER', description: 'Chủ bãi đỗ xe (Parking Provider)' },
      { name: 'ADMIN', description: 'Quản trị viên hệ thống' },
      { name: 'FIELD_INSPECTOR', description: 'Nhân viên khảo sát thực địa' }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description },
        create: role
      });
    }
    console.log('✅ 1. Roles hoàn tất.');

    // 2. Tài khoản Admin mặc định
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    if (adminRole) {
      const adminEmail = 'admin@parklink.vn';
      const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('Admin@123456', salt);

        await prisma.user.create({
          data: {
            email: adminEmail,
            full_name: 'Quản Trị Viên ParkLink',
            phone_number: '0900000000',
            password_hash,
            role_id: adminRole.id,
            status: 'ACTIVE',
            requires_password_change: false
          }
        });
        console.log(`✅ 2. Admin tạo mới (${adminEmail} | Pass: Admin@123456).`);
      } else {
        console.log(`ℹ️ 2. Admin đã tồn tại (${adminEmail}).`);
      }
    }

    // 3. Danh mục Tiện ích (Amenities)
    const amenities = [
      { name: 'Có thể thuê chỗ cố định', icon: 'shield-check', type: 'SERVICE' },
      { name: 'Camera an ninh 24/7', icon: 'camera', type: 'SECURITY' },
      { name: 'Mái che mưa nắng', icon: 'umbrella', type: 'INFRASTRUCTURE' },
      { name: 'Bảo vệ trực trực tiếp', icon: 'user-check', type: 'SECURITY' },
      { name: 'Hệ thống chiếu sáng đêm', icon: 'sun', type: 'INFRASTRUCTURE' },
      { name: 'Trang bị PCCC đạt chuẩn', icon: 'flame', type: 'SECURITY' }
    ];

    for (const item of amenities) {
      await prisma.amenity.upsert({
        where: { name: item.name },
        update: { icon: item.icon, type: item.type },
        create: item
      });
    }
    console.log('✅ 3. Amenities hoàn tất.');

    // 4. Biểu phí nền tảng (Platform Fees)
    const platformFees = [
      {
        name: 'Gói Bãi Xe Nhỏ (1 - 3 chỗ)',
        min_slots: 1,
        max_slots: 3,
        fee_amount: 2000000,
        description: 'Bãi đỗ xe quy mô nhỏ từ 1 đến 3 chỗ',
        is_active: true
      },
      {
        name: 'Gói Bãi Xe Vừa (4 - 7 chỗ)',
        min_slots: 4,
        max_slots: 7,
        fee_amount: 4000000,
        description: 'Bãi đỗ xe quy mô vừa từ 4 đến 7 chỗ',
        is_active: true
      },
      {
        name: 'Gói Bãi Xe Lớn (Từ 8 chỗ trở lên)',
        min_slots: 8,
        max_slots: 999,
        fee_amount: 6000000,
        description: 'Bãi đỗ xe quy mô lớn từ 8 chỗ trở lên',
        is_active: true
      }
    ];

    for (const fee of platformFees) {
      const existingFee = await prisma.platform_Fee.findFirst({
        where: { name: fee.name }
      });
      if (!existingFee) {
        await prisma.platform_Fee.create({ data: fee });
      }
    }
    console.log('✅ 4. Platform Fees hoàn tất.');

    // 5. Chính sách hệ thống (System Policies)
    const policies = [
      {
        policy_type: 'CUSTOMER',
        title: 'Chính Sách & Điều Khoản Dịch Vụ Dành Cho Khách Hàng',
        content: `1. PHẠM VI DỊCH VỤ VÀ NỀN TẢNG:
- ParkLink là nền tảng số trung gian kết nối giữa khách hàng có nhu cầu gửi xe ô tô theo tháng với các chủ bãi đỗ xe tận dụng diện tích có sẵn tại khu vực thử nghiệm (quận Ninh Kiều, thành phố Cần Thơ).
- Nền tảng chỉ hỗ trợ dịch vụ gửi xe theo tháng cho xe ô tô, không hỗ trợ hình thức gửi theo giờ, theo ngày hoặc các dịch vụ phụ trợ khác.

2. MIỄN TRỪ TRÁCH NHIỆM TÀI SẢN:
- ParkLink đóng vai trò là kênh cung cấp thông tin, hỗ trợ khảo sát sơ bộ và tạo biên bản thỏa thuận điện tử giữa hai bên.
- ParkLink không sở hữu, không trực tiếp vận hành bãi đỗ và không chịu bất kỳ trách nhiệm pháp lý, dân sự hoặc bồi thường tài chính nào đối với các sự cố xảy ra tại bãi đỗ, bao gồm nhưng không giới hạn: mất cắp tài sản trên xe, mất xe, va quẹt, hư hỏng phương tiện, ngập lụt, cháy nổ hoặc thiên tai.
- Trách nhiệm bảo vệ tài sản thuộc về thỏa thuận trực tiếp giữa Khách thuê và Chủ bãi đỗ xe.

3. THANH TOÁN VÀ GIAO DỊCH NGOÀI HỆ THỐNG:
- ParkLink không thu hộ, không giữ tiền đặt cọc và không xử lý thanh toán tiền thuê bãi hàng tháng giữa Khách thuê và Chủ bãi.
- Mọi giao dịch tài chính về tiền gửi xe được hai bên trực tiếp thanh toán và thống nhất ngoài nền tảng (chuyển khoản trực tiếp hoặc tiền mặt). ParkLink không can thiệp và không giải quyết tranh chấp tài chính giữa hai bên.

4. BẢN CHẤT BIÊN BẢN XÁC NHẬN THUÊ XE:
- Biên bản xác nhận thuê xe trên hệ thống là chứng từ điện tử ghi nhận sự đồng thuận về thời hạn, vị trí và mức giá đã trao đổi giữa hai bên nhằm cập nhật tình trạng chỗ trống trên hệ thống.
- Biên bản này không có giá trị pháp lý thay thế cho hợp đồng công chứng hoặc dịch vụ định danh điện tử eKYC được chứng thực bởi cơ quan nhà nước.

5. NGHĨA VỤ CỦA KHÁCH THUÊ:
- Khai báo chính xác thông tin cá nhân, biển số và dòng phương tiện khi gửi yêu cầu thuê chỗ.
- Chấp hành nghiêm ngặt nội quy riêng, quy chuẩn an toàn phòng cháy chữa cháy và khung giờ ra vào do Chủ bãi đỗ xe quy định.`,
        is_active: true
      },
      {
        policy_type: 'PROVIDER',
        title: 'Quy Chế Vận Hành & Chính Sách Dành Cho Chủ Bãi Đỗ Xe (Đối Tác)',
        content: `1. ĐĂNG KÝ VÀ KHẢO SÁT XÁC MINH THỰC ĐỊA:
- Để đảm bảo tính trung thực và chất lượng cơ sở, bãi đỗ xe đăng ký mới sẽ được nhân viên khảo sát thực địa của ParkLink đến trực tiếp để kiểm tra hiện trạng, chụp ảnh xác thực, đo đạc tọa độ GPS và xác nhận công suất đỗ xe trước khi được phê duyệt kích hoạt trên bản đồ tìm kiếm.
- Chủ bãi có nghĩa vụ phối hợp, hỗ trợ và cung cấp thông tin trung thực cho nhân viên khảo sát.

2. PHÍ DỊCH VỤ NỀN TẢNG:
- Nền tảng áp dụng mức phí dịch vụ thu một lần duy nhất cho việc khảo sát, số hóa bãi xe, setup hệ thống và hỗ trợ kết nối:
  + Bãi từ 1 đến 3 chỗ đỗ: 2.000.000 VNĐ.
  + Bãi từ 4 đến 7 chỗ đỗ: 4.000.000 VNĐ.
  + Bãi từ 8 chỗ đỗ trở lên: 6.000.000 VNĐ.
- Phí nền tảng được thanh toán qua cổng thanh toán SePay. Phí này không hoàn lại sau khi cơ sở đã hoàn tất khảo sát và kích hoạt thành công trên hệ thống ParkLink.

3. KHÔNG TÍCH HỢP HẠ TẦNG PHẦN CỨNG TỰ ĐỘNG:
- Hệ thống ParkLink là nền tảng quản lý thông tin phần mềm, không bao gồm và không kết nối với barrier tự động, camera AI nhận diện biển số hay cảm biến IoT.
- Việc quản lý ra vào, giao nhận chìa khóa, thẻ xe và kiểm soát phương tiện vật lý tại chỗ do Chủ bãi hoàn toàn tự chủ quản lý bằng quy trình nội bộ.

4. NGHĨA VỤ QUẢN LÝ VÀ AN NINH CƠ SỞ:
- Chủ bãi có trách nhiệm cập nhật chính xác trạng thái chỗ đỗ trên hệ thống thông qua việc xác nhận các yêu cầu thuê tháng.
- Chủ bãi chịu trách nhiệm pháp lý đầy đủ về giấy phép sử dụng mặt bằng, an ninh trật tự, trang thiết bị phòng cháy chữa cháy và đảm bảo an toàn cho phương tiện được gửi tại cơ sở theo quy định của pháp luật.
- Chủ bãi cam kết không thu thêm bất kỳ chi phí phát sinh bất hợp lý nào ngoài mức giá đã niêm yết và thỏa thuận trong biên bản xác nhận với khách hàng.`,
        is_active: true
      }
    ];

    for (const policy of policies) {
      await prisma.system_Policy.upsert({
        where: { policy_type: policy.policy_type },
        update: {
          title: policy.title,
          content: policy.content,
          is_active: policy.is_active
        },
        create: policy
      });
    }
    console.log('✅ 5. System Policies hoàn tất.');

    // 6. Danh mục Loại phương tiện (Vehicle Types)
    const vehicleTypes = [
      {
        type_code: 'CAR_4_5_SEATER',
        name: 'Ô tô 4 - 5 chỗ (Sedan, Hatchback, CUV)',
        description: 'Các dòng xe con phổ thông 4 đến 5 chỗ ngồi.',
        is_active: true
      },
      {
        type_code: 'CAR_7_SEATER',
        name: 'Ô tô 7 chỗ (SUV, MPV)',
        description: 'Các dòng xe gia đình cỡ lớn, xe SUV, MPV 7 chỗ ngồi.',
        is_active: true
      },
      {
        type_code: 'PICKUP_TRUCK',
        name: 'Xe bán tải / Xe tải nhỏ (Dưới 1.5 tấn)',
        description: 'Xe bán tải hoặc xe tải chở hàng hạng nhẹ dưới 1.5 tấn.',
        is_active: true
      },
      {
        type_code: 'ELECTRIC_CAR',
        name: 'Xe ô tô điện (EV)',
        description: 'Các dòng xe ô tô chạy hoàn toàn bằng điện.',
        is_active: true
      }
    ];

    for (const vt of vehicleTypes) {
      await prisma.vehicle_Type.upsert({
        where: { type_code: vt.type_code },
        update: {},
        create: vt
      });
    }
    console.log('✅ 6. Vehicle Types hoàn tất.');

    console.log('Khởi tạo dữ liệu hệ thống hoàn tất!');
  } catch (error) {
    console.error('Lỗi khi seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAll();
}

module.exports = { seedAll };
