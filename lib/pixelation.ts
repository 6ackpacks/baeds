export enum PixelationMode {
  Dominant = 'dominant', // 卡通模式（主色）：保留清晰边界
  Average = 'average',   // 真实模式（平均色）：色彩过渡更自然
}

export interface RgbColor { r: number; g: number; b: number; }
export interface PaletteColor { key: string; hex: string; rgb: RgbColor; }
export interface MappedPixel { key: string; color: string; isExternal?: boolean; }

/**
 * 计算图像指定区域的代表色
 * @param imageData 图像像素数据
 * @param startX 区域起始 X
 * @param startY 区域起始 Y
 * @param width 区域宽度
 * @param height 区域高度
 * @param mode 计算模式：'dominant' (卡通) 或 'average' (真实)
 */
function calculateCellRepresentativeColor(
  imageData: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number,
  mode: PixelationMode
): RgbColor | null {
  const data = imageData.data;
  const imgWidth = imageData.width;
  let pixelCount = 0;

  // --- 真实模式所需变量 ---
  let rSum = 0, gSum = 0, bSum = 0;

  // --- 卡通模式所需变量 ---
  const colorCountsInCell: { [key: string]: number } = {};
  let dominantColorRgb: RgbColor | null = null;
  let maxCount = 0;

  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      const index = (y * imgWidth + x) * 4;

      // 忽略透明像素 (Alpha < 128)
      if (data[index + 3] < 128) continue;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      pixelCount++;

      if (mode === PixelationMode.Average) {
        // 【真实模式算法】：累加所有 RGB 分量
        rSum += r;
        gSum += g;
        bSum += b;
      } else {
        // 【卡通模式算法】：统计颜色出现频率
        const colorKey = `${r},${g},${b}`;
        colorCountsInCell[colorKey] = (colorCountsInCell[colorKey] || 0) + 1;

        // 实时追踪出现次数最多的颜色
        if (colorCountsInCell[colorKey] > maxCount) {
          maxCount = colorCountsInCell[colorKey];
          dominantColorRgb = { r, g, b };
        }
      }
    }
  }

  if (pixelCount === 0) return null;

  if (mode === PixelationMode.Average) {
    // 返回算术平均值
    return {
      r: Math.round(rSum / pixelCount),
      g: Math.round(gSum / pixelCount),
      b: Math.round(bSum / pixelCount),
    };
  } else {
    // 返回频率最高的主色
    return dominantColorRgb;
  }
}

/**
 * 计算两个RGB颜色的距离（欧几里得距离）
 */
export function colorDistance(rgb1: RgbColor, rgb2: RgbColor): number {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

/**
 * 在色板中查找最接近的拼豆颜色（欧几里得距离匹配）
 */
export function findClosestPaletteColor(targetRgb: RgbColor, palette: PaletteColor[]): PaletteColor {
  let minDistance = Infinity;
  let closestColor = palette[0];

  for (const paletteColor of palette) {
    const distance = colorDistance(targetRgb, paletteColor.rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = paletteColor;
    }
    if (distance === 0) break; // 完全匹配，提前退出
  }
  return closestColor;
}

/**
 * 像素化图像 - 将图像分割为网格并计算每个单元格的代表色
 * @param imageData 图像数据
 * @param gridRows 网格行数 (M)
 * @param gridCols 网格列数 (N)
 * @param mode 像素化模式
 */
export function pixelateImage(
  imageData: ImageData,
  gridRows: number,
  gridCols: number,
  mode: PixelationMode
): (RgbColor | null)[][] {
  const imgWidth = imageData.width;
  const imgHeight = imageData.height;
  const result: (RgbColor | null)[][] = [];

  for (let j = 0; j < gridRows; j++) {
    result[j] = [];
    for (let i = 0; i < gridCols; i++) {
      // 计算当前单元格在原图中的位置
      const startX = Math.floor(i * (imgWidth / gridCols));
      const startY = Math.floor(j * (imgHeight / gridRows));
      const currentCellWidth = Math.max(1, Math.ceil((i + 1) * (imgWidth / gridCols)) - startX);
      const currentCellHeight = Math.max(1, Math.ceil((j + 1) * (imgHeight / gridRows)) - startY);

      // 调用算法获取代表色
      result[j][i] = calculateCellRepresentativeColor(
        imageData, startX, startY, currentCellWidth, currentCellHeight, mode
      );
    }
  }

  return result;
}
