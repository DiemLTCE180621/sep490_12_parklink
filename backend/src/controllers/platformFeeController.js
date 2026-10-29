const platformFeeService = require('../services/platformFeeService');

class PlatformFeeController {
  /**
   * GET /api/platform-fees
   */
  async getAllFees(req, res, next) {
    try {
      const userRole = req.user.role;
      const fees = await platformFeeService.getAllFees(userRole);
      return res.status(200).json({
        status: 'success',
        data: fees
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          status: 'fail',
          message: error.message
        });
      }
      next(error);
    }
  }

  async getActiveFees(req, res, next) {
    try {
      const fees = await platformFeeService.getAllFees('PROVIDER');
      return res.status(200).json({
        status: 'success',
        data: fees
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          status: 'fail',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * UC: View Platform Fee Detail (Administrator, Parking Provider)
   */
  async getFeeById(req, res, next) {
    try {
      const feeId = parseInt(req.params.id, 10);
      if (isNaN(feeId)) {
        return res.status(400).json({
          status: 'fail',
          message: 'ID gói biểu phí không hợp lệ'
        });
      }

      const userRole = req.user.role;
      const fee = await platformFeeService.getFeeById(feeId, userRole);
      return res.status(200).json({
        status: 'success',
        data: fee
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          status: 'fail',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Create Platform Fee (Administrator)
   */
  async createFee(req, res, next) {
    try {
      const newFee = await platformFeeService.createFee(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Tạo gói phí nền tảng mới thành công!',
        data: newFee
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          status: 'fail',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * UC: Update Platform Fee (Administrator)
   */
  async updateFee(req, res, next) {
    try {
      const feeId = parseInt(req.params.id, 10);
      if (isNaN(feeId)) {
        return res.status(400).json({
          status: 'fail',
          message: 'ID gói biểu phí không hợp lệ'
        });
      }

      const updatedFee = await platformFeeService.updateFee(feeId, req.body);
      return res.status(200).json({
        status: 'success',
        message: 'Cập nhật gói phí nền tảng thành công!',
        data: updatedFee
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          status: 'fail',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * UC: Activate/Deactivate Platform Fee (Administrator)
   */
  async toggleFeeStatus(req, res, next) {
    try {
      const feeId = parseInt(req.params.id, 10);
      if (isNaN(feeId)) {
        return res.status(400).json({
          status: 'fail',
          message: 'ID gói biểu phí không hợp lệ'
        });
      }

      const result = await platformFeeService.toggleFeeStatus(feeId);
      return res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.fee
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          status: 'fail',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * UC-10: Tính phí nền tảng theo số slot (Administrator, Parking Provider)
   * GET /api/platform-fees/calculate?slots=5
   */
  async calculateFee(req, res, next) {
    try {
      const { slots } = req.query;
      const result = await platformFeeService.calculateFeeBySlots(slots);
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          status: 'fail',
          message: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = new PlatformFeeController();
