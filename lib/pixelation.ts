export enum PixelationMode {
  Dominant = 'dominant', // 卡通模式（主色）：保留清晰边界
  Average = 'average',   // 真实模式（平均色）：色彩过渡更自然
}

export interface RgbColor { r: number; g: number; b: number; }
export interface PaletteColor { key: string; hex: string; rgb: RgbColor; }
export interface MappedPixel { key: string; color: string; isExternal?: boolean; }

/**
 * 计算图像指定区域的代表色（根据所选模式）
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
    let rSum = 0, gSum = 0, bSum = 0;
    let pixelCount = 0;
    const colorCountsInCell: { [key: string]: number } = {};
    let dominantColorRgb: RgbColor | null = null;
    let maxCount = 0;

    const endX = startX + width;
    const endY = startY + height;

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const index = (y * imgWidth + x) * 4;
            // 检查 alpha 通道，忽略完全透明的像素
            if (data[index + 3] < 128) continue;

            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            pixelCount++;

            if (mode === PixelationMode.Average) {
                rSum += r;
                gSum += g;
                bSum += b;
            } else { // Dominant mode
                const colorKey = `${r},${g},${b}`;
                colorCountsInCell[colorKey] = (colorCountsInCell[colorKey] || 0) + 1;
                if (colorCountsInCell[colorKey] > maxCount) {
                    maxCount = colorCountsInCell[colorKey];
                    dominantColorRgb = { r, g, b };
                }
            }
        }
    }

    if (pixelCount === 0) {
        return null; // 区域内没有不透明像素
    }

    if (mode === PixelationMode.Average) {
        return {
            r: Math.round(rSum / pixelCount),
            g: Math.round(gSum / pixelCount),
            b: Math.round(bSum / pixelCount),
        };
    } else { // Dominant mode
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
