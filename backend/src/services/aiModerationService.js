/**
 * AI Moderation Service - Kiểm duyệt nội dung đánh giá bằng Google Gemini
 */
class AIModerationService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.models = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];
  }

  /**
   * Phân tích nội dung bình luận
   * @param {string} comment - Nội dung đánh giá cần kiểm duyệt
   * @returns {Promise<{ is_flagged: boolean, flagged_reason: string | null }>}
   */
  async moderateComment(comment) {
    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return { is_flagged: false, flagged_reason: null };
    }

    if (!this.apiKey) {
      console.warn('[AI Moderation] GEMINI_API_KEY chưa được cấu hình trong .env.');
      return { is_flagged: false, flagged_reason: null };
    }

    const trimmedComment = comment.trim();

    const prompt = `Bạn là hệ thống kiểm duyệt nội dung đánh giá bãi đỗ xe cho ứng dụng ParkLink.
Nhiệm vụ: Phân tích xem bình luận sau có chứa:
- Ngôn từ thô tục, chửi thề, xúc phạm danh dự nhân phẩm
- Đe dọa, kích động bạo lực, kỳ thị
- Tuyên truyền lừa đảo, spam quảng cáo không liên quan
Nếu bình luận chỉ mang tính chất phê bình dịch vụ bình thường (ví dụ: "giá hơi đắt", "nhân viên chưa nhiệt tình"), KHÔNG cắm cờ.
Chỉ cắm cờ khi thực sự có yếu tố xúc phạm/thô tục/phá hoại.

Trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng sau (không giải thích thêm):
{
  "is_flagged": true hoặc false,
  "flagged_reason": "Giải thích ngắn gọn 1 câu bằng tiếng Việt về lý do vi phạm nếu is_flagged là true, hoặc null nếu false"
}

Nội dung bình luận: "${trimmedComment.replace(/"/g, '\\"')}"`;

    for (const model of this.models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1, // Nhiệt độ thấp để kết quả phân loại chuẩn xác và ổn định
              maxOutputTokens: 200
            }
          }),
          signal: AbortSignal.timeout(4000) // Timeout 4 giây để bảo toàn hiệu năng hệ thống
        });

        if (!response.ok) {
          const errData = await response.text();
          console.warn(`[AI Moderation] Model ${model} trả về lỗi HTTP ${response.status}:`, errData.slice(0, 100));
          continue; // Thử model tiếp theo
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) continue;

        // Trích xuất JSON từ kết quả trả về của AI
        const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            is_flagged: Boolean(parsed.is_flagged),
            flagged_reason: parsed.is_flagged ? (parsed.flagged_reason || 'Chứa ngôn từ không phù hợp') : null
          };
        }
      } catch (err) {
        console.warn(`[AI Moderation] Lỗi khi gọi model ${model}:`, err.message);
      }
    }

    // Nếu tất cả các model đều không phản hồi, trả về an toàn để không chặn người dùng
    return { is_flagged: false, flagged_reason: null };
  }
}

module.exports = new AIModerationService();
