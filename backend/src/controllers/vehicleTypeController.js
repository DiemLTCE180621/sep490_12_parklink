const vehicleTypeService = require('../services/vehicleTypeService');

/**
 * Xử lý yêu cầu API loại phương tiện
 */
class VehicleTypeController {
  /**
   * Lấy danh sách loại phương tiện
   */
  async getAllVehicleTypes(req, res, next) {
    try {
      const vehicleTypes = await vehicleTypeService.getAllVehicleTypes(req.query);
      return res.status(200).json({
        status: 'success',
        data: vehicleTypes
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
   * Lấy loại phương tiện đang hoạt động
   */
  async getActiveVehicleTypes(req, res, next) {
    try {
      const activeTypes = await vehicleTypeService.getActiveVehicleTypes();
      return res.status(200).json({
        status: 'success',
        data: activeTypes
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
   * Lấy chi tiết loại phương tiện
   */
  async getVehicleTypeById(req, res, next) {
    try {
      const vehicleType = await vehicleTypeService.getVehicleTypeById(req.params.id);
      return res.status(200).json({
        status: 'success',
        data: vehicleType
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
   * Tạo loại phương tiện
   */
  async createVehicleType(req, res, next) {
    try {
      const newVehicleType = await vehicleTypeService.createVehicleType(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Tạo loại phương tiện mới thành công!',
        data: newVehicleType
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
   * Cập nhật loại phương tiện
   */
  async updateVehicleType(req, res, next) {
    try {
      const updatedVehicleType = await vehicleTypeService.updateVehicleType(req.params.id, req.body);
      return res.status(200).json({
        status: 'success',
        message: 'Cập nhật loại phương tiện thành công!',
        data: updatedVehicleType
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
   * Vô hiệu hóa loại phương tiện
   */
  async deactivateVehicleType(req, res, next) {
    try {
      const result = await vehicleTypeService.deactivateVehicleType(req.params.id);
      return res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.vehicleType
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
   * Bật hoặc tắt loại phương tiện
   */
  async toggleVehicleTypeStatus(req, res, next) {
    try {
      const result = await vehicleTypeService.toggleVehicleTypeStatus(req.params.id);
      return res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.vehicleType
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

module.exports = new VehicleTypeController();

