const complaintService = require('../services/complaintService');

class ComplaintController {
  
  // POST /api/complaints
  async createComplaint(req, res) {
    try {
      const customer_id = req.user.userId; 
      
      const { reservation_id, title, description, image_urls } = req.body;

      const newComplaint = await complaintService.createComplaint({
        customer_id,
        reservation_id,
        title,
        description,
        image_urls
      });

      res.status(201).json({
        status: 'success',
        message: 'Gửi khiếu nại thành công. Quản trị viên sẽ sớm xem xét.',
        data: newComplaint
      });
    } catch (error) {
      console.error('[ComplaintController.createComplaint] Error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Lỗi khi gửi khiếu nại'
      });
    }
  }

  // GET /api/complaints/my-complaints
  async getMyComplaints(req, res) {
    try {
      const customer_id = req.user.userId;
      const complaints = await complaintService.getMyComplaints(customer_id);

      res.status(200).json({
        status: 'success',
        data: {
          complaints
        }
      });
    } catch (error) {
      console.error('[ComplaintController.getMyComplaints] Error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Lỗi khi lấy danh sách khiếu nại'
      });
    }
  }

  // GET /api/complaints/provider
  async getProviderComplaints(req, res) {
    try {
      const provider_id = req.user.userId;
      const complaints = await complaintService.getProviderComplaints(provider_id);

      res.status(200).json({
        status: 'success',
        data: {
          complaints
        }
      });
    } catch (error) {
      console.error('[ComplaintController.getProviderComplaints] Error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Lỗi khi lấy danh sách khiếu nại'
      });
    }
  }

  // GET /api/complaints/admin
  async getAllComplaints(req, res) {
    try {
      const complaints = await complaintService.getAllComplaints();

      res.status(200).json({
        status: 'success',
        data: {
          complaints
        }
      });
    } catch (error) {
      console.error('[ComplaintController.getAllComplaints] Error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Lỗi khi lấy danh sách khiếu nại'
      });
    }
  }

}

module.exports = new ComplaintController();
