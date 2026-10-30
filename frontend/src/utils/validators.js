/**
 * File Utility Validator dùng chung phía Frontend cho hệ thống ParkLink
 * Sử dụng chuẩn Unicode Property Escapes (\p{L}, \p{N}) của ES2018+
 */

// Hàm làm sạch chuỗi: Xóa khoảng trắng 2 đầu và thu gọn nhiều khoảng trắng ở giữa thành 1 khoảng trắng
export const cleanText = (str) => {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
};

// Regex chuẩn Unicode chuyên nghiệp:
// \p{L}: Đại diện cho mọi chữ cái của tất cả các ngôn ngữ trên thế giới (bao gồm toàn bộ bảng chữ cái Tiếng Việt có dấu)
// \p{N}: Đại diện cho chữ số (0-9)
export const NAME_REGEX = /^[\p{L}\s]+$/u;
export const PHONE_REGEX = /^0\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const FACILITY_NAME_REGEX = /^[\p{L}\p{N}\s/._-]+$/u;

export const isValidName = (name) => {
  const cleaned = cleanText(name);
  return cleaned.length >= 2 && NAME_REGEX.test(cleaned);
};

export const isValidPhone = (phone) => {
  if (!phone) return false;
  return PHONE_REGEX.test(phone.trim());
};

export const isValidEmail = (email) => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
};

export const isValidFacilityName = (facilityName) => {
  const cleaned = cleanText(facilityName);
  return cleaned.length >= 3 && FACILITY_NAME_REGEX.test(cleaned);
};

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const isValidPassword = (password) => {
  if (!password) return false;
  return PASSWORD_REGEX.test(password);
};
