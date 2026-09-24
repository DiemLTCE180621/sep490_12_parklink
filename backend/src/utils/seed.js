const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

/**
 * Hàm khởi tạo dữ liệu mẫu (Roles, Admin Account & Danh mục Amenity) cho dự án ParkLink
 */
async function seedAll() {
  try {
    console.log('⏳ Đang khởi tạo dữ liệu mẫu cho hệ thống ParkLink...');

    // 1. Seed Roles
    const roles = [
      { name: 'CUSTOMER', description: 'Khách hàng thuê bãi đỗ xe' },
      { name: 'PROVIDER', description: 'Chủ bãi đỗ xe (Parking Provider)' },
      { name: 'ADMIN', description: 'Quản trị viên hệ thống' }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role
      });
    }
    console.log('✅ Khởi tạo danh sách Roles thành công!');

    // 2. Seed Tài khoản Admin mặc định
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
            password_hash: password_hash,
            role_id: adminRole.id,
            status: 'ACTIVE',
            requires_password_change: false
          }
        });
        console.log(`✅ Khởi tạo Tài khoản Admin mặc định thành công! (Email: ${adminEmail} | Password: Admin@123456)`);
      } else {
        console.log(`ℹ️ Tài khoản Admin (${adminEmail}) đã tồn tại.`);
      }
    }

    // 3. Seed Danh mục Tiện ích (Bảng Amenity)
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
    console.log('✅ Khởi tạo Danh mục Tiện ích thành công!');

  } catch (error) {
    console.error('❌ Lỗi khi chạy seed dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAll();
}

module.exports = { seedAll };
