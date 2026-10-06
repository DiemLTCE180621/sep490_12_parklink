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
   * Sinh Mật Khẩu Ngẫu Nhiên dạng "Pl@<random_digits>" (đạt chuẩn >= 8 ký tự, 1 hoa, 1 thường, 1 số)
   * @returns {string} Mật khẩu ngẫu nhiên
   */
  generateRandomPassword() {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `Pl@${randomDigits}`;
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
   * UC-86: Gửi email cấp tài khoản cho Nhân viên khảo sát thực địa (Field Inspector)
   */
  async sendFieldInspectorWelcomeEmail({ toEmail, fullName, tempPassword }) {
    const subject = '[ParkLink] 📋 TÀI KHOẢN NHÂN VIÊN KHẢO SÁT THỰC ĐỊA & MẬT KHẨU ĐĂNG NHẬP';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0d9488; text-align: center;">Chào mừng bạn đến với Đội ngũ Thực địa ParkLink!</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Tài khoản dành cho <strong>Nhân viên khảo sát thực địa (Field Inspector)</strong> của bạn đã được khởi tạo bởi Quản trị viên hệ thống ParkLink.</p>
        
        <div style="background-color: #f0fdfa; padding: 15px; border-radius: 8px; border-left: 4px solid #0d9488; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Thông tin đăng nhập tài khoản của bạn:</strong></p>
          <p style="margin: 4px 0;">📧 Email đăng nhập: <strong>${toEmail}</strong></p>
          <p style="margin: 4px 0;">🔑 Mật khẩu tạm thời: <strong style="font-size: 18px; color: #0f766e; background: #ccfbf1; padding: 2px 8px; border-radius: 4px;">${tempPassword}</strong></p>
        </div>

        <p style="color: #e11d48; font-size: 13px;">⚠️ <em>Lưu ý: Bạn vui lòng Đổi mật khẩu cá nhân ngay trong lần đăng nhập đầu tiên để bảo mật tài khoản.</em></p>
        
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Ban Quản Trị Hệ Thống ParkLink Cần Thơ.</p>
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, tempPassword, 'FIELD_INSPECTOR');
  }

  /**
   * Gửi Mã OTP xác thực Quên mật khẩu
   */
  async sendPasswordResetOTPEmail({ toEmail, fullName, otpCode }) {
    const subject = '[ParkLink] 🔑 MÃ OTP ĐẶT LẠI MẬT KHẨU TÀI KHOẢN';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #f0fdfa; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">🔑</div>
          <h2 style="color: #0d9488; margin-top: 12px;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
        </div>

        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ParkLink gắn liền với địa chỉ email: <strong>${toEmail}</strong>.</p>
        
        <div style="background-color: #f0fdfa; padding: 20px; border-radius: 12px; text-align: center; border: 1px dashed #0d9488; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; color: #0f766e; font-size: 14px;">Mã xác thực OTP của bạn là:</p>
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #0d9488; background: #ccfbf1; padding: 6px 18px; border-radius: 8px; display: inline-block;">${otpCode}</span>
          <p style="margin: 12px 0 0 0; color: #e11d48; font-size: 13px;">⚠️ Mã này có hiệu lực trong vòng <strong>15 phút</strong>. Không chia sẻ mã này cho bất kỳ ai!</p>
        </div>

        <p style="color: #64748b; font-size: 14px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ ParkLink để bảo vệ tài khoản.</p>

        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Đội ngũ Hỗ trợ Hệ thống ParkLink.</p>
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, otpCode, 'FORGOT_PASSWORD_OTP');
  }

  /**
   * Gửi thông báo đã tiếp nhận yêu cầu đăng ký cho Chủ bãi đỗ xe (Provider)
   */
  async sendProviderPendingEmail({ toEmail, fullName, facilityName, systemFee }) {
    const formattedFee = Number(systemFee).toLocaleString('vi-VN');
    const subject = '[ParkLink] XÁC NHẬN YÊU CẦU ĐĂNG KÝ BÃI ĐỖ XE';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0d9488; text-align: center;">Đã Tiếp Nhận Yêu Cầu Đăng Ký!</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Hệ thống ParkLink đã tiếp nhận yêu cầu đăng ký cơ sở bãi đỗ xe <strong>${facilityName}</strong> của bạn.</p>
        <p>Mức phí nền tảng dự kiến cho cơ sở của bạn là: <strong>${formattedFee} VNĐ</strong>.</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #b45309;"><strong>Trạng thái: Đang chờ duyệt</strong></p>
          <p style="margin: 0; color: #92400e;">Ban quản trị ParkLink sẽ tiến hành xem xét hồ sơ của bạn. Khi yêu cầu được phê duyệt chính thức, chúng tôi sẽ gửi email thông báo kèm theo <strong>mật khẩu đăng nhập</strong> và hướng dẫn thanh toán cho bạn.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Đội ngũ Ban quản trị ParkLink Cần Thơ.</p>
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, null, 'PROVIDER_PENDING');
  }

  /**
   * M2-UC21 Bước 1: Gửi email thông báo cơ sở đang được CHUẨN BỊ cho Provider
   */
  async sendFacilityPreparingEmail({ toEmail, fullName, facilityName }) {
    const subject = '[ParkLink] 🔧 CƠ SỞ BÃI ĐỖ XE ĐANG ĐƯỢC CHUẨN BỊ';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #fef3c7; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">🔧</div>
          <h2 style="color: #d97706; margin-top: 12px;">Cơ Sở Của Bạn Đang Được Chuẩn Bị</h2>
        </div>

        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Ban quản trị ParkLink đã <strong style="color: #d97706;">duyệt sơ bộ</strong> yêu cầu đăng ký cơ sở bãi đỗ xe:</p>

        <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">🏢 ${facilityName}</p>
        </div>

        <p>Đội ngũ kỹ thuật ParkLink sẽ <strong>liên hệ và đến tận cơ sở</strong> của bạn để:</p>
        <ul style="color: #475569; line-height: 2;">
          <li>Khảo sát thực tế và chụp hình ảnh cơ sở</li>
          <li>Thiết lập hồ sơ cơ sở trên hệ thống</li>
          <li>Chuẩn bị đầy đủ dữ liệu trước khi công khai</li>
        </ul>

        <p>Bạn sẽ nhận được <strong>email thông báo tiếp theo</strong> cùng hướng dẫn thanh toán khi cơ sở đã hoàn tất chuẩn bị.</p>

        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Đội ngũ Ban quản trị ParkLink Cần Thơ.</p>
      </div>
    `;
    return await this.sendEmail(toEmail, subject, htmlContent, null, 'FACILITY_PREPARING');
  }

  /**
   * M2-UC21 Bước 2: Gửi email PHÊ DUYỆT CHÍNH THỨC
   */
  async sendFacilityApprovedWithQREmail({ toEmail, fullName, facilityName, systemFee, facilityId, tempPassword }) {
    const formattedFee = Number(systemFee).toLocaleString('vi-VN');
    const description = `PARKLINK F${facilityId}`;

    const subject = '[ParkLink] ✅ CƠ SỞ ĐÃ ĐƯỢC PHÊ DUYỆT - CẤP MẬT KHẨU';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #d1fae5; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">✅</div>
          <h2 style="color: #0d9488; margin-top: 12px;">Cơ Sở Đã Được Phê Duyệt Chính Thức!</h2>
        </div>

        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Cơ sở bãi đỗ xe <strong>${facilityName}</strong> đã hoàn tất chuẩn bị và được <strong style="color: #059669;">PHÊ DUYỆT CHÍNH THỨC</strong>. Dưới đây là thông tin đăng nhập của bạn:</p>

        <div style="background-color: #f0fdfa; padding: 15px; border-radius: 8px; border-left: 4px solid #0d9488; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Thông tin tài khoản Provider của bạn (Dùng để đăng nhập):</strong></p>
          <p style="margin: 4px 0;">📧 Email đăng nhập: <strong>${toEmail}</strong></p>
          <p style="margin: 4px 0;">🔑 Mật khẩu: <strong style="font-size: 18px; color: #0f766e; background: #ccfbf1; padding: 2px 8px; border-radius: 4px;">${tempPassword}</strong></p>
        </div>

        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #16a34a; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #15803d;">💰 Phí nền tảng thí điểm:</p>
          <p style="margin: 0; font-size: 24px; font-weight: 900; color: #166534;">${formattedFee} VNĐ</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Nội dung thanh toán (nếu có): <strong>${description}</strong></p>
        </div>

        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px;">
          <p style="margin: 0 0 8px 0; font-weight: bold;">Sau khi thanh toán:</p>
          <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
            <li>Đăng nhập vào tài khoản Provider của bạn</li>
            <li>Vào mục Dashboard và nhấn <strong>"Xác nhận đã thanh toán"</strong></li>
            <li>Cơ sở sẽ tự động được hiển thị công khai trên ParkLink</li>
          </ul>
        </div>

        <p style="color: #e11d48; font-size: 13px;">⚠️ <em>Vui lòng Đổi mật khẩu cá nhân trong lần đăng nhập đầu tiên.</em></p>

        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Đội ngũ Ban quản trị ParkLink Cần Thơ. Mọi thắc mắc xin liên hệ: ${this.emailUser}</p>
      </div>
    `;
    return await this.sendEmail(toEmail, subject, htmlContent, null, 'FACILITY_APPROVED_QR');
  }

  /**
   * M2-UC21: Gửi email thông báo PHÊ DUYỆT bãi đỗ xe cho Provider (legacy)
   */
  async sendFacilityApprovedEmail({ toEmail, fullName, facilityName }) {

    const subject = '[ParkLink] 🎉 BÃI ĐỖ XE ĐÃ ĐƯỢC PHÊ DUYỆT';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #d1fae5; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">✅</div>
          <h2 style="color: #0d9488; margin-top: 12px;">Xin Chúc Mừng! Bãi Đỗ Xe Đã Được Duyệt</h2>
        </div>

        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Ban quản trị ParkLink đã xem xét và <strong style="color: #059669;">PHÊ DUYỆT</strong> cơ sở bãi đỗ xe của bạn:</p>

        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #16a34a; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #15803d;">🏢 ${facilityName}</p>
        </div>

        <p>Cơ sở của bạn hiện đã <strong>hiển thị công khai</strong> trên nền tảng ParkLink và sẵn sàng đón nhận các yêu cầu thuê bãi từ khách hàng.</p>

        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #475569;">
          <p style="margin: 0 0 8px 0;"><strong>Bước tiếp theo:</strong></p>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Đăng nhập vào tài khoản Provider của bạn</li>
            <li>Hoàn tất thanh toán phí nền tảng (nếu chưa thực hiện)</li>
            <li>Theo dõi và xử lý các yêu cầu thuê bãi từ khách hàng</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Đội ngũ Ban quản trị ParkLink Cần Thơ.</p>
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, null, 'FACILITY_APPROVED');
  }

  /**
   * M2-UC22: Gửi email thông báo TỪ CHỐI bãi đỗ xe kèm lý do cho Provider
   * @param {object} params
   * @param {string} params.toEmail - Email của Provider
   * @param {string} params.fullName - Họ tên chủ bãi
   * @param {string} params.facilityName - Tên bãi đỗ xe bị từ chối
   * @param {string} params.reason - Lý do từ chối
   */
  async sendFacilityRejectedEmail({ toEmail, fullName, facilityName, reason }) {
    const subject = '[ParkLink] ❌ YÊU CẦU ĐĂNG KÝ BÃI ĐỖ XE BỊ TỪ CHỐI';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #fee2e2; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">❌</div>
          <h2 style="color: #dc2626; margin-top: 12px;">Yêu Cầu Đăng Ký Bị Từ Chối</h2>
        </div>

        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Rất tiếc, sau khi xem xét hồ sơ, Ban quản trị ParkLink đã <strong style="color: #dc2626;">TỪ CHỐI</strong> yêu cầu đăng ký cơ sở bãi đỗ xe:</p>

        <div style="background-color: #fff1f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #b91c1c;">🏢 ${facilityName}</p>
        </div>

        <div style="background-color: #fef9c3; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e;">📋 Lý do từ chối:</p>
          <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">${reason}</p>
        </div>

        <p>Bạn có thể khắc phục các vấn đề trên và liên hệ lại với Ban quản trị ParkLink để được hỗ trợ đăng ký lại.</p>

        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Đội ngũ Ban quản trị ParkLink Cần Thơ.</p>
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, null, 'FACILITY_REJECTED');
  }

  /**
   * Hàm core gửi email (tích hợp SMTP hoặc Console Simulation)
   * @param {string} toEmail
   * @param {string} subject
   * @param {string} htmlContent
   * @param {string|null} tempPassword - Mật khẩu tạm (nếu có, chỉ dùng cho email tạo tài khoản)
   * @param {string} roleName - Nhãn loại email để log
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
    if (tempPassword) {
      console.log(`🔑 MẬT KHẨU NGUYÊN BẢN ĐƯỢC TẠO: ${tempPassword}`);
    }
    console.log('==================================================\n');

    return { success: true, simulated: true, tempPassword };
  }
}

module.exports = new EmailService();
