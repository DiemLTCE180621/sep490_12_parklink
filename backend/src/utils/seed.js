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


    //Diễm
    // 4. Seed Dữ liệu Test chức năng Đánh giá (Customer, Provider, Facility, Contract, Review)
    console.log('⏳ Đang tạo dữ liệu test cho chức năng Review...');
    const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    const providerRole = await prisma.role.findUnique({ where: { name: 'PROVIDER' } });

    if (customerRole && providerRole) {
      const salt = await bcrypt.genSalt(10);
      const testPasswordHash = await bcrypt.hash('Test@123456', salt);

      // 4.1 Tạo Customer
      const customer = await prisma.user.upsert({
        where: { email: 'customer_test@parklink.vn' },
        update: {
          password_hash: testPasswordHash,
          requires_password_change: false
        },
        create: {
          email: 'customer_test@parklink.vn',
          full_name: 'Khách Hàng Test Review',
          phone_number: '0901234567',
          role_id: customerRole.id,
          status: 'ACTIVE',
          password_hash: testPasswordHash,
          requires_password_change: false
        }
      });

      // 4.2 Tạo Provider
      const provider = await prisma.user.upsert({
        where: { email: 'provider_test@parklink.vn' },
        update: {
          password_hash: testPasswordHash,
          requires_password_change: false
        },
        create: {
          email: 'provider_test@parklink.vn',
          full_name: 'Chủ Bãi Đỗ Xe Test',
          phone_number: '0909876543',
          role_id: providerRole.id,
          status: 'ACTIVE',
          password_hash: testPasswordHash,
          requires_password_change: false
        }
      });

      // 4.3 Tạo Facility cho Provider này
      const facility = await prisma.facility.upsert({
        where: { provider_id: provider.id },
        update: {},
        create: {
          provider_id: provider.id,
          name: 'Bãi đỗ xe Đại học Cần Thơ',
          address: 'Đường 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ',
          vehicle_types: JSON.parse('["Ô TÔ 4 CHỖ", "Ô TÔ 7 CHỖ"]'),
          capacity: 10,
          price_per_month: 1500000,
          payment_status: 'PAID',
          verification_status: 'APPROVED'
        }
      });

      // 4.4 Tạo Reservation Request (Yêu cầu thuê)
      let reservation = await prisma.reservation_Request.findFirst({
        where: { customer_id: customer.id, facility_id: facility.id }
      });

      if (!reservation) {
        reservation = await prisma.reservation_Request.create({
          data: {
            customer_id: customer.id,
            facility_id: facility.id,
            vehicle_info: 'Toyota Vios - 65A 123.45',
            desired_start_date: new Date(),
            status: 'APPROVED'
          }
        });
      }

      // 4.5 Tạo Confirmation Record (Hợp đồng xác nhận)
      const contract = await prisma.confirmation_Record.upsert({
        where: { reservation_id: reservation.id },
        update: {},
        create: {
          reservation_id: reservation.id,
          contract_code: 'HD_TEST_001',
          agreed_price: 1500000,
          start_date: new Date(),
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Thuê 1 tháng
          contract_snapshot: JSON.parse('{"note": "Hợp đồng test"}'),
          status: 'COMPLETED'
        }
      });

      // 4.6 Tạo 1 Review mẫu để test chức năng View (M5-UC69)
      const existingReview = await prisma.review.findFirst({
        where: { customer_id: customer.id, facility_id: facility.id }
      });

      if (!existingReview) {
        await prisma.review.create({
          data: {
            customer_id: customer.id,
            facility_id: facility.id,
            rating: 5,
            comment: 'Bãi đỗ xe rất rộng rãi và an ninh tốt! Rất hài lòng.',
            status: 'VISIBLE'
          }
        });
      }

      console.log('✅ Tạo dữ liệu test chức năng Review thành công!');
      console.log(`📌 THÔNG TIN TÀI KHOẢN ĐỂ BẠN ĐĂNG NHẬP TEST:`);
      console.log(`   - Khách hàng (Đánh giá): customer_test@parklink.vn`);
      console.log(`   - Chủ bãi đỗ xe: provider_test@parklink.vn`);
      console.log(`   - Mật khẩu chung: Test@123456`);
      console.log(`   - Mã cơ sở bãi đỗ xe (facility_id): ${facility.id}`);
    }

  } catch (error) {//diễm
    console.error('❌ Lỗi khi chạy seed dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAll();
}

module.exports = { seedAll };
