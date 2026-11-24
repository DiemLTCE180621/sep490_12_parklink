const nodemailer = require('nodemailer');
const emailFooter = require('./emailFooter');

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
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Chào mừng bạn đến với ParkLink!</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Tài khoản khách hàng thuê bãi đỗ xe theo tháng của bạn đã được khởi tạo thành công trên hệ thống ParkLink (Thử nghiệm tại Phường Ninh Kiều, Cần Thơ).</p>
        
        <div style="margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Thông tin đăng nhập của bạn:</strong></p>
          <p style="margin: 4px 0;">Email: <strong>${toEmail}</strong></p>
          <p style="margin: 4px 0;">Mật khẩu tạm thời: <strong>${tempPassword}</strong></p>
        </div>

        <p style="color: #e11d48; font-size: 13px;"><em>Lưu ý: Vì mục đích bảo mật, bạn sẽ được yêu cầu Đổi mật khẩu mới ngay trong lần đăng nhập đầu tiên.</em></p>
        
        ${emailFooter}
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, tempPassword, 'CUSTOMER');
  }

  /**
   * UC-86: Gửi email cấp tài khoản cho Nhân viên khảo sát thực địa (Field Inspector)
   */
  async sendFieldInspectorWelcomeEmail({ toEmail, fullName, tempPassword, address }) {
    const subject = '[ParkLink] TÀI KHOẢN NHÂN VIÊN KHẢO SÁT THỰC ĐỊA & MẬT KHẨU ĐĂNG NHẬP';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Chào mừng bạn đến với Đội ngũ Thực địa ParkLink!</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Tài khoản dành cho <strong>Nhân viên khảo sát thực địa (Field Inspector)</strong> của bạn đã được khởi tạo bởi Quản trị viên hệ thống ParkLink.</p>
        
        <div style="margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Thông tin tài khoản của bạn:</strong></p>
          <p style="margin: 4px 0;">Email đăng nhập: <strong>${toEmail}</strong></p>
          <p style="margin: 4px 0;">Mật khẩu tạm thời: <strong>${tempPassword}</strong></p>
          ${address ? `<p style="margin: 4px 0;">Địa chỉ: <strong>${address}</strong></p>` : ''}
        </div>

        <p style="color: #e11d48; font-size: 13px;"><em>Lưu ý: Bạn vui lòng Đổi mật khẩu cá nhân ngay trong lần đăng nhập đầu tiên để bảo mật tài khoản.</em></p>
        
        ${emailFooter}
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, tempPassword, 'FIELD_INSPECTOR');
  }

  /**
   * Gửi Mã OTP xác thực Quên mật khẩu
   */
  async sendPasswordResetOTPEmail({ toEmail, fullName, otpCode }) {
    const subject = '[ParkLink] MÃ OTP ĐẶT LẠI MẬT KHẨU TÀI KHOẢN';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Yêu Cầu Đặt Lại Mật Khẩu</h2>

        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ParkLink gắn liền với địa chỉ email: <strong>${toEmail}</strong>.</p>
        
        <div style="margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #0f766e; font-size: 14px;">Mã xác thực OTP của bạn là:</p>
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 6px;">${otpCode}</span>
          <p style="margin: 12px 0 0 0; color: #e11d48; font-size: 13px;">Mã này có hiệu lực trong vòng <strong>15 phút</strong>. Không chia sẻ mã này cho bất kỳ ai!</p>
        </div>

        <p style="color: #64748b; font-size: 14px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ ParkLink để bảo vệ tài khoản.</p>

        ${emailFooter}
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
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Đã Tiếp Nhận Yêu Cầu Đăng Ký!</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Hệ thống ParkLink đã tiếp nhận yêu cầu đăng ký cơ sở bãi đỗ xe <strong>${facilityName}</strong> của bạn.</p>
        <p>Mức phí nền tảng dự kiến cho cơ sở của bạn là: <strong>${formattedFee} VNĐ</strong>.</p>
        
        <div style="margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #b45309;"><strong>Trạng thái: Đang chờ duyệt</strong></p>
          <p style="margin: 0;">Ban quản trị ParkLink sẽ tiến hành xem xét hồ sơ của bạn. Khi yêu cầu được phê duyệt chính thức, chúng tôi sẽ gửi email thông báo kèm theo <strong>mật khẩu đăng nhập</strong> và hướng dẫn thanh toán cho bạn.</p>
        </div>
        
        ${emailFooter}
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, null, 'PROVIDER_PENDING');
  }

  /**
   * Báo Provider về cơ sở đang chuẩn bị
   */
  async sendFacilityPreparingEmail({ toEmail, fullName, facilityName, inspectorName, inspectorPhone }) {
    const subject = '[ParkLink] CƠ SỞ BÃI ĐỖ XE ĐANG ĐƯỢC CHUẨN BỊ & KHẢO SÁT';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Cơ Sở Của Bạn Đang Được Chuẩn Bị</h2>

        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Ban quản trị ParkLink đã <strong>duyệt sơ bộ</strong> yêu cầu đăng ký cơ sở bãi đỗ xe:</p>

        <div style="margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold;">${facilityName}</p>
        </div>

        ${inspectorName ? `
        <div style="margin: 16px 0;">
          <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: #166534;">Nhân viên khảo sát thực địa phụ trách:</p>
          <p style="margin: 0; color: #15803d; font-size: 14px;">Họ tên: <strong>${inspectorName}</strong> ${inspectorPhone ? `— SĐT: <strong>${inspectorPhone}</strong>` : ''}</p>
        </div>
        ` : ''}

        <p>Đội ngũ kỹ thuật ParkLink sẽ <strong>liên hệ và đến tận cơ sở</strong> của bạn để:</p>
        <ul style="color: #475569; line-height: 2;">
          <li>Khảo sát thực tế và chụp hình ảnh cơ sở</li>
          <li>Thiết lập hồ sơ cơ sở trên hệ thống</li>
          <li>Chuẩn bị đầy đủ dữ liệu trước khi công khai</li>
        </ul>

        <p>Bạn sẽ nhận được <strong>email thông báo tiếp theo</strong> cùng hướng dẫn thanh toán khi cơ sở đã hoàn tất chuẩn bị.</p>

        ${emailFooter}
      </div>
    `;
    return await this.sendEmail(toEmail, subject, htmlContent, null, 'FACILITY_PREPARING');
  }

  /**
   * Báo Provider cơ sở đã được duyệt
   */
  async sendFacilityApprovedWithQREmail({ toEmail, fullName, facilityName, systemFee, facilityId, tempPassword }) {
    const formattedFee = Number(systemFee).toLocaleString('vi-VN');
    const description = `PARKLINK F${facilityId}`;

    const subject = '[ParkLink] CƠ SỞ ĐÃ ĐƯỢC PHÊ DUYỆT - CẤP MẬT KHẨU';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Cơ Sở Đã Được Phê Duyệt Chính Thức!</h2>

        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Cơ sở bãi đỗ xe <strong>${facilityName}</strong> đã hoàn tất chuẩn bị và được <strong>PHÊ DUYỆT CHÍNH THỨC</strong>. Dưới đây là thông tin đăng nhập của bạn:</p>

        <div style="margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Thông tin tài khoản Provider của bạn (Dùng để đăng nhập):</strong></p>
          <p style="margin: 4px 0;">Email đăng nhập: <strong>${toEmail}</strong></p>
          <p style="margin: 4px 0;">Mật khẩu: <strong>${tempPassword}</strong></p>
        </div>

        <div style="margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #15803d;">Phí nền tảng thí điểm:</p>
          <p style="margin: 0; font-size: 24px; font-weight: 900;">${formattedFee} VNĐ</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Nội dung thanh toán (nếu có): <strong>${description}</strong></p>
        </div>

        <div style="margin: 20px 0; font-size: 14px;">
          <p style="margin: 0 0 8px 0; font-weight: bold;">Sau khi thanh toán:</p>
          <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
            <li>Đăng nhập vào tài khoản Provider của bạn</li>
            <li>Vào mục Dashboard và nhấn <strong>"Xác nhận đã thanh toán"</strong></li>
            <li>Cơ sở sẽ tự động được hiển thị công khai trên ParkLink</li>
          </ul>
        </div>

        <p style="color: #e11d48; font-size: 13px;"><em>Vui lòng Đổi mật khẩu cá nhân trong lần đăng nhập đầu tiên.</em></p>

        <p style="font-size: 12px; color: #64748b;">Mọi thắc mắc xin liên hệ: ${this.emailUser}</p>
        ${emailFooter}
      </div>
    `;
    return await this.sendEmail(toEmail, subject, htmlContent, null, 'FACILITY_APPROVED_QR');
  }

  /**
   * Gửi email từ chối kèm lý do
   * @param {object} params
   * @param {string} params.toEmail - Email của Provider
   * @param {string} params.fullName - Họ tên chủ bãi
   * @param {string} params.facilityName - Tên bãi đỗ xe bị từ chối
   * @param {string} params.reason - Lý do từ chối
   */
  async sendFacilityRejectedEmail({ toEmail, fullName, facilityName, reason }) {
    const subject = '[ParkLink] YÊU CẦU ĐĂNG KÝ BÃI ĐỖ XE BỊ TỪ CHỐI';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Yêu Cầu Đăng Ký Bị Từ Chối</h2>

        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Rất tiếc, sau khi xem xét hồ sơ, Ban quản trị ParkLink đã <strong>TỪ CHỐI</strong> yêu cầu đăng ký cơ sở bãi đỗ xe:</p>

        <div style="margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold;">${facilityName}</p>
        </div>

        <div style="margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #92400e;">Lý do từ chối:</p>
          <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">${reason}</p>
        </div>

        <p>Bạn có thể khắc phục các vấn đề trên và liên hệ lại với Ban quản trị ParkLink để được hỗ trợ đăng ký lại.</p>

        ${emailFooter}
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, null, 'FACILITY_REJECTED');
  }

  /**
   * UC10: Gửi email thông báo Đặt lại mật khẩu từ Quản trị viên (Admin)
   */
  async sendAdminForceResetPasswordEmail({ toEmail, fullName, tempPassword }) {
    const subject = '[ParkLink] THÔNG BÁO ĐẶT LẠI MẬT KHẨU TÀI KHOẢN';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">Thông Báo Đặt Lại Mật Khẩu</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Mật khẩu tài khoản của bạn trên nền tảng <strong>ParkLink</strong> vừa được Quản trị viên hệ thống (Admin) đặt lại.</p>
        
        <div style="margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Thông tin đăng nhập mới của bạn:</strong></p>
          <p style="margin: 4px 0;">Email: <strong>${toEmail}</strong></p>
          <p style="margin: 4px 0;">Mật khẩu tạm thời: <strong>${tempPassword}</strong></p>
        </div>

        <p style="color: #e11d48; font-size: 13px;"><em>Lưu ý: Vì mục đích bảo mật, bạn bắt buộc phải Đổi mật khẩu mới ngay trong lần đăng nhập đầu tiên với mật khẩu tạm thời này.</em></p>
        
        ${emailFooter}
      </div>
    `;

    return await this.sendEmail(toEmail, subject, htmlContent, tempPassword, 'FORCE_RESET_PASSWORD');
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
    console.log(`[GIẢ LẬP GỬI EMAIL ${roleName}] (Chưa thiết lập SMTP)`);
    console.log(`Tới Email: ${toEmail}`);
    console.log(`Tiêu đề: ${subject}`);
    if (tempPassword) {
      console.log(`🔑 MẬT KHẨU NGUYÊN BẢN ĐƯỢC TẠO: ${tempPassword}`);
    }
    console.log('==================================================\n');

    return { success: true, simulated: true, tempPassword };
  }

  /**
   * UC-66: Gửi email phát sóng (Broadcast Email) cho danh sách người dùng hệ thống
   * Xử lý bất đồng bộ (Background processing) và chia batch để tránh quá tải SMTP / spam trigger
   * @param {Object} params
   * @param {Array<string>} params.recipientEmails - Danh sách email nhận
   * @param {string} params.subject - Tiêu đề email
   * @param {string} params.htmlContent - Nội dung HTML của email
   * @returns {Promise<Object>} Tóm tắt tác vụ (batch ID, tổng số email vào hàng đợi, timestamp)
   */
  async sendBroadcastEmail({ recipientEmails, subject, htmlContent }) {
    const batchId = `BATCH_${Date.now()}`;
    const totalQueued = recipientEmails.length;

    // Xử lý chạy ngầm (asynchronous background task) không block HTTP response
    setImmediate(async () => {
      console.log(`[Broadcast Email] Bắt đầu tác vụ ${batchId} gửi tới ${totalQueued} người nhận...`);
      let successCount = 0;
      let failCount = 0;

      // Chia batch nhỏ (10 emails/batch)
      const BATCH_SIZE = 10;
      for (let i = 0; i < recipientEmails.length; i += BATCH_SIZE) {
        const batch = recipientEmails.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(async (email) => {
            try {
              await this.sendEmail(email, subject, htmlContent, null, 'BROADCAST');
              successCount++;
            } catch (err) {
              failCount++;
              console.error(`[Broadcast Email Error] Lỗi gửi tới ${email}:`, err.message);
            }
          })
        );

        // Nghỉ 500ms giữa các batch
        if (i + BATCH_SIZE < recipientEmails.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      console.log(`[Broadcast Email] Hoàn tất ${batchId}: Thành công ${successCount}, Thất bại ${failCount}`);
    });

    return {
      batchId,
      totalQueued,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new EmailService();
