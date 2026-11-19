const userService = require("../services/userService");

class UserController {
  async getUsers(req, res, next) {
    try {
      const data = await userService.getUsersList(req.query);
      res.json({ status: "success", data });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
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

  async toggleUserStatus(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const updatedUser = await userService.toggleUserStatus(userId);
      const isBlocked = updatedUser.status === "BLOCKED";
      const actionMessage = isBlocked ? "Khóa tài khoản thành công!" : "Mở khóa tài khoản thành công!";
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
