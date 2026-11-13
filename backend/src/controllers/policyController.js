const policyService = require('../services/policyService');

class PolicyController {
  
  async getActivePolicies(req, res, next) {
    try {
      const policies = await policyService.getActivePolicies();
      return res.status(200).json({
        status: 'success',
        data: { policies }
      });
    } catch (error) {
      next(error);
    }
  }

  async getPolicyByTypeOrId(req, res, next) {
    try {
      const policy = await policyService.getPolicyByTypeOrId(req.params.identifier);
      return res.status(200).json({
        status: 'success',
        data: { policy }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: 'fail', message: error.message });
      }
      next(error);
    }
  }

  async getAllPoliciesAdmin(req, res, next) {
    try {
      const policies = await policyService.getAllPoliciesAdmin();
      return res.status(200).json({
        status: 'success',
        data: { policies }
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePolicy(req, res, next) {
    try {
      const policyId = parseInt(req.params.id, 10);
      const updatedPolicy = await policyService.updatePolicy(policyId, req.body, req.user);
      return res.status(200).json({
        status: 'success',
        message: 'Cập nhật chính sách hệ thống thành công!',
        data: { policy: updatedPolicy }
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ status: 'fail', message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new PolicyController();
