const fieldInspectorRepository = require("../repositories/fieldInspectorRepository");
const roleRepository = require("../repositories/roleRepository");
const emailService = require("../utils/emailService");
const bcrypt = require("bcryptjs");

class FieldInspectorService {
  async createFieldInspectorAccount({ email, full_name, phone_number, address }) {
    if (!email || !full_name || !phone_number) {
      throw Object.assign(new Error("Vui lòng nhập đầy đủ thông tin (Email, Họ tên, SĐT)."), { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = await fieldInspectorRepository.findInspectorByEmail(trimmedEmail);
    if (existingUser) {
      throw Object.assign(new Error("Địa chỉ email này đã được sử dụng."), { status: 400 });
    }

    let inspectorRole = await roleRepository.findByName("FIELD_INSPECTOR");
    if (!inspectorRole) {
      inspectorRole = await roleRepository.createRole({
        name: "FIELD_INSPECTOR",
        description: "Nhân viên khảo sát thực địa"
      });
    }

    const tempPassword = emailService.generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(tempPassword, salt);

    const newUser = await fieldInspectorRepository.createInspector({
      email: trimmedEmail,
      full_name: full_name.trim(),
      phone_number: phone_number.trim(),
      address: address ? address.trim() : null,
      password_hash: password_hash,
      role_id: inspectorRole.id,
      status: "ACTIVE",
      requires_password_change: true
    });

    await emailService.sendFieldInspectorWelcomeEmail({
      toEmail: trimmedEmail,
      fullName: full_name.trim(),
      tempPassword: tempPassword,
      address: address ? address.trim() : null
    });

    const { password_hash: _, ...safeUser } = newUser;
    return safeUser;
  }

  async getFieldInspectorsList({ search, address, page, limit }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return await fieldInspectorRepository.findInspectorsPaginated({
      search: search ? search.trim() : "",
      address: address ? address.trim() : "",
      page: pageNum,
      limit: limitNum,
    });
  }

  async updateFieldInspectorInfo(inspectorId, { full_name, phone_number, address, status }) {
    const inspector = await fieldInspectorRepository.findInspectorById(inspectorId);
    if (!inspector) {
      throw Object.assign(new Error("Không tìm thấy tài khoản nhân viên khảo sát."), { status: 404 });
    }

    if (inspector.role?.name !== "FIELD_INSPECTOR") {
      throw Object.assign(new Error("Tài khoản này không phải là nhân viên khảo sát."), { status: 400 });
    }

    const updateData = {};
    if (full_name) updateData.full_name = full_name.trim();
    if (phone_number) updateData.phone_number = phone_number.trim();
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (status) updateData.status = status;

    return await fieldInspectorRepository.updateInspector(inspectorId, updateData);
  }

  async getActiveFieldInspectors() {
    return await fieldInspectorRepository.findActiveInspectors();
  }
}

module.exports = new FieldInspectorService();
