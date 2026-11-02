// Tiện ích chữ & ngày (giờ Việt Nam).

/** Bỏ dấu tiếng Việt, chữ thường, gọn khoảng trắng. */
export function fold(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

const HONORIFICS = new Set(['anh', 'chi', 'em', 'a', 'c', 'e', 'ban', 'kts', 'ks', 'co', 'chu', 'bac', 'sep', 'mr', 'ms']);

/** "anh Thắng" -> "thang"; giữ phần tên thật để so khớp. */
export function nameQuery(s) {
  const words = fold(s).split(' ').filter(Boolean);
  while (words.length > 1 && HONORIFICS.has(words[0])) words.shift();
  return words.join(' ');
}

/** Ngày hôm nay theo giờ VN, dạng YYYY-MM-DD. */
export function todayVN(now = new Date()) {
  return new Date(now.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

export function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Thứ Hai của tuần chứa ngày này. */
export function mondayOf(isoDate) {
  const d = new Date(isoDate + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7; // 0 = Thứ Hai
  return addDays(isoDate, -dow);
}

export function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
}

/** Ngày dd/mm cho câu báo cáo. */
export function vnDate(iso) {
  if (!iso) return 'chưa có hạn';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
