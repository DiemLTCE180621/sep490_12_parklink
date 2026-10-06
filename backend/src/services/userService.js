const userRepository = require("../repositories/userRepository");

/**
 * Service xử lý logic nghiệp vụ Quản lý Tài khoản người dùng (User Management)
 * Phục vụ UC11 (Danh sách user), UC12 (Chi tiết user), và Khóa/Mở khóa tài khoản
 */
class UserService {
  /**
   * UC11: Lấy danh sách tài khoản người dùng (Customer, Provider, Admin, Field Inspector)
   * Kèm phân trang & bộ lọc (Search, Role, Status)
   */
  async getUsersList({ search, role, status, page, limit }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return await userRepository.findUsersPaginated({
      search: search ? search.trim() : "",
      role: role || "ALL",
      status: status || "ALL",
      page: pageNum,
      limit: limitNum,
    });
  }

  /**
   * UC12: Lấy thông tin chi tiết tài khoản người dùng theo ID
   */
  async getUserDetails(userId) {
    const user = await userRepository.findUserDetailById(userId);
    if (!user) {
      throw Object.assign(new Error("Tài khoản người dùng không tồn tại!"), {
        status: 404,
      });
    }
    return user;
  }

  /**
   * UC07: Lấy thông tin cá nhân cá nhân (Profile)
   */
  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw Object.assign(new Error("Không tìm thấy thông tin tài khoản người dùng!"), {
        status: 404,
      });
    }
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * UC08: Cập nhật thông tin cá nhân (Họ tên, Số điện thoại)
   */
  async updateUserProfile(userId, { full_name, phone_number }) {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw Object.assign(new Error("Tài khoản người dùng không tồn tại!"), {
        status: 404,
      });
    }

    if (phone_number && phone_number !== existingUser.phone_number) {
      const phoneOwner = await userRepository.findByPhoneExceptId(phone_number, userId);
      if (phoneOwner) {
        throw Object.assign(new Error("Số điện thoại này đã được sử dụng bởi tài khoản khác!"), {
          status: 400,
        });
      }
    }

    const updatedUser = await userRepository.updateUser(userId, {
      full_name: full_name || existingUser.full_name,
      phone_number: phone_number || existingUser.phone_number,
    });

    const { password_hash, ...sanitized } = updatedUser;
    return sanitized;
  }

  /**
   * UC Tương lai (Iter 4): Khóa / Mở khóa tài khoản người dùng (BLOCKED <-> ACTIVE)
   */
  async toggleUserStatus(userId) {
    const user = await userRepository.findUserDetailById(userId);
    if (!user) {
      throw Object.assign(new Error("Tài khoản người dùng không tồn tại!"), {
        status: 404,
      });
    }

    // Không cho phép khóa tài khoản Admin
    if (user.role && user.role.name === 'ADMIN') {
      throw Object.assign(new Error("Không thể khóa tài khoản Quản trị viên (ADMIN)!"), {
        status: 400,
      });
    }

    const newStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    return await userRepository.updateUser(userId, { status: newStatus });
  }
}

module.exports = new UserService();
