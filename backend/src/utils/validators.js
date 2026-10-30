/**
 * File Utility Validator dùng chung phía Backend cho hệ thống ParkLink
 * Sử dụng chuẩn Unicode Property Escapes (\p{L}, \p{N}) của ES2018+
 */

const cleanText = (str) => {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
};

const NAME_REGEX = /^[\p{L}\s]+$/u;
const PHONE_REGEX = /^0\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FACILITY_NAME_REGEX = /^[\p{L}\p{N}\s/._-]+$/u;

const isValidName = (name) => {
  const cleaned = cleanText(name);
  return cleaned.length >= 2 && NAME_REGEX.test(cleaned);
};

const isValidPhone = (phone) => {
  if (!phone) return false;
  return PHONE_REGEX.test(phone.trim());
};

const isValidEmail = (email) => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
};

const isValidFacilityName = (facilityName) => {
  const cleaned = cleanText(facilityName);
  return cleaned.length >= 3 && FACILITY_NAME_REGEX.test(cleaned);
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const isValidPassword = (password) => {
  if (!password) return false;
  return PASSWORD_REGEX.test(password);
};

module.exports = {
  cleanText,
  NAME_REGEX,
  PHONE_REGEX,
  EMAIL_REGEX,
  FACILITY_NAME_REGEX,
  isValidName,
  isValidPhone,
  isValidEmail,
  isValidFacilityName,
  isValidPassword
};
