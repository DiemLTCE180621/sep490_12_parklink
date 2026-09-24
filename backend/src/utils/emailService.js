const nodemailer = require('nodemailer');

/**
 * Service gửi Email thông báo và cấp Mật khẩu ngẫu nhiên cho dự án ParkLink
 */
class EmailService {
  constructor() {
    this.emailUser = process.env.EMAIL_USER;
    this.emailPass = process.env.EMAIL_PASS;

    if (this.emailUser && this.emailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.emailUser,
          pass: this.emailPass
        }
      });
    } else {
      this.transporter = null;
    }
  }

  /**
   * Sinh Mật Khẩu Ngẫu Nhiên dạng "PL@<random_digits>"
   * @returns {string} Mật khẩu ngẫu nhiên
   */
  generateRandomPassword() {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `PL@${randomDigits}`;
  }

  /**
   * UC01: Gửi Mật khẩu ngẫu nhiên cho Khách hàng (Customer) sau khi đăng ký thành công
   */
  async sendCustomerWelcomeEmail({ toEmail, fullName, tempPassword }) {
    const subject = '[ParkLink] XÁC NHẬN TÀI KHOẢN KHÁCH HÀNG & MẬT KHẨU ĐĂNG NHẬP';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0d9488; text-align: center;">Chào mừng bạn đến với ParkLink!</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Tài khoản khách hàng thuê bãi đỗ xe theo tháng của bạn đã được khởi tạo thành công trên hệ thống ParkLink (Thử nghiệm tại Phường Ninh Kiều, Cần Thơ).</p>
        
        <div style="background-color: #f0fdfa; padding: 15px; border-radius: 8px; border-left: 4px solid #0d9488; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Thông tin đăng nhập của bạn:</strong></p>
          <p style="margin: 4px 0;">📧 Email: <strong>${toEmail}</strong></p>
          <p style="margin: 4px 0;">🔑 Mật khẩu tạm thời: <strong style="font-size: 18px; color: #0f766e; background: #ccfbf1; padding: 2px 8px; border-radius: 4px;">${tempPassword}</strong></p>
        </div>

        <p style="color: #e11d48; font-size: 13px;">⚠️ <em>Lưu ý: Vì mục đích bảo mật, bạn sẽ được yêu cầu Đổi mật khẩu mới ngay trong lần đăng nhập đầu tiên.</em></p>
        
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Dự án ParkLink - Nền tảng kết nối bãi đỗ xe theo tháng.</p>
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, tempPassword, 'CUSTOMER');
  }

  /**
   * Gửi thông báo phê duyệt & mật khẩu đăng nhập cho Chủ bãi đỗ xe (Provider)
   */
  async sendProviderApprovalEmail({ toEmail, fullName, facilityName, tempPassword, systemFee }) {
    const formattedFee = Number(systemFee).toLocaleString('vi-VN');
    const subject = '[ParkLink] PHÊ DUYỆT BÃI ĐỖ XE & CẤP MẬT KHẨU TÀI KHOẢN PROVIDER';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0d9488; text-align: center;">Phê Duyệt Cơ Sở Bãi Đỗ Xe Thành Công!</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Cơ sở bãi đỗ xe <strong>${facilityName}</strong> tại Phường Ninh Kiều đã được Ban quản trị ParkLink khảo sát và phê duyệt đưa lên nền tảng.</p>
        <p>Phí nền tảng thí điểm đã xác nhận: <strong>${formattedFee} VNĐ</strong>.</p>
        
        <div style="background-color: #f0fdfa; padding: 15px; border-radius: 8px; border-left: 4px solid #0d9488; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Thông tin tài khoản Provider của bạn:</strong></p>
          <p style="margin: 4px 0;">📧 Email đăng nhập: <strong>${toEmail}</strong></p>
          <p style="margin: 4px 0;">🔑 Mật khẩu khởi tạo: <strong style="font-size: 18px; color: #0f766e; background: #ccfbf1; padding: 2px 8px; border-radius: 4px;">${tempPassword}</strong></p>
        </div>

        <p style="color: #e11d48; font-size: 13px;">⚠️ <em>Vui lòng đăng nhập và Đổi mật khẩu cá nhân trong lần đăng nhập đầu tiên để quản trị cơ sở bãi xe.</em></p>
        
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Đội ngũ Ban quản trị ParkLink Cần Thơ.</p>
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, tempPassword, 'PROVIDER');
  }

  /**
   * Hàm core gửi email (tích hợp SMTP hoặc Console Simulation)
   */
  async sendEmail(toEmail, subject, htmlContent, tempPassword, roleName) {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"ParkLink System" <${this.emailUser}>`,
          to: toEmail,
          subject: subject,
          html: htmlContent
        });
        console.log(`✉️ [EMAIL SENT] Đã gửi email thành công tới ${toEmail}`);
        return { success: true, simulated: false };
      } catch (err) {
        console.error(`❌ [EMAIL ERROR] Lỗi khi gửi email tới ${toEmail}:`, err.message);
      }
    }

    // Console Fallback khi chưa cấu hình EMAIL_USER / EMAIL_PASS
    console.log('\n==================================================');
    console.log(`📧 [GIẢ LẬP GỬI EMAIL ${roleName}] (Chưa thiết lập SMTP)`);
    console.log(`📩 Tới Email: ${toEmail}`);
    console.log(`📋 Tiêu đề: ${subject}`);
    console.log(`🔑 MẬT KHẨU NGUYÊN BẢN ĐƯỢC TẠO: ${tempPassword}`);
    console.log('==================================================\n');

    return { success: true, simulated: true, tempPassword };
  }
}

module.exports = new EmailService();
