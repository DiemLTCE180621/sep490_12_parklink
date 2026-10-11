const authService = require('../services/authService');

/**
 * Controller nhận HTTP Request và phản hồi JSON
 */
class AuthController {
  /**
   * Lấy danh mục tiện ích toàn hệ thống từ bảng Amenity
   */
  async getAmenities(req, res, next) {
    try {
      const amenities = await authService.getAmenities();
      return res.status(200).json({
        status: 'success',
        data: { amenities }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin liên hệ hệ thống (Email, Hotline Admin)
   */
  async getContactInfo(req, res, next) {
    try {
      const contactInfo = await authService.getContactInfo();
      return res.status(200).json({
        status: 'success',
        data: contactInfo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC01: Đăng ký Khách hàng (Sinh mật khẩu ngẫu nhiên gửi email)
   */
  async registerCustomer(req, res, next) {
    try {
      const result = await authService.registerCustomer(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Đăng ký tài khoản khách hàng thành công! Mật khẩu ngẫu nhiên đã được tạo.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC02 / UC03: Đăng ký Provider & Cơ sở bãi xe (Tính phí 2tr/4tr theo slot)
   */
  async registerProvider(req, res, next) {
    try {
      const result = await authService.registerProvider(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Đăng ký tài khoản chủ bãi đỗ xe thành công!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC03: Đăng nhập
   */
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json({
        status: 'success',
        message: 'Đăng nhập thành công!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đổi mật khẩu lần đầu hoặc theo yêu cầu cá nhân
   */
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await authService.changePassword({
        userId: req.user.userId,
        oldPassword,
        newPassword
      });
      return res.status(200).json({
        status: 'success',
        message: 'Đổi mật khẩu thành công!',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC07: Lấy thông tin tài khoản cá nhân hiện tại
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.userId);
      return res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC08: Cập nhật thông tin tài khoản cá nhân
   */
  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.userId, req.body);
      return res.status(200).json({
        status: 'success',
        message: 'Cập nhật thông tin cá nhân thành công!',
        data: { user }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: 'fail', message: error.message });
      }
      next(error);
    }
  }

  /**
   * Yêu cầu gửi mã OTP quên mật khẩu
   */
  async requestPasswordReset(req, res, next) {
    try {
      const result = await authService.requestPasswordReset(req.body.email);
      return res.status(200).json({
        status: 'success',
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xác nhận mã OTP và đổi mật khẩu mới
   */
  async verifyAndResetPassword(req, res, next) {
    try {
      const result = await authService.verifyAndResetPassword(req.body);
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC05: Đăng xuất
   */
  async logout(req, res, next) {
    try {
      return res.status(200).json({
        status: 'success',
        message: 'Đăng xuất thành công!'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
