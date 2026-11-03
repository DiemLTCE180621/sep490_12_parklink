/**
 * Các hằng số quản lý Trạng thái Khiếu nại (Complaint Status Constants)
 * Dùng chung toàn hệ thống frontend ParkLink
 */

export const COMPLAINT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
});

export const STATUS_LABELS = Object.freeze({
  PENDING: 'Chờ Bãi Xe Xử Lý',
  OPEN: 'Chờ Bãi Xe Xử Lý',
  PROCESSING: 'Đang Xử Lý',
  ESCALATED: 'Cần Admin Can Thiệp',
  RESOLVED: 'Đã Giải Quyết',
  CLOSED: 'Đã Đóng'
});

/**
 * Danh sách trạng thái Admin được phép cập nhật
 */
export const ADMIN_ALLOWED_STATUS_OPTIONS = [
  {
    value: 'RESOLVED',
    label: 'Đã giải quyết (RESOLVED)',
    description: 'Khiếu nại đã được giải quyết dứt điểm, đã thống nhất phương án xử lý hoặc hoàn tiền/bồi thường.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: 'emerald'
  },
  {
    value: 'PROCESSING',
    label: 'Đang thẩm tra đối soát (PROCESSING)',
    description: 'Admin đang tiếp nhận hồ sơ, yêu cầu bổ sung bằng chứng và đối soát giữa Khách hàng và Chủ bãi xe.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    color: 'blue'
  },
  {
    value: 'CLOSED',
    label: 'Đóng khiếu nại / Bác bỏ (CLOSED)',
    description: 'Khiếu nại không có căn cứ xác thực, thông tin sai lệch hoặc vi phạm chính sách nền tảng.',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    color: 'slate'
  }
];

