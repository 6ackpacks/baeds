export type ColorSystem = 'MARD' | 'COCO' | '漫漫' | '盼盼' | '咪小窝';

/**
 * 通过Hex值获取指定系统的色号名称
 * 注意：需要 colorSystemMapping.json 文件支持
 */
export function getColorKeyByHex(hexValue: string, colorSystem: ColorSystem, mapping: any): string {
  const normalizedHex = hexValue.toUpperCase();
  const colorMapping = mapping[normalizedHex];
  return (colorMapping && colorMapping[colorSystem]) ? colorMapping[colorSystem] : '?';
}

/**
 * 将 Hex 转换为 HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s, l };
}

/**
 * 按色相(Hue)对颜色进行视觉排序
 */
export function sortColorsByHue<T extends { color: string }>(colors: T[]): T[] {
  return colors.slice().sort((a, b) => {
    const hslA = hexToHsl(a.color);
    const hslB = hexToHsl(b.color);

    // 先按色相排序，再按亮度，最后按饱和度
    if (Math.abs(hslA.h - hslB.h) > 1) return hslA.h - hslB.h;
    if (Math.abs(hslA.l - hslB.l) > 0.01) return hslA.l - hslB.l;
    return hslA.s - hslB.s;
  });
}

/**
 * 按字母+数字排序（如 A1, A2, B1, B2）
 */
export function sortByAlphanumeric<T extends { key: string }>(items: T[]): T[] {
  return items.slice().sort((a, b) => {
    const matchA = a.key.match(/^([A-Z]+)(\d+)$/);
    const matchB = b.key.match(/^([A-Z]+)(\d+)$/);

    if (!matchA || !matchB) return a.key.localeCompare(b.key);

    const [, letterA, numA] = matchA;
    const [, letterB, numB] = matchB;

    if (letterA !== letterB) return letterA.localeCompare(letterB);
    return parseInt(numA) - parseInt(numB);
  });
}
