/**
 * 颜色合并算法 (Color Merging Algorithm)
 * 从 perlex/color_merging_algorithm.ts 复刻
 *
 * 这个算法实现了基于频率的全局颜色合并逻辑：
 * 1. 统计初始颜色数量
 * 2. 按出现频率从高到低排序
 * 3. 将相似的低频颜色合并到高频颜色中
 */

import { colorDistance, type RgbColor, type PaletteColor } from './pixelation';

export interface MappedPixel {
  key: string;
  color: string;
  isExternal?: boolean;
}

/**
 * 全局颜色合并函数
 * @param initialMappedData 初始映射的像素数据
 * @param currentPalette 当前使用的调色板
 * @param threshold 相似度阈值（欧氏距离）
 * @param N 网格横向数量
 * @param M 网格纵向数量
 * @returns 合并后的像素数据
 */
export function mergeGlobalColors(
  initialMappedData: MappedPixel[][],
  currentPalette: PaletteColor[],
  threshold: number,
  N: number,
  M: number
): MappedPixel[][] {
  console.log("Starting global color merging...");

  // 创建键到RGB和颜色数据的映射
  const keyToRgbMap = new Map<string, RgbColor>();
  const keyToColorDataMap = new Map<string, PaletteColor>();
  currentPalette.forEach(p => {
    keyToRgbMap.set(p.key, p.rgb);
    keyToColorDataMap.set(p.key, p);
  });

  // 1. 统计初始颜色数量
  const initialColorCounts: { [key: string]: number } = {};
  initialMappedData.flat().forEach(cell => {
    if (cell && cell.key && !cell.isExternal) {
      initialColorCounts[cell.key] = (initialColorCounts[cell.key] || 0) + 1;
    }
  });
  console.log("Initial color counts:", initialColorCounts);

  // 2. 创建一个颜色排序列表，按出现频率从高到低排序
  const colorsByFrequency = Object.entries(initialColorCounts)
    .sort((a, b) => b[1] - a[1])  // 按频率降序排序
    .map(entry => entry[0]);      // 只保留颜色键

  if (colorsByFrequency.length === 0) {
    console.log("No non-background colors found! Skipping merging.");
    return initialMappedData;
  }

  console.log("Colors sorted by frequency:", colorsByFrequency);

  // 3. 复制初始数据，准备合并
  const mergedData: MappedPixel[][] = initialMappedData.map(row =>
    row.map(cell => ({ ...cell, isExternal: cell.isExternal ?? false }))
  );

  // 4. 处理相似颜色合并
  const similarityThresholdValue = threshold;

  // 已被合并（替换）的颜色集合
  const replacedColors = new Set<string>();

  // 对每个颜色按频率从高到低处理
  for (let i = 0; i < colorsByFrequency.length; i++) {
    const currentKey = colorsByFrequency[i];

    // 如果当前颜色已经被合并到更频繁的颜色中，跳过
    if (replacedColors.has(currentKey)) continue;

    const currentRgb = keyToRgbMap.get(currentKey);
    if (!currentRgb) {
      console.warn(`RGB not found for key ${currentKey}. Skipping.`);
      continue;
    }

    // 检查剩余的低频颜色
    for (let j = i + 1; j < colorsByFrequency.length; j++) {
      const lowerFreqKey = colorsByFrequency[j];

      // 如果低频颜色已被替换，跳过
      if (replacedColors.has(lowerFreqKey)) continue;

      const lowerFreqRgb = keyToRgbMap.get(lowerFreqKey);
      if (!lowerFreqRgb) {
        console.warn(`RGB not found for key ${lowerFreqKey}. Skipping.`);
        continue;
      }

      // 计算颜色距离
      const dist = colorDistance(currentRgb, lowerFreqRgb);

      // 如果距离小于阈值，将低频颜色替换为高频颜色
      if (dist < similarityThresholdValue) {
        console.log(`Merging color ${lowerFreqKey} into ${currentKey} (Distance: ${dist})`);

        // 标记这个颜色已被替换
        replacedColors.add(lowerFreqKey);

        // 替换所有使用这个低频颜色的单元格
        for (let r = 0; r < M; r++) {
          for (let c = 0; c < N; c++) {
            if (mergedData[r][c].key === lowerFreqKey) {
              const colorData = keyToColorDataMap.get(currentKey);
              if (colorData) {
                mergedData[r][c] = {
                  key: currentKey,
                  color: colorData.hex,
                  isExternal: false
                };
              }
            }
          }
        }
      }
    }
  }

  if (replacedColors.size > 0) {
    console.log(`Merged ${replacedColors.size} less frequent similar colors into more frequent ones.`);
  } else {
    console.log("No colors were similar enough to merge.");
  }

  return mergedData;
}
