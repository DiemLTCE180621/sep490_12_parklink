const amenityService = require('../services/amenityService');

class AmenityController {
  async getAllAmenities(req, res, next) {
    try {
      const amenities = await amenityService.getAllAmenities(req.query);
      return res.status(200).json({
        status: 'success',
        data: amenities
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

  async getActiveAmenities(req, res, next) {
    try {
      const activeAmenities = await amenityService.getActiveAmenities();
      return res.status(200).json({
        status: 'success',
        data: activeAmenities
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

  async createAmenity(req, res, next) {
    try {
      const newAmenity = await amenityService.createAmenity(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Tạo tiện ích mới thành công!',
        data: newAmenity
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

  async updateAmenity(req, res, next) {
    try {
      const updatedAmenity = await amenityService.updateAmenity(req.params.id, req.body);
      return res.status(200).json({
        status: 'success',
        message: 'Cập nhật tiện ích thành công!',
        data: updatedAmenity
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

  async toggleAmenityStatus(req, res, next) {
    try {
      const result = await amenityService.toggleAmenityStatus(req.params.id);
      return res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.amenity
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

module.exports = new AmenityController();
