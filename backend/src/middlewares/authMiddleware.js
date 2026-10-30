const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'parklink_secret_key_2026';

/**
 * Middleware xác thực JWT Token từ header Authorization
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Định dạng: "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Bạn chưa đăng nhập hoặc Token xác thực không tồn tại!'
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
    if (err) {
      return res.status(401).json({
        status: 'fail',
        message: 'Token xác thực đã hết hạn hoặc không hợp lệ!'
      });
    }

    try {
      const user = await userRepository.findAuthUserById(decodedUser.userId);
      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'Tài khoản không tồn tại hoặc đã bị xóa khỏi hệ thống!'
        });
      }

      // 1. Kiểm tra nếu tài khoản bị Admin Khóa (BLOCKED)
      if (user.status === 'BLOCKED' || user.status === 'REJECTED') {
        return res.status(403).json({
          status: 'fail',
          code: 'ACCOUNT_BLOCKED',
          message: 'Tài khoản của bạn đã bị khóa! Vui lòng liên hệ Quản trị viên.'
        });
      }

      // 2. Kiểm tra nếu mật khẩu đã bị Admin đặt lại sau khi token này được cấp phát
      if (decodedUser.pwdVersion && user.password_hash) {
        const currentPwdVersion = user.password_hash.slice(-10);
        if (decodedUser.pwdVersion !== currentPwdVersion) {
          return res.status(401).json({
            status: 'fail',
            code: 'PASSWORD_RESET_FORCE_LOGOUT',
            message: 'Mật khẩu tài khoản đã được đặt lại. Phiên đăng nhập đã hết hiệu lực, vui lòng đăng nhập lại!'
          });
        }
      }

      req.user = decodedUser;
      if (req.user && req.user.userId && !req.user.id) {
        req.user.id = req.user.userId;
      }
      req.currentUser = user;
      next();
    } catch (dbError) {
      next(dbError);
    }
  });
};

/**
 * Middleware kiểm tra quyền truy cập (Role Authorization)
 * @param  {...string} roles - Danh sách vai trò được phép truy cập (VD: 'ADMIN', 'PROVIDER', 'CUSTOMER')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Bạn không có quyền truy cập vào tài nguyên này!'
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
