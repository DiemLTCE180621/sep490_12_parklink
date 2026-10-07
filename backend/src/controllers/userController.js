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
   * UC07: Lấy thông tin cá nhân của người dùng hiện tại
   */
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserProfile(req.user.userId);
      res.json({ status: "success", data: { user } });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }

  /**
   * UC08: Cập nhật thông tin cá nhân của người dùng hiện tại (Họ tên, SĐT)
   */
  async updateProfile(req, res, next) {
    try {
      const updatedUser = await userService.updateUserProfile(req.user.userId, req.body);
      res.json({
        status: "success",
        message: "Cập nhật thông tin cá nhân thành công!",
        data: { user: updatedUser }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: "fail", message: error.message });
      }
      next(error);
    }
  }

  /**
   * UC Tương lai (Iter 4): Khóa / Mở khóa tài khoản người dùng
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
      const actionMessage = updatedUser.status === "BLOCKED" ? "Khóa tài khoản thành công!" : "Mở khóa tài khoản thành công!";
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
