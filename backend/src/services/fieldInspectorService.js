const fieldInspectorRepository = require("../repositories/fieldInspectorRepository");
const roleRepository = require("../repositories/roleRepository");
const emailService = require("../utils/emailService");
const bcrypt = require("bcryptjs");

/**
 * Service xử lý logic nghiệp vụ dành riêng cho Quản lý Nhân viên khảo sát thực địa (Field Inspector)
 */
class FieldInspectorService {
  /**
   * UC-86: Tạo tài khoản Nhân viên khảo sát thực địa (Field Inspector) & tự động gửi mail mật khẩu
   * @param {object} params - { email, full_name, phone_number }
   */
  async createFieldInspectorAccount({ email, full_name, phone_number }) {
    if (!email || !full_name || !phone_number) {
      throw Object.assign(new Error("Vui lòng nhập đầy đủ thông tin (Email, Họ tên, SĐT)!"), { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = await fieldInspectorRepository.findInspectorByEmail(trimmedEmail);
    if (existingUser) {
      throw Object.assign(new Error("Địa chỉ email này đã được sử dụng trong hệ thống!"), { status: 400 });
    }

    let inspectorRole = await roleRepository.findByName("FIELD_INSPECTOR");
    if (!inspectorRole) {
      inspectorRole = await roleRepository.createRole({
        name: "FIELD_INSPECTOR",
        description: "Nhân viên khảo sát thực địa"
      });
    }

    // Sinh mật khẩu ngẫu nhiên & băm password
    const tempPassword = emailService.generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    // Lưu vào CSDL qua FieldInspectorRepository
    const newUser = await fieldInspectorRepository.createInspector({
      email: trimmedEmail,
      full_name: full_name.trim(),
      phone_number: phone_number.trim(),
      password_hash: password_hash,
      role_id: inspectorRole.id,
      status: "ACTIVE",
      requires_password_change: true
    });

    // Gửi email thông báo mật khẩu cho Nhân viên khảo sát
    await emailService.sendFieldInspectorWelcomeEmail({
      toEmail: trimmedEmail,
      fullName: full_name.trim(),
      tempPassword: tempPassword
    });

    // Loại bỏ thông tin password_hash trước khi trả về
    const { password_hash: _, ...safeUser } = newUser;
    return safeUser;
  }

  /**
   * UC-87: Lấy danh sách tài khoản Nhân viên khảo sát thực địa (kèm phân trang & tìm kiếm)
   */
  async getFieldInspectorsList({ search, page, limit }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return await fieldInspectorRepository.findInspectorsPaginated({
      search: search ? search.trim() : "",
      page: pageNum,
      limit: limitNum,
    });
  }

  /**
   * UC-88: Cập nhật thông tin tài khoản Nhân viên khảo sát thực địa
   */
  async updateFieldInspectorInfo(inspectorId, { full_name, phone_number, status }) {
    const inspector = await fieldInspectorRepository.findInspectorById(inspectorId);
    if (!inspector) {
      throw Object.assign(new Error("Tài khoản Nhân viên khảo sát không tồn tại!"), { status: 404 });
    }

    if (inspector.role?.name !== "FIELD_INSPECTOR") {
      throw Object.assign(new Error("Tài khoản này không phải là Nhân viên khảo sát thực địa!"), { status: 400 });
    }

    const updateData = {};
    if (full_name) updateData.full_name = full_name.trim();
    if (phone_number) updateData.phone_number = phone_number.trim();
    if (status) updateData.status = status;

    return await fieldInspectorRepository.updateInspector(inspectorId, updateData);
  }
}

module.exports = new FieldInspectorService();
