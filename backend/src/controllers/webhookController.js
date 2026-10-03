const facilityRepository = require('../repositories/facilityRepository');

class WebhookController {
  /**
   * API Webhook nhận tín hiệu thanh toán từ SePay
   * SePay sẽ gọi POST vào endpoint này mỗi khi có giao dịch vào tài khoản ngân hàng.
   * Method: POST
   * Doc: https://docs.sepay.vn/webhook.html
   *
   * Format body SePay gửi về:
   * {
   *   "id": 1,
   *   "gateway": "MBBank",
   *   "transactionDate": "2024-01-01 12:00:00",
   *   "accountNumber": "XXXXXX",
   *   "code": "PARKLINK F1",         // Nội dung chuyển khoản
   *   "content": "PARKLINK F1",
   *   "transferType": "in",           // "in" = tiền vào
   *   "transferAmount": 4000000,
   *   "accumulated": 4000000,
   *   "referenceCode": "...",
   *   "description": "PARKLINK F1"
   * }
   */
  async handlePaymentWebhook(req, res, next) {
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

      console.log('--- NHẬN WEBHOOK TỪ SEPAY ---');
      console.log('Headers:', req.headers);
      console.log('Payload:', JSON.stringify(req.body, null, 2));

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
        const amount = parseFloat(transaction.transferAmount || transaction.amount || 0);
        // Chỉ xử lý giao dịch tiền vào (transferType: "in")
        const transferType = transaction.transferType || 'in';

        console.log(`[WEBHOOK] Giao dịch: Nội dung="${content}", Số tiền=${amount}, Loại=${transferType}`);

        if (transferType !== 'in') {
          console.log(`[WEBHOOK] Bỏ qua: Không phải giao dịch tiền vào.`);
          continue;
        }

        // Tìm kiếm chuỗi PARKLINK F<id> trong nội dung
        const match = content.match(/PARKLINK\s*F(\d+)/i);
        if (match) {
          const facilityId = parseInt(match[1], 10);
          console.log(`[WEBHOOK] ==> Phát hiện thanh toán cho Bãi đỗ xe ID: ${facilityId}`);

          const facility = await facilityRepository.findById(facilityId);
          if (facility) {
            if (facility.verification_status === 'APPROVED' && facility.payment_status !== 'PAID') {
              // Yêu cầu user chỉ cần trả 1% phí (chia 100)
              const requiredAmount = facility.system_fee / 100;
              if (amount >= requiredAmount) {
                await facilityRepository.confirmPayment(facilityId, facility.provider_id);
                console.log(`[WEBHOOK] ==> THÀNH CÔNG: Đã cập nhật PAID + VISIBLE cho bãi ${facilityId}`);
                processedCount++;
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
          console.log(`[WEBHOOK] Không có mã PARKLINK trong nội dung: "${content}"`);
        }
      }

      // SePay yêu cầu response HTTP 200 để biết đã nhận thành công
      res.json({ success: true, message: `Đã xử lý ${processedCount} giao dịch hợp lệ.` });
    } catch (error) {
      console.error('[WEBHOOK] Lỗi:', error);
      // Vẫn trả 200 để SePay không retry liên tục
      res.status(200).json({ success: false, message: 'Lỗi xử lý nội bộ, đã ghi log.' });
    }
  }
}

module.exports = new WebhookController();
