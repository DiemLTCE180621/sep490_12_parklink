const vehicleTypeService = require('../services/vehicleTypeService');

/**
 * Controller chỉ làm nhiệm vụ "lễ tân":
 * Nhận request, gọi hàm tương ứng từ Service, và trả response cho client
 * Tuyệt đối không chứa logic nghiệp vụ hoặc truy vấn DB tại đây.
 */
class VehicleTypeController {
  /**
   * M2-UC99: Lấy danh sách loại phương tiện
   * GET /api/vehicle-types
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
   * Lấy danh sách các loại phương tiện đang hoạt động (Public / Authenticated)
   * GET /api/vehicle-types/active
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
   * M2-UC99: Lấy chi tiết thông tin loại phương tiện theo ID
   * GET /api/vehicle-types/:id
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
   * M2-UC98: Tạo mới loại phương tiện (Admin)
   * POST /api/vehicle-types
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
   * M2-UC100: Cập nhật thông tin loại phương tiện (Admin)
   * PUT /api/vehicle-types/:id
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
   * M2-UC101: Vô hiệu hóa loại phương tiện (Admin)
   * PATCH /api/vehicle-types/:id/deactivate
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
   * Bật / Tắt trạng thái hoạt động (Kích hoạt lại / Vô hiệu hóa)
   * PATCH /api/vehicle-types/:id/toggle-status
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

