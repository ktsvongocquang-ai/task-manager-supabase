// Số điện thoại di động Việt Nam: 10 số bắt đầu 0, hoặc +84 theo sau 9 số.
export function isValidVnPhone(phone: string): boolean {
  const trimmed = phone.trim().replace(/[\s.-]/g, '');
  return /^(0\d{9}|\+84\d{9})$/.test(trimmed);
}

export function formatVnd(n: number): string {
  return Math.round(n).toLocaleString('vi-VN') + 'đ';
}

export function roundTo10Million(n: number): number {
  return Math.round(n / 10_000_000) * 10_000_000;
}
