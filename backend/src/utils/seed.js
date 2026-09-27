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

    // ------------------------------------------------------
    // [THÊM MỚI] 4. Seed Thêm Tài khoản Mẫu (Providers & Customers nếu chưa có)
    // ------------------------------------------------------
    const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
    const providerRole = await prisma.role.findUnique({ where: { name: 'PROVIDER' } });
    const defaultPasswordHash = await bcrypt.hash('12345678', 10);

    // Providers
    const provider1 = await prisma.user.upsert({
      where: { email: 'provider1@parklink.vn' },
      update: {},
      create: {
        email: 'provider1@parklink.vn',
        full_name: 'Nguyễn Văn Hùng (Chủ bãi Mậu Thân)',
        phone_number: '0912345678',
        password_hash: defaultPasswordHash,
        role_id: providerRole.id,
        status: 'ACTIVE',
        requires_password_change: false
      }
    });

    const provider2 = await prisma.user.upsert({
      where: { email: 'provider2@parklink.vn' },
      update: {},
      create: {
        email: 'provider2@parklink.vn',
        full_name: 'Trần Thị Mai (Chủ bãi Hòa Bình)',
        phone_number: '0987654321',
        password_hash: defaultPasswordHash,
        role_id: providerRole.id,
        status: 'ACTIVE',
        requires_password_change: false
      }
    });

    const provider3 = await prisma.user.upsert({
      where: { email: 'provider3@parklink.vn' },
      update: {},
      create: {
        email: 'provider3@parklink.vn',
        full_name: 'Lê Văn Định (Chủ bãi 3 Tháng 2)',
        phone_number: '0977888999',
        password_hash: defaultPasswordHash,
        role_id: providerRole.id,
        status: 'ACTIVE',
        requires_password_change: false
      }
    });

    // Tìm tất cả tài khoản Customer đã có trong DB
    let customerList = await prisma.user.findMany({
      where: { role: { name: 'CUSTOMER' } }
    });

    // Nếu chưa có tài khoản Customer nào trong DB thì mới tạo tài khoản mẫu
    if (customerList.length === 0) {
      const customer1 = await prisma.user.create({
        data: {
          email: 'customer1@parklink.vn',
          full_name: 'Lê Hoàng Nam (Khách hàng 1)',
          phone_number: '0933111222',
          password_hash: defaultPasswordHash,
          role_id: customerRole.id,
          status: 'ACTIVE',
          requires_password_change: false
        }
      });
      customerList = [customer1];
    }
    console.log(`✅ Đã tìm thấy ${customerList.length} tài khoản Customer trong hệ thống!`);

    // ------------------------------------------------------
    // [THÊM MỚI] 5. Seed Facilities (Bãi đỗ xe Phường Ninh Kiều, TP. Cần Thơ)
    // ------------------------------------------------------
    const allAmenities = await prisma.amenity.findMany();
    const amenityMapByName = {};
    allAmenities.forEach(a => {
      amenityMapByName[a.name] = a.id;
    });

    const facilitiesData = [
      {
        provider_id: provider1.id,
        name: 'Bãi đỗ xe Ninh Kiều - Mậu Thân',
        address: '132 Đường Mậu Thân, Phường An Khánh, Quận Ninh Kiều, TP. Cần Thơ',
        latitude: 10.0335,
        longitude: 105.7684,
        vehicle_types: ['Xe 4 chỗ', 'Xe 7 chỗ', 'SUV / Bán tải'],
        capacity: 10,
        price_per_month: 1500000,
        system_fee: 4000000,
        payment_status: 'PAID',
        verification_status: 'APPROVED',
        visibility_status: 'VISIBLE',
        custom_terms: 'Bãi đỗ mở cửa từ 06:00 đến 23:00 hằng ngày. Vui lòng giữ vệ sinh chung và xuất trình biên bản xác nhận điện tử khi vào bãi.',
        images: [
          { image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800', is_primary: true },
          { image_url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800', is_primary: false }
        ],
        amenities: ['Có thể thuê chỗ cố định', 'Camera an ninh 24/7', 'Mái che mưa nắng', 'Bảo vệ trực trực tiếp']
      },
      {
        provider_id: provider2.id,
        name: 'Bãi đỗ xe Đại Lộ Hòa Bình',
        address: '45 Đại Lộ Hòa Bình, Phường Tân An, Quận Ninh Kiều, TP. Cần Thơ',
        latitude: 10.0362,
        longitude: 105.7831,
        vehicle_types: ['Xe 4 chỗ', 'Xe 7 chỗ'],
        capacity: 15,
        price_per_month: 1800000,
        system_fee: 4000000,
        payment_status: 'PAID',
        verification_status: 'APPROVED',
        visibility_status: 'VISIBLE',
        custom_terms: 'Bãi đỗ xe Hòa Bình hoạt động 24/7. Có hệ thống giám sát và bảo vệ trực ca đêm.',
        images: [
          { image_url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800', is_primary: true },
          { image_url: 'https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=800', is_primary: false }
        ],
        amenities: ['Camera an ninh 24/7', 'Hệ thống chiếu sáng đêm', 'Trang bị PCCC đạt chuẩn']
      },
      {
        provider_id: provider3.id,
        name: 'Bãi đỗ xe 3 Tháng 2 - Xuân Khánh',
        address: '286 Đường 3 Tháng 2, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ',
        latitude: 10.0248,
        longitude: 105.7629,
        vehicle_types: ['Xe 4 chỗ', 'Xe 7 chỗ', 'SUV / Bán tải'],
        capacity: 8,
        price_per_month: 1200000,
        system_fee: 4000000,
        payment_status: 'PAID',
        verification_status: 'APPROVED',
        visibility_status: 'VISIBLE',
        custom_terms: 'Đỗ xe đúng ô quy định, không để tài sản có giá trị cao trong xe.',
        images: [
          { image_url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800', is_primary: true }
        ],
        amenities: ['Mái che mưa nắng', 'Trang bị PCCC đạt chuẩn', 'Có thể thuê chỗ cố định']
      }
    ];

    const facilityList = [];

    for (const fData of facilitiesData) {
      let facility = await prisma.facility.findUnique({
        where: { provider_id: fData.provider_id }
      });

      if (!facility) {
        facility = await prisma.facility.create({
          data: {
            provider_id: fData.provider_id,
            name: fData.name,
            address: fData.address,
            latitude: fData.latitude,
            longitude: fData.longitude,
            vehicle_types: fData.vehicle_types,
            capacity: fData.capacity,
            price_per_month: fData.price_per_month,
            system_fee: fData.system_fee,
            payment_status: fData.payment_status,
            verification_status: fData.verification_status,
            visibility_status: fData.visibility_status,
            custom_terms: fData.custom_terms
          }
        });
      } else {
        facility = await prisma.facility.update({
          where: { id: facility.id },
          data: {
            name: fData.name,
            address: fData.address,
            latitude: fData.latitude,
            longitude: fData.longitude,
            vehicle_types: fData.vehicle_types,
            capacity: fData.capacity,
            price_per_month: fData.price_per_month,
            verification_status: fData.verification_status,
            visibility_status: fData.visibility_status
          }
        });
      }

      facilityList.push(facility);

      // Seed Hình ảnh cho bãi
      await prisma.facility_Image.deleteMany({ where: { facility_id: facility.id } });
      for (const img of fData.images) {
        await prisma.facility_Image.create({
          data: {
            facility_id: facility.id,
            image_url: img.image_url,
            is_primary: img.is_primary
          }
        });
      }

      // Seed Tiện ích cho bãi
      await prisma.facility_Amenity.deleteMany({ where: { facility_id: facility.id } });
      for (const amenityName of fData.amenities) {
        if (amenityMapByName[amenityName]) {
          await prisma.facility_Amenity.create({
            data: {
              facility_id: facility.id,
              amenity_id: amenityMapByName[amenityName]
            }
          });
        }
      }
    }
    console.log('✅ Khởi tạo Bãi đỗ xe mẫu (Ninh Kiều - Cần Thơ) kèm Hình ảnh & Tiện ích thành công!');

    // ------------------------------------------------------
    // [THÊM MỚI] 6. Seed Sample Reservation Requests (Gắn trực tiếp cho Customer của bạn)
    // ------------------------------------------------------
    // Lấy các Customer sẵn có (bao gồm tài khoản của bạn)
    for (let i = 0; i < customerList.length; i++) {
      const cust = customerList[i];
      const targetFacility = facilityList[i % facilityList.length];

      const existingRes = await prisma.reservation_Request.findFirst({
        where: {
          customer_id: cust.id,
          facility_id: targetFacility.id
        }
      });

      if (!existingRes) {
        await prisma.reservation_Request.create({
          data: {
            customer_id: cust.id,
            facility_id: targetFacility.id,
            vehicle_info: 'Mazda 3 2023 - Biển số: 65A-888.99 (Xe 5 chỗ)',
            desired_start_date: new Date('2026-10-01'),
            status: i % 2 === 0 ? 'PENDING' : 'APPROVED'
          }
        });
      }
    }
    console.log('✅ Khởi tạo Yêu cầu thuê xe mẫu (gắn trực tiếp với tài khoản Customer của bạn) thành công!');

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


