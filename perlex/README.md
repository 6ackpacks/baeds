# 拼豆图像转像素图纸算法文档

本文件夹包含了拼豆底稿生成器项目中所有图像转像素图纸的核心算法。

## 算法概述

整个图像处理流程包含以下四个核心算法步骤：

### 1️⃣ 初始颜色映射 (Initial Color Mapping)
**文件**: `pixelation.ts`

将原始图像转换为像素网格，并将每个单元格映射到最接近的拼豆颜色。

**核心函数**: `calculatePixelGrid()`

**算法流程**:
1. 将图像划分为 N×M 的网格
2. 对每个单元格，根据模式计算代表色：
   - **卡通模式 (Dominant)**: 使用局部 max pooling，找到单元格内出现频率最高的 RGB 值
   - **真实模式 (Average)**: 计算单元格内所有像素的平均 RGB 值
3. 使用欧氏距离在 RGB 空间中查找最接近的拼豆颜色
4. 返回映射后的像素网格数据

**关键技术**:
- `calculateCellRepresentativeColor()`: 计算单元格代表色
- `findClosestPaletteColor()`: 查找最接近的调色板颜色
- `colorDistance()`: 计算 RGB 欧氏距离

```typescript
// 欧氏距离公式
distance = √[(r1-r2)² + (g1-g2)² + (b1-b2)²]
```

### 2️⃣ 区域颜色合并 (Region Color Merging)
**文件**: `color_merging_algorithm.ts`

自动合并相似颜色，减少杂色，使图像更加平滑。

**核心函数**: `mergeGlobalColors()`

**算法流程**:
1. 统计初始网格中每种颜色的出现次数
2. 按出现频率从高到低排序所有颜色
3. 对于每个高频颜色，查找所有低频颜色：
   - 计算颜色之间的欧氏距离
   - 如果距离小于阈值，将低频颜色合并到高频颜色
4. 更新网格中所有被合并颜色的单元格

**优势**:
- 基于频率的合并策略，保留主要颜色
- 自动消除小面积杂色
- 可调节的相似度阈值

### 3️⃣ 背景移除 (Background Removal)
**文件**: `floodFillUtils.ts`

识别并标记图像的外部背景区域，使统计和下载时可以忽略这些区域。

**核心函数**: `getConnectedRegion()`

**算法流程**:
1. 定义背景色号列表（如 T1, H1 等浅色）
2. 从图像所有边界单元格开始执行洪水填充 (Flood Fill)
3. 标记所有从边界连通且颜色属于背景色号的单元格为"外部"
4. 统计和导出时忽略这些外部单元格

**实现细节**:
- 使用非递归栈实现，避免栈溢出
- 支持获取所有同颜色的连通区域
- 提供区域排序功能（按大小、按距离）

### 4️⃣ 颜色排除与重映射 (Color Exclusion & Remapping)
**文件**: `colorSystemUtils.ts`

允许用户排除特定颜色，并将这些颜色重新映射到其他可用颜色。

**核心函数**: `findClosestPaletteColor()`, `convertPaletteToColorSystem()`

**算法流程**:
1. 确定图像处理后最初包含的所有已存在颜色
2. 当用户排除某个颜色时：
   - 创建重映射目标调色板（已存在且未被排除的颜色）
   - 将所有使用被排除颜色的单元格重新映射到最接近的可用颜色
3. 仅在已存在颜色的子集中寻找替换色

## 文件说明

### 核心算法文件

1. **pixelation.ts**
   - 初始颜色映射算法
   - 像素化模式定义（卡通/真实）
   - RGB 颜色距离计算
   - 类型定义：`RgbColor`, `PaletteColor`, `MappedPixel`

2. **color_merging_algorithm.ts**
   - 全局颜色合并算法
   - 基于频率的相似颜色合并逻辑

3. **floodFillUtils.ts**
   - 洪水填充算法
   - 连通区域检测
   - 区域排序和管理

4. **colorSystemUtils.ts**
   - 色号系统转换
   - 颜色映射管理
   - HSL 颜色排序

5. **canvasUtils.ts**
   - 画布坐标转换
   - 触摸事件处理

### 数据文件

6. **colorSystemMapping.json**
   - 包含 291 个标准颜色的 hex 值
   - 支持 5 个店家色号体系：MARD、COCO、漫漫、盼盼、咪小窝
   - 每个 hex 值映射到不同店家的色号

## 算法参数

### 可调参数

1. **横轴格子数 (Granularity)**: 10-300
   - 控制像素化的精细程度
   - 数值越大，细节越多

2. **相似度阈值 (Similarity Threshold)**: 0-100
   - 控制颜色合并的激进程度
   - 数值越大，合并越多

3. **像素化模式 (Pixelation Mode)**:
   - `Dominant`: 卡通模式，使用主导色
   - `Average`: 真实模式，使用平均色

## 使用示例

```typescript
import { calculatePixelGrid, PixelationMode } from './pixelation';
import { mergeGlobalColors } from './color_merging_algorithm';

// 1. 初始颜色映射
const initialData = calculatePixelGrid(
  ctx,
  imgWidth,
  imgHeight,
  N,
  M,
  palette,
  PixelationMode.Dominant,
  fallbackColor
);

// 2. 颜色合并
const mergedData = mergeGlobalColors(
  initialData,
  palette,
  30, // 相似度阈值
  N,
  M
);

// 3. 背景移除（在实际应用中自动执行）
// 4. 颜色排除（用户交互触发）
```

## 算法优化思路

### 已实现的优化

1. **黑色毛边问题**: 使用局部 max pooling 代替 mean 操作
2. **杂色问题**: 实现基于频率的全局颜色合并
3. **背景统计**: 实现洪水填充算法识别外部背景
4. **颜色管理**: 支持颜色排除和智能重映射

### 未来可能的改进

1. **边缘保护**: 在颜色合并时保护重要边缘
2. **区域优先级**: 根据区域大小和位置调整合并策略
3. **智能阈值**: 根据图像特征自动调整相似度阈值
4. **多尺度处理**: 在不同尺度上进行颜色分析和合并

## 技术栈

- TypeScript
- Canvas API
- 图像处理算法
- 色彩空间转换（RGB, HSL）

## 许可证

Apache 2.0

## 贡献

如果有改进建议或发现问题，欢迎提交 PR 或 Issue。
