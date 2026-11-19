const facilityRepository = require('../repositories/facilityRepository');

class WebhookController {

  async handlePaymentWebhook(req, res) {
    try {
      // Xác thực Secret Key từ SePay (Nếu đã cấu hình)
      const sepaySecret = process.env.SEPAY_SECRET_KEY;
      if (sepaySecret) {
        const authHeader = req.headers['authorization'];
        if (!authHeader || authHeader !== `Apikey ${sepaySecret}`) {
          console.warn('[WEBHOOK] Từ chối: Secret Key không khớp.');
          return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
      }

      // SePay gửi dạng flat object, hỗ trợ cả 2 dạng: flat và lồng trong mảng data[]
      let transactionList = [];
      if (req.body && req.body.data && Array.isArray(req.body.data)) {
        // Dạng giả lập (mock)
        transactionList = req.body.data;
      } else if (req.body && !Array.isArray(req.body) && (req.body.content || req.body.description)) {
        // Dạng thực tế từ SePay
        transactionList = [req.body];
      }

      let processedCount = 0;

      for (const transaction of transactionList) {
        // SePay dùng field `content` hoặc `description`
        const content = transaction.content || transaction.description || transaction.code || '';
        const amount = Number(transaction.transferAmount ?? transaction.amount);
        // Chỉ xử lý giao dịch tiền vào (transferType: "in")
        const transferType = transaction.transferType || 'in';

        if (transferType !== 'in' || !Number.isFinite(amount) || amount <= 0) {
          console.log(`[WEBHOOK] Bỏ qua: Loại giao dịch hoặc số tiền không hợp lệ.`);
          continue;
        }

        // Tìm kiếm chuỗi PARKLINK F<id> trong nội dung
        const match = content.match(/PARKLINK\s*F(\d+)/i);
        if (match) {
          const facilityId = parseInt(match[1], 10);
          console.log(`[WEBHOOK] ==> Phát hiện thanh toán cho Bãi đỗ xe ID: ${facilityId}`);

          const facility = await facilityRepository.findPaymentInfo(facilityId);
          if (facility) {
            if (facility.verification_status === 'APPROVED' && facility.payment_status !== 'PAID') {
              // Yêu cầu user chỉ cần trả 1% phí (chia 100)
              const requiredAmount = Number(facility.system_fee) / 100;
              if (Number.isFinite(requiredAmount) && requiredAmount > 0 && amount >= requiredAmount) {
                const confirmed = await facilityRepository.confirmPayment(facilityId, facility.provider_id, amount);
                if (confirmed) {
                  console.log(`[WEBHOOK] ==> THÀNH CÔNG: Đã cập nhật PAID + VISIBLE cho bãi ${facilityId}`);
                  processedCount++;
                }
              } else {
                console.log(`[WEBHOOK] ==> THẤT BẠI: Số tiền chưa đủ (Cần: ${requiredAmount}, Nhận: ${amount})`);
              }
            } else {
              console.log(`[WEBHOOK] ==> Bỏ qua: Bãi ${facilityId} đã thanh toán hoặc chưa được duyệt.`);
            }
          } else {
            console.log(`[WEBHOOK] ==> KHÔNG TÌM THẤY: Bãi đỗ xe ID ${facilityId}`);
          }
        } else {
          console.log('[WEBHOOK] Bỏ qua giao dịch không có mã PARKLINK.');
        }
      }

      // SePay yêu cầu response HTTP 200 để biết đã nhận thành công
      res.json({ success: true, message: `Đã xử lý ${processedCount} giao dịch hợp lệ.` });
    } catch (error) {
      console.error('[WEBHOOK] Lỗi:', error);
      // Giao dịch được cập nhật nguyên tử; webhook có thể gửi lại nếu xử lý lỗi.
      res.status(500).json({ success: false, message: 'Lỗi xử lý nội bộ.' });
    }
  }
}

module.exports = new WebhookController();
