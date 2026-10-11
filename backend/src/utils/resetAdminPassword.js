const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const newPassword = process.argv[2] || 'Admin@123456';
  const email = process.argv[3] || 'admin@parklink.vn';

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: { password_hash }
    });

    console.log(`✅ Đã đặt lại mật khẩu cho ${email} thành công! Mật khẩu mới: ${newPassword}`);
  } catch (error) {
    console.error('❌ Lỗi reset mật khẩu:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
