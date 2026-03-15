/**
 * Chuyển đổi số thành chữ tiếng Việt
 */
export function numberToVietnameseWords(number: number): string {
  if (number === 0) return 'Không đồng';

  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  const readThreeDigits = (n: number, isFirstGroup: boolean): string => {
    let res = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0 || !isFirstGroup) {
      res += digits[h] + ' trăm ';
    }

    if (t > 1) {
      res += digits[t] + ' mươi ';
      if (u === 1) res += 'mốt';
      else if (u === 5) res += 'lăm';
      else if (u > 0) res += digits[u];
    } else if (t === 1) {
      res += 'mười ';
      if (u === 5) res += 'lăm';
      else if (u > 0) res += digits[u];
    } else if (t === 0 && u > 0) {
      if (h > 0 || !isFirstGroup) res += 'lẻ ';
      res += digits[u];
    }

    return res.trim();
  };

  let res = '';
  let groupIdx = 0;
  let tempNumber = Math.abs(Math.floor(number));

  if (tempNumber === 0) return 'Không đồng';

  while (tempNumber > 0) {
    const groupValue = tempNumber % 1000;
    if (groupValue > 0) {
      const groupText = readThreeDigits(groupValue, tempNumber < 1000);
      res = groupText + ' ' + units[groupIdx] + ' ' + res;
    }
    tempNumber = Math.floor(tempNumber / 1000);
    groupIdx++;
  }

  res = res.trim();
  res = res.charAt(0).toUpperCase() + res.slice(1);
  
  return res + ' Việt Nam Đồng';
}
