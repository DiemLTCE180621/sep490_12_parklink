/**
 * Các hằng số quản lý Trạng thái Khiếu nại (Complaint Status Constants)
 * Dùng chung toàn hệ thống frontend ParkLink
 */

export const COMPLAINT_STATUS = Object.freeze({
  PENDING_ADMIN: 'PENDING_ADMIN',
  WAITING_PROVIDER: 'WAITING_PROVIDER',
  PROVIDER_REPLIED: 'PROVIDER_REPLIED',
  PROCESSING: 'PROCESSING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED'
});

export const STATUS_LABELS = Object.freeze({
  PENDING_ADMIN: 'Chờ BQT tiếp nhận',
  WAITING_PROVIDER: 'Chờ bãi xe giải trình',
  PROVIDER_REPLIED: 'Bãi xe đã giải trình',
  PROCESSING: 'Đang thẩm tra đối soát',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Bác bỏ khiếu nại',
  CLOSED: 'Đã đóng'
});

/**
 * Danh sách trạng thái Admin được phép cập nhật
 */
export const ADMIN_ALLOWED_STATUS_OPTIONS = [
  {
    value: 'RESOLVED',
    label: 'Đã giải quyết',
    description: 'Khiếu nại đã được giải quyết dứt điểm, đã thống nhất phương án xử lý hoặc hoàn tiền/bồi thường.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: 'emerald'
  },
  {
    value: 'REJECTED',
    label: 'Bác bỏ khiếu nại',
    description: 'Khiếu nại không hợp lệ, thông tin sai sự thật hoặc không thuộc phạm vi trách nhiệm.',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    color: 'rose'
  },
  {
    value: 'PROCESSING',
    label: 'Đang thẩm tra đối soát',
    description: 'Admin đang tiếp nhận hồ sơ, yêu cầu bổ sung bằng chứng và đối soát giữa các bên.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    color: 'blue'
  },
  {
    value: 'CLOSED',
    label: 'Đóng khiếu nại',
    description: 'Đóng hồ sơ khiếu nại khi các bên đã kết thúc quá trình làm việc.',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    color: 'slate'
  }
];
