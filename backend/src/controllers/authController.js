const authService = require('../services/authService');

class AuthController {
  
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

  async googleLogin(req, res, next) {
    try {
      const result = await authService.googleLogin(req.body);
      return res.status(200).json({
        status: 'success',
        message: result.message,
        data: result
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: 'fail', message: error.message });
      }
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await authService.changePassword({
        userId: req.user.userId,
        oldPassword,
        newPassword
      });
      return res.status(200).json({
        status: 'success',
        message: 'Đổi mật khẩu thành công!',
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      next(error);
    }
  }

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
