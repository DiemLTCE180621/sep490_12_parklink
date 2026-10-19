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
        title: 'Chính Sách & Điều Khoản Dành Cho Khách Hàng',
        content: `1. GIỚI THIỆU: ParkLink là nền tảng trung gian kết nối người thuê và chủ bãi xe.
2. ĐẶT CHỖ & THANH TOÁN: Khách hàng cần cung cấp thông tin phương tiện chính xác.
3. MIỄN TRỪ TRÁCH NHIỆM: ParkLink cung cấp giải pháp công nghệ tìm kiếm và hỗ trợ hợp đồng, không chịu trách nhiệm đối với sự cố mất mát tài sản hay tranh chấp ngoài hệ thống.
4. NGHĨA VỤ: Tuân thủ nội quy riêng của từng bãi đỗ xe.`,
        is_active: true
      },
      {
        policy_type: 'PROVIDER',
        title: 'Chính Sách & Quy Định Dành Cho Chủ Bãi Đỗ Xe (Đối Tác)',
        content: `1. CAM KẾT DỊCH VỤ: Cung cấp đúng số lượng chỗ đỗ, tiện ích và mức giá đã niêm yết.
2. PHÍ NỀN TẢNG: Chấp thuận các mức phí quản lý và giao dịch theo biểu phí niêm yết.
3. TRÁCH NHIỆM AN NINH: Chịu trách nhiệm về an ninh, giấy phép và tài sản phương tiện trong khuôn viên bãi xe.`,
        is_active: true
      }
    ];

    for (const policy of policies) {
      await prisma.system_Policy.upsert({
        where: { policy_type: policy.policy_type },
        update: {},
        create: policy
      });
    }
    console.log('✅ 5. System Policies hoàn tất.');

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
