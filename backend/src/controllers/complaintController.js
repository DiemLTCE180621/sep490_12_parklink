const complaintService = require('../services/complaintService');

class ComplaintController {

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

  async getAllComplaints(req, res) {
    try {
      const { status } = req.query;
      const complaints = await complaintService.getAllComplaints({ status });

      res.status(200).json({
        status: 'success',
        data: {
          complaints
        }
      });
    } catch (error) {
      console.error('[ComplaintController.getAllComplaints] Error:', error);
      res.status(error.status || 400).json({
        status: 'error',
        message: error.message || 'Lỗi khi lấy danh sách khiếu nại'
      });
    }
  }

  async getComplaintById(req, res) {
    try {
      const { id } = req.params;
      const complaint = await complaintService.getComplaintById(id, req.user);

      res.status(200).json({
        status: 'success',
        data: {
          complaint
        }
      });
    } catch (error) {
      console.error('[ComplaintController.getComplaintById] Error:', error);
      res.status(error.status || 400).json({
        status: 'error',
        message: error.message || 'Lỗi khi lấy chi tiết khiếu nại'
      });
    }
  }

  async replyToComplaint(req, res) {
    try {
      const { id } = req.params;
      const { response, reply, admin_response, status } = req.body;
      const responseText = response || reply || admin_response;

      const updatedComplaint = await complaintService.replyToComplaint(
        id,
        req.user,
        {
          response: responseText,
          status
        }
      );

      res.status(200).json({
        status: 'success',
        message: 'Phản hồi khiếu nại thành công.',
        data: updatedComplaint
      });
    } catch (error) {
      console.error('[ComplaintController.replyToComplaint] Error:', error);
      res.status(error.status || 400).json({
        status: 'error',
        message: error.message || 'Lỗi khi phản hồi khiếu nại'
      });
    }
  }

  async updateComplaintStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note, admin_note, reason } = req.body;

      const updatedComplaint = await complaintService.updateComplaintStatus(
        id,
        req.user,
        {
          status,
          note: note || admin_note || reason
        }
      );

      res.status(200).json({
        success: true,
        status: 'success',
        message: 'Cập nhật trạng thái khiếu nại thành công.',
        data: updatedComplaint
      });
    } catch (error) {
      console.error('[ComplaintController.updateComplaintStatus] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        status: 'error',
        message: error.message || 'Lỗi khi cập nhật trạng thái khiếu nại'
      });
    }
  }

  async updateComplaintStatusByAdmin(req, res) {
    try {
      const { id } = req.params;
      const { status, note, admin_note, reason } = req.body;

      const updatedComplaint = await complaintService.updateComplaintStatusByAdmin(
        id,
        req.user,
        {
          status,
          note: note || admin_note || reason
        }
      );

      res.status(200).json({
        success: true,
        status: 'success',
        message: 'Admin cập nhật trạng thái khiếu nại thành công.',
        data: updatedComplaint
      });
    } catch (error) {
      console.error('[ComplaintController.updateComplaintStatusByAdmin] Error:', error);
      res.status(error.status || 400).json({
        success: false,
        status: 'error',
        message: error.message || 'Lỗi khi Admin cập nhật trạng thái khiếu nại'
      });
    }
  }

  //  dành cho Customer
  async escalateComplaint(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const updatedComplaint = await complaintService.escalateComplaint(
        id,
        req.user,
        reason
      );

      res.status(200).json({
        status: 'success',
        message: 'Đã gửi yêu cầu chuyển cấp khiếu nại lên Ban Quản Trị thành công.',
        data: updatedComplaint
      });
    } catch (error) {
      console.error('[ComplaintController.escalateComplaint] Error:', error);
      res.status(error.status || 400).json({
        status: 'error',
        message: error.message || 'Lỗi khi chuyển cấp khiếu nại'
      });
    }
  }

}

module.exports = new ComplaintController();
