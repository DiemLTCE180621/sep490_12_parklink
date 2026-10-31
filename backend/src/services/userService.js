const userRepository = require("../repositories/userRepository");
const emailService = require("../utils/emailService");
const bcrypt = require("bcryptjs");
const { getIO } = require("../config/socket");

/**
 * Service xử lý logic nghiệp vụ Quản lý Tài khoản người dùng (User Management)
 * Phục vụ UC10 (Reset mật khẩu), UC11 (Danh sách user), UC12 (Chi tiết user), UC13 (Cập nhật user), UC14/15 (Khóa/Mở khóa)
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
   * UC07: Lấy thông tin cá nhân (Profile)
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
   * UC08: Cập nhật thông tin cá nhân của người dùng hiện tại (Họ tên, Số điện thoại)
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
   * UC13: Admin cập nhật thông tin người dùng (Họ và tên, Số điện thoại)
   */
  async updateUserInfo(userId, { full_name, phone_number }) {
    const user = await userRepository.findUserDetailById(userId);
    if (!user) {
      throw Object.assign(new Error("Tài khoản người dùng không tồn tại!"), {
        status: 404,
      });
    }

    const updateData = {};
    if (full_name) updateData.full_name = full_name.trim();

    if (phone_number) {
      const trimmedPhone = phone_number.trim();
      if (trimmedPhone !== user.phone_number) {
        const phoneOwner = await userRepository.findByPhoneExceptId(trimmedPhone, userId);
        if (phoneOwner) {
          throw Object.assign(new Error("Số điện thoại này đã được sử dụng bởi tài khoản khác!"), {
            status: 400,
          });
        }
      }
      updateData.phone_number = trimmedPhone;
    }

    return await userRepository.updateUser(userId, updateData);
  }

  /**
   * UC10: Admin cưỡng chế đặt lại mật khẩu của người dùng (Force reset user password)
   * Sinh mật khẩu ngẫu nhiên, hash bcrypt, bật cờ requires_password_change và gửi email cho user
   */
  async forceResetPassword(userId) {
    const user = await userRepository.findUserDetailById(userId);
    if (!user) {
      throw Object.assign(new Error("Tài khoản người dùng không tồn tại!"), {
        status: 404,
      });
    }

    // Không cho phép đặt lại mật khẩu cho tài khoản Admin khác để đảm bảo an toàn cấp cao
    if (user.role && user.role.name === 'ADMIN') {
      throw Object.assign(new Error("Không thể đặt lại mật khẩu cho tài khoản Quản trị viên (ADMIN)!"), {
        status: 400,
      });
    }

    // Sinh mật khẩu ngẫu nhiên tạm thời
    const tempPassword = emailService.generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    // Cập nhật mật khẩu mới và bật cờ bắt buộc đổi mật khẩu
    await userRepository.updateUserPassword(userId, password_hash, true);

    // Gửi email thông báo mật khẩu tạm thời cho người dùng
    const emailResult = await emailService.sendAdminForceResetPasswordEmail({
      toEmail: user.email,
      fullName: user.full_name,
      tempPassword
    });

    // Phát tín hiệu Socket Realtime để đá phiên đăng nhập của người dùng nếu họ đang online
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit('force_logout', {
          userId,
          reason: 'PASSWORD_RESET',
          message: 'Mật khẩu tài khoản của bạn đã được đặt lại bởi Quản trị viên. Vui lòng kiểm tra email để lấy mật khẩu tạm thời mới và đăng nhập lại!'
        });
      }
    } catch (socketErr) {
      console.warn('[Socket Force Logout Error]:', socketErr.message);
    }

    return {
      message: "Đặt lại mật khẩu thành công! Mật khẩu tạm thời đã được gửi tới email của người dùng.",
      simulatedTempPassword: emailResult.simulated ? tempPassword : undefined
    };
  }

  /**
   * UC14 / UC15: Khóa / Mở khóa tài khoản người dùng (BLOCKED <-> ACTIVE)
   * Nghiệp vụ bổ sung: Nếu khóa tài khoản của Provider (chủ bãi đỗ xe), đồng thời ẩn luôn cơ sở đó (visibility_status = 'HIDDEN')
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
    let updated;

    // Nếu khóa tài khoản:
    // - Provider có cơ sở: ẩn cơ sở
    // - Customer: hủy các yêu cầu đặt chỗ PENDING
    const isProviderWithFacility = (user.role?.name === 'PROVIDER' || Boolean(user.facility)) && user.facility?.id;
    const isCustomer = user.role?.name === 'CUSTOMER';

    if (newStatus === "BLOCKED") {
      if (isProviderWithFacility) {
        updated = await userRepository.blockProviderAndHideFacility(userId, user.facility.id);
      } else if (isCustomer) {
        updated = await userRepository.blockCustomerAndCancelPendingReservations(userId);
      } else {
        updated = await userRepository.updateUser(userId, { status: newStatus });
      }
    } else {
      updated = await userRepository.updateUser(userId, { status: newStatus });
    }

    // Nếu tài khoản bị Khóa, lập tức đá phiên đăng nhập qua Socket
    if (newStatus === "BLOCKED") {
      try {
        const io = getIO();
        if (io) {
          io.to(`user_${userId}`).emit('force_logout', {
            userId,
            reason: 'ACCOUNT_BLOCKED',
            message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên. Vui lòng liên hệ bộ phận hỗ trợ!'
          });
        }
      } catch (socketErr) {
        console.warn('[Socket Force Logout Error]:', socketErr.message);
      }
    }

    return updated;
  }
}

module.exports = new UserService();
