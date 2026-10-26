const jwt = require('jsonwebtoken');

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

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        status: 'fail',
        message: 'Token xác thực đã hết hạn hoặc không hợp lệ!'
      });
    }

    req.user = decodedUser;
    if (req.user && req.user.userId && !req.user.id) {
      req.user.id = req.user.userId;
    }
    next();
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
