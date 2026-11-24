/**
 * Tiện ích làm sạch và escape HTML dùng chung cho hệ thống ParkLink
 * Giúp chống HTML Injection / XSS khi dựng nội dung email hoặc template HTML
 */

const ALLOWED_EMAIL_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'code',
  'pre',
  'hr',
  'span',
  'div'
]);

const DANGEROUS_CONTAINER_REGEX =
  /<(script|style|iframe|object|embed|applet|svg|math|template|noscript|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const HTML_COMMENT_REGEX = /<!--[\s\S]*?-->/g;
const HTML_TAG_REGEX = /<(\/?)\s*([a-zA-Z][a-zA-Z0-9:-]*)([^>]*?)(\/?)>/g;

/**
 * Chuyển đổi các ký tự HTML đặc biệt thành HTML entities cho dữ liệu văn bản thuần
 * @param {string} value
 * @returns {string}
 */
const escapeHtml = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Kiểm tra và chuẩn hóa URL trong thuộc tính href của thẻ <a>
 * Chỉ cho phép http://, https://, mailto:, đường dẫn tương đối (/...) hoặc anchor (#...)
 * @param {string} attrs
 * @returns {string|null}
 */
const extractSafeHref = (attrs) => {
  if (!attrs) return null;
  const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
  if (!hrefMatch) return null;

  const rawHref = (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '').trim();
  if (!rawHref) return null;

  // Loại bỏ ký tự điều khiển và khoảng trắng ẩn để tránh kỹ thuật lách như "java\tscript:"
  const normalizedSchemeCheck = rawHref.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  const isSafe =
    normalizedSchemeCheck.startsWith('http://') ||
    normalizedSchemeCheck.startsWith('https://') ||
    normalizedSchemeCheck.startsWith('mailto:') ||
    normalizedSchemeCheck.startsWith('/') ||
    normalizedSchemeCheck.startsWith('#');

  return isSafe ? rawHref : null;
};

/**
 * Lọc nội dung HTML của email theo danh sách thẻ cho phép (allowlist)
 * Loại bỏ hoàn toàn script, event handlers (onload, onerror, onclick...) và các giao thức nguy hiểm
 * @param {string} html
 * @returns {string}
 */
const sanitizeEmailHtml = (html) => {
  if (typeof html !== 'string') return '';

  // 1. Gỡ bỏ HTML comments và các khối thẻ thực thi/nhúng nguy hiểm kèm nội dung bên trong
  let cleaned = html
    .replace(HTML_COMMENT_REGEX, '')
    .replace(DANGEROUS_CONTAINER_REGEX, '');

  // 2. Lọc từng thẻ HTML theo allowlist và loại bỏ toàn bộ attribute không an toàn
  cleaned = cleaned.replace(HTML_TAG_REGEX, (_match, closingSlash, rawTagName, attrs, selfClosingSlash) => {
    const tagName = rawTagName.toLowerCase();
    if (!ALLOWED_EMAIL_TAGS.has(tagName)) {
      return '';
    }

    if (closingSlash) {
      return `</${tagName}>`;
    }

    if (tagName === 'br' || tagName === 'hr') {
      return `<${tagName} />`;
    }

    if (tagName === 'a') {
      const safeHref = extractSafeHref(attrs);
      if (safeHref) {
        return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">`;
      }
      return '<a>';
    }

    return selfClosingSlash ? `<${tagName} />` : `<${tagName}>`;
  });

  // 3. Escape mọi dấu '<' còn sót lại (ví dụ thẻ mở bị cắt cụt như "<script" hoặc "<img onerror=...")
  cleaned = cleaned.replace(
    /<(?!(?:\/?(?:p|br|strong|b|em|i|u|ul|ol|li|a|h[1-4]|blockquote|code|pre|hr|span|div)(?:\s|>|\/)))/gi,
    '&lt;'
  );

  return cleaned.trim();
};

module.exports = {
  escapeHtml,
  sanitizeEmailHtml
};
