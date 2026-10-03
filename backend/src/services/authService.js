const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
const emailService = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'parklink_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// In-memory Cache lưu trữ OTP Quên mật khẩu để không bị phụ thuộc permissions của DB PostgreSQL
const otpStore = new Map();

/**
 * Service xử lý toàn bộ Business Logic liên quan đến Xác thực (Auth) & Nghiệp vụ Thí điểm Ninh Kiều, Cần Thơ
 */
class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        role: user.role.name,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  sanitizeUser(user) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Lấy danh mục tiện ích toàn hệ thống từ Database (Bảng Amenity)
   */
  async getAmenities() {
    return await userRepository.findAmenities();
  }

  /**
   * UC01: Đăng ký Khách hàng (Customer) - Sinh mật khẩu ngẫu nhiên gửi qua Email
   */
  async registerCustomer(data) {
    const { email, full_name, phone_number } = data;

    if (!email) {
      const error = new Error('Thiếu thông tin email!');
      error.status = 400;
      throw error;
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('Địa chỉ email này đã được sử dụng!');
      error.status = 400;
      throw error;
    }

    let customerRole = await roleRepository.findByName('CUSTOMER');
    if (!customerRole) {
      customerRole = await roleRepository.createRole({
        name: 'CUSTOMER',
        description: 'Khách hàng thuê bãi đỗ xe'
      });
    }

    const tempPassword = emailService.generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    const newUser = await userRepository.createUser({
      email,
      full_name,
      phone_number,
      password_hash,
      role_id: customerRole.id,
      status: 'ACTIVE',
      requires_password_change: true
    });

    const emailResult = await emailService.sendCustomerWelcomeEmail({
      toEmail: email,
      fullName: full_name,
      tempPassword
    });

    return {
      user: this.sanitizeUser(newUser),
      tempPasswordMessage: 'Mật khẩu ngẫu nhiên đã được gửi về email của bạn!',
      simulatedTempPassword: emailResult.simulated ? tempPassword : undefined
    };
  }

  /**
   * UC02 / UC03: Đăng ký Tài khoản Owner (Provider) & Bãi đỗ xe
   */
  async registerProvider(data) {
    const {
      email,
      full_name,
      phone_number,
      facility_name,
      address,
      latitude,
      longitude,
      capacity,
      price_per_month,
      vehicle_types,
      amenity_ids,
      images
    } = data;

    if (!email) {
      const error = new Error('Thiếu thông tin email!');
      error.status = 400;
      throw error;
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('Địa chỉ email này đã được sử dụng!');
      error.status = 400;
      throw error;
    }

    let providerRole = await roleRepository.findByName('PROVIDER');
    if (!providerRole) {
      providerRole = await roleRepository.createRole({
        name: 'PROVIDER',
        description: 'Chủ bãi đỗ xe (Parking Provider)'
      });
    }

    const slotCount = parseInt(capacity, 10);
    let system_fee = 2000000;
    if (slotCount >= 4 && slotCount <= 7) {
      system_fee = 4000000;
    } else if (slotCount > 7) {
      system_fee = 6000000;
    }

    const tempPassword = emailService.generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    const userData = {
      email,
      full_name,
      phone_number,
      password_hash,
      role_id: providerRole.id,
      status: 'PENDING', // Chờ Admin duyệt
      requires_password_change: true
    };

    const facilityData = {
      name: facility_name,
      address: address || 'Phường Ninh Kiều, Thành phố Cần Thơ',
      latitude: latitude ? parseFloat(latitude) : 10.034185,
      longitude: longitude ? parseFloat(longitude) : 105.788326,
      capacity: slotCount,
      price_per_month: parseFloat(price_per_month),
      system_fee: system_fee,
      vehicle_types: vehicle_types || ['CAR_4_5_SEATER'],
      verification_status: 'PENDING_REVIEW', // Chờ Admin duyệt
      payment_status: 'UNPAID',
      visibility_status: 'HIDDEN' // Ẩn cho đến khi được duyệt
    };

    const newProvider = await userRepository.createProviderWithFacility(
      userData,
      facilityData,
      amenity_ids || [],
      images || []
    );

    const emailResult = await emailService.sendProviderPendingEmail({
      toEmail: email,
      fullName: full_name,
      facilityName: facility_name,
      systemFee: system_fee
    });

    return {
      user: this.sanitizeUser(newProvider),
      system_fee,
      message: 'Yêu cầu đăng ký đã được tiếp nhận! Vui lòng chờ Ban quản trị phê duyệt.'
    };
  }

  async login(data) {
    const { email, password } = data;

    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Email hoặc mật khẩu không chính xác!');
      error.status = 401;
      throw error;
    }

    if (user.status === 'BLOCKED' || user.status === 'INACTIVE' || user.status === 'REJECTED') {
      const error = new Error('Tài khoản của bạn đã bị khóa hoặc bị từ chối!');
      error.status = 403;
      throw error;
    }

    if (!user.password_hash) {
      const error = new Error('Tài khoản chưa có mật khẩu!');
      error.status = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Email hoặc mật khẩu không chính xác!');
      error.status = 401;
      throw error;
    }

    const token = this.generateToken(user);
    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  async changePassword({ userId, oldPassword, newPassword }) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('Không tìm thấy người dùng!');
      error.status = 404;
      throw error;
    }

    if (user.password_hash) {
      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        const error = new Error('Mật khẩu hiện tại không chính xác!');
        error.status = 400;
        throw error;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    const updatedUser = await userRepository.updateUserPassword(userId, newPasswordHash);
    return this.sanitizeUser(updatedUser);
  }

  /**
   * Bước 1: Yêu cầu đặt lại mật khẩu - Sinh và gửi mã OTP qua Email
   */
  async requestPasswordReset(email) {
    if (!email) {
      const error = new Error('Vui lòng nhập email!');
      error.status = 400;
      throw error;
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Không tìm thấy tài khoản với email này trong hệ thống!');
      error.status = 404;
      throw error;
    }

    if (user.status === 'BLOCKED' || user.status === 'REJECTED') {
      const error = new Error('Tài khoản đã bị khóa hoặc bị từ chối!');
      error.status = 403;
      throw error;
    }

    // Sinh mã OTP 6 chữ số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 phút

    // Lưu thông tin OTP vào RAM Cache (otpStore)
    otpStore.set(user.email, {
      code: otpCode,
      expiresAt,
      attempts: 0
    });

    const emailResult = await emailService.sendPasswordResetOTPEmail({
      toEmail: user.email,
      fullName: user.full_name,
      otpCode
    });

    return {
      message: 'Mã OTP xác thực đặt lại mật khẩu đã được gửi đến email của bạn!',
      simulatedOtp: emailResult.simulated ? otpCode : undefined
    };
  }

  /**
   * Bước 2: Xác nhận mã OTP và đặt lại mật khẩu mới (Giới hạn nhập sai tối đa 5 lần)
   */
  async verifyAndResetPassword({ email, otpCode, newPassword }) {
    if (!email || !otpCode || !newPassword) {
      const error = new Error('Vui lòng nhập đầy đủ email, mã OTP và mật khẩu mới!');
      error.status = 400;
      throw error;
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Không tìm thấy tài khoản!');
      error.status = 404;
      throw error;
    }

    const MAX_ATTEMPTS = 5;
    const otpRecord = otpStore.get(user.email);

    if (!otpRecord) {
      const error = new Error('Không tìm thấy mã OTP đặt lại mật khẩu hoặc mã đã bị hủy! Vui lòng bấm gửi yêu cầu mã OTP mới.');
      error.status = 400;
      throw error;
    }

    if (otpRecord.expiresAt < Date.now()) {
      otpStore.delete(user.email);
      const error = new Error('Mã OTP đã hết hạn (15 phút)! Vui lòng bấm gửi yêu cầu mã OTP mới.');
      error.status = 400;
      throw error;
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(user.email);
      const error = new Error('Bạn đã nhập sai OTP quá 5 lần! Mã OTP cũ đã bị hủy. Vui lòng bấm yêu cầu mã OTP mới.');
      error.status = 400;
      throw error;
    }

    if (otpRecord.code !== otpCode) {
      otpRecord.attempts += 1;

      if (otpRecord.attempts >= MAX_ATTEMPTS) {
        otpStore.delete(user.email);
        const error = new Error('Bạn đã nhập sai OTP quá 5 lần! Mã OTP đã bị hủy để bảo mật. Vui lòng bấm yêu cầu mã OTP mới.');
        error.status = 400;
        throw error;
      }

      const remaining = MAX_ATTEMPTS - otpRecord.attempts;
      const error = new Error(`Mã OTP không chính xác! Bạn còn ${remaining} lần thử trước khi mã bị hủy.`);
      error.status = 400;
      throw error;
    }

    // Xác thực thành công -> tiến hành đổi mật khẩu và xóa OTP khỏi RAM Cache
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await userRepository.updateUserPassword(user.id, newPasswordHash, false);
    otpStore.delete(user.email);

    return {
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
    };
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('Không tìm thấy người dùng!');
      error.status = 404;
      throw error;
    }
    return this.sanitizeUser(user);
  }
}

module.exports = new AuthService();
