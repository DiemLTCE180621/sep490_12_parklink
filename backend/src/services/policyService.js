const policyRepository = require('../repositories/policyRepository');
const notificationService = require('./notificationService');

class PolicyService {
  
  async getActivePolicies() {
    const policies = await policyRepository.findActivePolicies();
    return policies;
  }

  async getPolicyByTypeOrId(identifier) {
    let policy = null;
    const numericId = parseInt(identifier, 10);

    if (!isNaN(numericId)) {
      policy = await policyRepository.findById(numericId);
    } else {
      policy = await policyRepository.findByType(identifier.toUpperCase());
    }

    if (!policy) {
      const error = new Error('Không tìm thấy chính sách được yêu cầu!');
      error.status = 404;
      throw error;
    }

    return policy;
  }

  async getAllPoliciesAdmin() {
    const policies = await policyRepository.findAllPolicies();
    return policies;
  }

  async updatePolicy(id, payload, adminUser) {
    const { title, content, is_active, notifyUsers } = payload;

    const existingPolicy = await policyRepository.findById(id);
    if (!existingPolicy) {
      const error = new Error('Chính sách không tồn tại trong hệ thống!');
      error.status = 404;
      throw error;
    }

    const updateData = {
      updated_by: adminUser?.userId || adminUser?.id
    };

    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const updatedPolicy = await policyRepository.updatePolicy(id, updateData);

    if (notifyUsers) {
      try {
        const updateDate = new Date(updatedPolicy.updated_at).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        let targetRole = 'ALL';
        let targetAudience = 'Quý khách hàng';

        if (updatedPolicy.policy_type === 'CUSTOMER') {
          targetRole = 'CUSTOMER';
          targetAudience = 'Quý khách hàng';
        } else if (updatedPolicy.policy_type === 'PROVIDER') {
          targetRole = 'PROVIDER';
          targetAudience = 'Quý đối tác chủ bãi xe';
        }

        await notificationService.broadcastPushNotification(
          {
            title: `Cập nhật chính sách: ${updatedPolicy.title}`,
            content: `Hệ thống ParkLink vừa cập nhật nội dung điều khoản và quy định dịch vụ vào ngày ${updateDate}.\n\n${targetAudience} vui lòng kiểm tra chi tiết để nắm rõ các quyền lợi và quy định mới áp dụng trên hệ thống.`,
            targetRole,
            category: 'Chính sách hệ thống',
            priority: 'Bình thường',
            saveToDb: true,
            showToast: true
          },
          adminUser
        );
      } catch (notifyError) {
        console.warn('Lỗi gửi thông báo tự động khi cập nhật chính sách:', notifyError.message);
      }
    }

    return updatedPolicy;
  }
}

module.exports = new PolicyService();
