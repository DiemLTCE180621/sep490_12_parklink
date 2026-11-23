const userRepository = require("../repositories/userRepository");
const emailService = require("../utils/emailService");
const bcrypt = require("bcryptjs");
const { getIO } = require("../config/socket");

class UserService {
  
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

  async getUserDetails(userId) {
    const user = await userRepository.findUserDetailById(userId);
    if (!user) {
      throw Object.assign(new Error("Tài khoản người dùng không tồn tại!"), {
        status: 404,
      });
    }
    return user;
  }

  async updateUserProfile(userId, { full_name, phone_number, address, avatar_url }) {
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

    const updatePayload = {
      full_name: full_name || existingUser.full_name,
      phone_number: phone_number || existingUser.phone_number,
    };

    if (address !== undefined) {
      updatePayload.address = address;
    }

    if (avatar_url !== undefined) {
      updatePayload.avatar_url = avatar_url;
    }

    const updatedUser = await userRepository.updateUser(userId, updatePayload);

    const { password_hash, ...sanitized } = updatedUser;
    return {
      ...sanitized,
      has_password: Boolean(password_hash)
    };
  }

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

  async forceResetPassword(userId) {
    const user = await userRepository.findUserDetailById(userId);
    if (!user) {
      throw Object.assign(new Error("Tài khoản người dùng không tồn tại!"), {
        status: 404,
      });
    }

    if (user.role && user.role.name === 'ADMIN') {
      throw Object.assign(new Error("Không thể đặt lại mật khẩu cho tài khoản Quản trị viên."), {
        status: 400,
      });
    }

    const tempPassword = emailService.generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    await userRepository.updateUserPassword(userId, password_hash, true);

    const emailResult = await emailService.sendAdminForceResetPasswordEmail({
      toEmail: user.email,
      fullName: user.full_name,
      tempPassword
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit('force_logout', {
          userId,
          reason: 'PASSWORD_RESET',
          message: 'Mật khẩu tài khoản đã được đặt lại bởi Quản trị viên. Vui lòng kiểm tra email để đăng nhập lại.'
        });
      }
    } catch (socketErr) {
      console.warn('[Socket Force Logout Error]:', socketErr.message);
    }

    return {
      message: "Đặt lại mật khẩu thành công. Mật khẩu tạm thời đã được gửi tới email của người dùng.",
      simulatedTempPassword: emailResult.simulated ? tempPassword : undefined
    };
  }

  async toggleUserStatus(userId) {
    const user = await userRepository.findUserDetailById(userId);
    if (!user) {
      throw Object.assign(new Error("Tài khoản người dùng không tồn tại!"), {
        status: 404,
      });
    }

    if (user.role && user.role.name === 'ADMIN') {
      throw Object.assign(new Error("Không thể khóa tài khoản Quản trị viên."), {
        status: 400,
      });
    }

    const newStatus = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    let updated;

    const isProviderWithFacility = (user.role?.name === 'PROVIDER' || Boolean(user.facility)) && user.facility?.id;
    const isCustomer = user.role?.name === 'CUSTOMER';
    const isFieldInspector = user.role?.name === 'FIELD_INSPECTOR';

    if (newStatus === "BLOCKED") {
      if (isProviderWithFacility) {
        updated = await userRepository.blockProviderAndHideFacility(userId, user.facility.id);
      } else if (isCustomer) {
        updated = await userRepository.blockCustomerAndCancelPendingReservations(userId);
      } else if (isFieldInspector) {
        updated = await userRepository.blockInspectorAndResetAssignedFacilities(userId);
      } else {
        updated = await userRepository.updateUser(userId, { status: newStatus });
      }
    } else {
      updated = await userRepository.updateUser(userId, { status: newStatus });
    }

    if (newStatus === "BLOCKED") {
      try {
        const io = getIO();
        if (io) {
          io.to(`user_${userId}`).emit('force_logout', {
            userId,
            reason: 'ACCOUNT_BLOCKED',
            message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
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
