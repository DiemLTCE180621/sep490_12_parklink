const userService = require("../services/userService");

/**
 * Controller xử lý HTTP Requests quản lý Tài khoản Người dùng (User Management)
 * Phục vụ UC11 (Danh sách user), UC12 (Chi tiết user), và Khóa/Mở khóa tài khoản user
 */
class UserController {
  /**
   * UC11: Lấy danh sách tài khoản người dùng có phân trang & bộ lọc
   */
  async getUsers(req, res, next) {
    try {
      const data = await userService.getUsersList(req.query);
      res.json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UC12: Lấy chi tiết tài khoản người dùng theo ID
   */
  async getUserById(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID tài khoản không hợp lệ" });
      }
      const user = await userService.getUserDetails(userId);
      res.json({ status: "success", data: { user } });
    } catch (error) {
      if (error.status) {
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }


  /**
   * UC13: Admin cập nhật thông tin tài khoản người dùng (Họ và tên, SĐT)
   */
  async updateUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const updatedUser = await userService.updateUserInfo(userId, req.body);
      res.json({
        status: "success",
        message: "Cập nhật thông tin tài khoản thành công!",
        data: { user: updatedUser }
      });
    } catch (error) {
      if (error.status) {
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }

  /**
   * UC10: Admin cưỡng chế đặt lại mật khẩu cho người dùng
   */
  async forceResetPassword(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const result = await userService.forceResetPassword(userId);
      res.json({
        status: "success",
        message: result.message,
        data: result
      });
    } catch (error) {
      if (error.status) {
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }

  /**
   * UC14 & UC15: Khóa / Mở khóa tài khoản người dùng
   */
  async toggleUserStatus(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res
          .status(400)
          .json({ status: "fail", message: "ID tài khoản không hợp lệ" });
      }
      const updatedUser = await userService.toggleUserStatus(userId);
      const isBlocked = updatedUser.status === "BLOCKED";
      let actionMessage = "Mở khóa tài khoản thành công!";
      if (isBlocked) {
        if (updatedUser.facility) {
          actionMessage = "Đã khóa tài khoản và tạm ẩn cơ sở bãi đỗ xe thành công!";
        } else if (updatedUser.role?.name === "CUSTOMER") {
          actionMessage = "Đã khóa tài khoản và hủy các yêu cầu đặt chỗ đang chờ!";
        } else {
          actionMessage = "Khóa tài khoản thành công!";
        }
      }
      res.json({ status: "success", message: actionMessage, data: { user: updatedUser } });
    } catch (error) {
      if (error.status) {
        return res
          .status(error.status)
          .json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new UserController();
