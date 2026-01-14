import colorsData from "@/docs/color.json"
import { pixelateImage, findClosestPaletteColor, PixelationMode, type RgbColor, type PaletteColor } from "./pixelation"
import { mergeGlobalColors, type MappedPixel } from "./color-merging"

// Ensure colors is an array
const colors = Array.isArray(colorsData) ? colorsData : (colorsData as any).default || []

export interface ColorData {
  id: string
  name: string
  hex: string
  rgb: [number, number, number]
  category: string
}

export interface PixelArtResult {
  gridSize: number
  pixels: (string | null)[][] // 2D grid of color IDs, null for transparent
  colorPalette: Map<string, ColorData> // 使用的颜色
  colorUsage: Record<string, number> // 每种颜色的使用次数
  totalBeads: number
  transparentPixels: number // 透明像素数量
  mode?: "dominant" | "average" // 像素化模式
}

// 计算两个RGB颜色之间的欧几里得距离
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [r1, g1, b1] = rgb1
  const [r2, g2, b2] = rgb2
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

// 找到最接近的色块
function findClosestColor(targetRgb: [number, number, number], availableColors: ColorData[]): ColorData {
  let closestColor = availableColors[0]
  let minDistance = colorDistance(targetRgb, availableColors[0].rgb)

  for (let i = 1; i < availableColors.length; i++) {
    const distance = colorDistance(targetRgb, availableColors[i].rgb)
    if (distance < minDistance) {
      minDistance = distance
      closestColor = availableColors[i]
    }
  }

  return closestColor
}

// 改进的K-Means颜色聚类 - 从图像中提取主要颜色，带早期停止
function kmeansClusterColors(imageData: Uint8ClampedArray, targetColorCount: number, ignoreTransparent: boolean = true, simplifyMode: boolean = false): [number, number, number][] {
  const pixels = imageData.length / 4
  const pixelColors: [number, number, number][] = []

  // 提取RGB值，过滤透明像素（可选）
  for (let i = 0; i < pixels; i++) {
    const offset = i * 4
    const alpha = imageData[offset + 3]

    // 如果忽略透明像素且alpha < 128，跳过
    if (ignoreTransparent && alpha < 128) {
      continue
    }

    pixelColors.push([imageData[offset], imageData[offset + 1], imageData[offset + 2]])
  }

  // 如果没有足够的不透明像素，调整目标颜色数
  const actualColorCount = Math.min(targetColorCount, Math.max(1, pixelColors.length))

  // 随机选择初始中心点
  const centroids: [number, number, number][] = []
  const used = new Set<number>()

  while (centroids.length < actualColorCount) {
    const idx = Math.floor(Math.random() * pixelColors.length)
    if (!used.has(idx)) {
      centroids.push([...pixelColors[idx]])
      used.add(idx)
    }
  }

  // K-Means迭代，带早期停止条件
  const maxIterations = simplifyMode ? 15 : 10
  const convergenceThreshold = simplifyMode ? 5.0 : 1.0

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const clusters: number[][] = centroids.map(() => [])
    const oldCentroids = centroids.map(c => [...c] as [number, number, number])

    // 分配像素到最近的中心点
    for (let i = 0; i < pixelColors.length; i++) {
      let closestIdx = 0
      let minDist = colorDistance(pixelColors[i], centroids[0])

      for (let j = 1; j < centroids.length; j++) {
        const dist = colorDistance(pixelColors[i], centroids[j])
        if (dist < minDist) {
          minDist = dist
          closestIdx = j
        }
      }

      clusters[closestIdx].push(i)
    }

    // 更新中心点 - 计算每个群集的平均颜色
    for (let i = 0; i < centroids.length; i++) {
      if (clusters[i].length > 0) {
        let r = 0, g = 0, b = 0
        for (const pixelIdx of clusters[i]) {
          const [cr, cg, cb] = pixelColors[pixelIdx]
          r += cr
          g += cg
          b += cb
        }
        const len = clusters[i].length
        centroids[i] = [Math.round(r / len), Math.round(g / len), Math.round(b / len)]
      }
    }

    // 检查收敛性 - 如果中心点变化很小，停止迭代
    let maxChange = 0
    for (let i = 0; i < centroids.length; i++) {
      const change = colorDistance(centroids[i], oldCentroids[i])
      maxChange = Math.max(maxChange, change)
    }

    if (maxChange < convergenceThreshold) {
      break
    }
  }

  return centroids
}

// 合并相似颜色 - 用于简单模式
function mergeSimularColors(colors: ColorData[], threshold: number = 30): ColorData[] {
  if (colors.length <= 1) return colors

  const merged: ColorData[] = []
  const used = new Set<number>()

  for (let i = 0; i < colors.length; i++) {
    if (used.has(i)) continue

    const group = [colors[i]]
    used.add(i)

    for (let j = i + 1; j < colors.length; j++) {
      if (used.has(j)) continue
      const dist = colorDistance(colors[i].rgb, colors[j].rgb)
      if (dist < threshold) {
        group.push(colors[j])
        used.add(j)
      }
    }

    // 计算组内颜色的平均值
    if (group.length > 1) {
      let r = 0, g = 0, b = 0
      for (const color of group) {
        r += color.rgb[0]
        g += color.rgb[1]
        b += color.rgb[2]
      }
      const avgRgb: [number, number, number] = [
        Math.round(r / group.length),
        Math.round(g / group.length),
        Math.round(b / group.length),
      ]
      // 使用第一个颜色作为代表，但更新RGB值
      const representative = { ...group[0], rgb: avgRgb }
      merged.push(representative)
    } else {
      merged.push(group[0])
    }
  }

  return merged
}


// 将图像转换为像素艺术（优化版本）
export async function convertImageToPixelArt(
  imageSource: string | File,
  gridSize: number,
  colorCount: number,
  colorComplexity: number,
  mode: "dominant" | "average" = "dominant"
): Promise<PixelArtResult> {
  // 加载图像
  const img = new Image()
  const isFile = typeof imageSource === "object"
  const imageUrl = isFile ? URL.createObjectURL(imageSource as File) : (imageSource as string)
  // 允许跨域图像数据访问（data URL不受限制）
  img.crossOrigin = "anonymous"

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (isFile) {
        URL.revokeObjectURL(imageUrl)
      }
      reject(new Error("图像加载超时"))
    }, 10000)

    img.onload = () => {
      clearTimeout(timeout)
      try {
        // 创建Canvas
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) {
          throw new Error("无法获取Canvas上下文")
        }

        // 保持原始图像尺寸，不要缩放到gridSize
        const originalWidth = img.width
        const originalHeight = img.height
        canvas.width = originalWidth
        canvas.height = originalHeight

        // 绘制原始尺寸的图像
        ctx.drawImage(img, 0, 0, originalWidth, originalHeight)

        // 获取原始尺寸的像素数据
        let imageData: ImageData
        try {
          imageData = ctx.getImageData(0, 0, originalWidth, originalHeight)
        } catch (error) {
          throw new Error(`无法读取Canvas像素数据：${error instanceof Error ? error.message : "未知错误"}`)
        }

        // 使用新的像素化算法（如果选择了 dominant 或 average 模式）
        if (mode === "dominant" || mode === "average") {
          const pixelationMode = mode === "dominant" ? PixelationMode.Dominant : PixelationMode.Average
          // 使用原始图像尺寸进行像素化
          const pixelatedColors = pixelateImage(imageData, gridSize, gridSize, pixelationMode)

          // 转换色板格式
          const palette: PaletteColor[] = (colors as ColorData[]).map(c => ({
            key: c.id,
            hex: c.hex,
            rgb: { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] }
          }))

          // 步骤1: 创建初始映射的像素网格
          const initialMappedData: MappedPixel[][] = []
          let transparentPixelCount = 0

          for (let y = 0; y < gridSize; y++) {
            initialMappedData[y] = []
            for (let x = 0; x < gridSize; x++) {
              const cellColor = pixelatedColors[y][x]

              if (cellColor === null) {
                initialMappedData[y][x] = { key: 'T1', color: '#FFFFFF', isExternal: true }
                transparentPixelCount++
              } else {
                const closestColor = findClosestPaletteColor(cellColor, palette)
                initialMappedData[y][x] = {
                  key: closestColor.key,
                  color: closestColor.hex,
                  isExternal: false
                }
              }
            }
          }

          // 步骤2: 应用颜色合并算法（仅在 dominant 模式下）
          console.log(`[Color Merging] Mode: ${mode}, Will merge: ${mode === "dominant"}`)
          const mergedData = mode === "dominant"
            ? mergeGlobalColors(initialMappedData, palette, 30, gridSize, gridSize)
            : initialMappedData
          console.log(`[Color Merging] Complete. Initial colors: ${Object.keys(initialMappedData.flat().reduce((acc, cell) => { if (!cell.isExternal) acc[cell.key] = true; return acc; }, {} as Record<string, boolean>)).length}`)


          // 步骤3: 从合并后的数据创建最终结果
          const pixels: (string | null)[][] = []
          const colorPalette = new Map<string, ColorData>()
          const colorUsage: Record<string, number> = {}

          for (let y = 0; y < gridSize; y++) {
            pixels[y] = []
            for (let x = 0; x < gridSize; x++) {
              const cell = mergedData[y][x]

              if (cell.isExternal) {
                pixels[y][x] = null
              } else {
                pixels[y][x] = cell.key
                const colorData = (colors as ColorData[]).find(c => c.id === cell.key)!

                if (!colorPalette.has(cell.key)) {
                  colorPalette.set(cell.key, colorData)
                  colorUsage[cell.key] = 0
                }
                colorUsage[cell.key]++
              }
            }
          }

          const totalBeads = gridSize * gridSize - transparentPixelCount

          const result: PixelArtResult = {
            gridSize,
            pixels,
            colorPalette,
            colorUsage,
            totalBeads,
            transparentPixels: transparentPixelCount,
            mode,
          }

          if (isFile) {
            URL.revokeObjectURL(imageUrl)
          }

          return resolve(result)
        }

        // 原有的 K-means 算法（用于 simple 和 realistic 模式）
        const clusterCount = mode === "simple"
          ? Math.max(3, Math.min(Math.floor(colorCount * 0.6), 30))
          : Math.max(3, Math.min(colorCount, 50))
        const extractedCentroids = kmeansClusterColors(imageData.data, clusterCount, true, mode === "simple")

        // 第二步：根据颜色还原度调整提取的颜色
        if (colorComplexity < 100) {
          const factor = colorComplexity / 100
          for (let i = 0; i < extractedCentroids.length; i++) {
            const [r, g, b] = extractedCentroids[i]
            const gray = (r + g + b) / 3

            // 根据还原度调整颜色饱和度
            extractedCentroids[i] = [
              Math.round(gray + (r - gray) * factor),
              Math.round(gray + (g - gray) * factor),
              Math.round(gray + (b - gray) * factor),
            ]
          }
        }

        // 第三步：将提取的聚类颜色映射到拼豆颜色库
        const allColors = colors as ColorData[]
        let mappedBeadColors: ColorData[] = extractedCentroids.map(centroid =>
          findClosestColor(centroid, allColors)
        )

        // 简单模式：合并相似颜色
        if (mode === "simple") {
          mappedBeadColors = mergeSimularColors(mappedBeadColors, 35)
        }

        // 创建像素网格
        const pixels: (string | null)[][] = []
        const colorPalette = new Map<string, ColorData>()
        const colorUsage: Record<string, number> = {}
        let transparentPixelCount = 0

        for (let y = 0; y < gridSize; y++) {
          pixels[y] = []
          for (let x = 0; x < gridSize; x++) {
            const offset = (y * gridSize + x) * 4
            const alpha = imageData.data[offset + 3]

            // 检测透明像素（alpha < 128为透明）
            if (alpha < 128) {
              pixels[y][x] = null // null表示透明/无拼豆
              transparentPixelCount++
            } else {
              const rgb: [number, number, number] = [
                imageData.data[offset],
                imageData.data[offset + 1],
                imageData.data[offset + 2],
              ]

              // 找到最接近的颜色
              let selectedColor = mappedBeadColors[0]
              let minDist = colorDistance(rgb, selectedColor.rgb)

              for (let i = 1; i < mappedBeadColors.length; i++) {
                const dist = colorDistance(rgb, mappedBeadColors[i].rgb)
                if (dist < minDist) {
                  minDist = dist
                  selectedColor = mappedBeadColors[i]
                }
              }

              pixels[y][x] = selectedColor.id

              // 统计使用的颜色
              if (!colorPalette.has(selectedColor.id)) {
                colorPalette.set(selectedColor.id, selectedColor)
                colorUsage[selectedColor.id] = 0
              }
              colorUsage[selectedColor.id]++
            }
          }
        }

        // 计算总拼豆数（不包括透明像素）
        const totalBeads = gridSize * gridSize - transparentPixelCount

        const result: PixelArtResult = {
          gridSize,
          pixels,
          colorPalette,
          colorUsage,
          totalBeads,
          transparentPixels: transparentPixelCount,
          mode,
        }

        // 清理资源
        if (isFile) {
          URL.revokeObjectURL(imageUrl)
        }

        resolve(result)
      } catch (error) {
        if (isFile) {
          URL.revokeObjectURL(imageUrl)
        }
        reject(error)
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      if (isFile) {
        URL.revokeObjectURL(imageUrl)
      }
      reject(new Error("图像加载失败，请检查图像格式或来源"))
    }

    // 最后才设置src触发加载
    img.src = imageUrl
  })
}

// 将像素艺术数据导出为图像
export function exportPixelArtAsImage(
  pixelData: PixelArtResult,
  pixelSize: number = 10,
  showGrid: boolean = true,
  showColorIds: boolean = true
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("无法获取Canvas上下文")
  }

  const { gridSize, pixels, colorPalette } = pixelData
  const width = gridSize * pixelSize
  const height = gridSize * pixelSize

  canvas.width = width
  canvas.height = height

  // 绘制像素
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const colorId = pixels[y][x]

      // 跳过透明像素（null）
      if (colorId === null) {
        continue
      }

      const color = colorPalette.get(colorId)

      if (color) {
        ctx.fillStyle = color.hex
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
      }
    }
  }

  // 绘制网格
  if (showGrid) {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
    ctx.lineWidth = 1

    for (let i = 0; i <= gridSize; i++) {
      // 竖线
      ctx.beginPath()
      ctx.moveTo(i * pixelSize, 0)
      ctx.lineTo(i * pixelSize, height)
      ctx.stroke()

      // 横线
      ctx.beginPath()
      ctx.moveTo(0, i * pixelSize)
      ctx.lineTo(width, i * pixelSize)
      ctx.stroke()
    }
  }

  // 绘制颜色ID（始终显示，动态调整字体大小）
  if (showColorIds) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const colorId = pixels[y][x]

        // 跳过透明像素
        if (colorId === null) {
          continue
        }

        const color = colorPalette.get(colorId)

        // 判断背景颜色的亮度，选择合适的文字颜色
        let textColor = "rgba(0, 0, 0, 0.7)"
        if (color) {
          const rgb = color.rgb
          const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
          if (brightness < 128) {
            textColor = "rgba(255, 255, 255, 0.9)"
          }
        }

        ctx.fillStyle = textColor
        // 动态调整字体大小：小于等于6px用2px字体，7-10px用3px，大于10px用50%像素大小
        const fontSize = pixelSize <= 6 ? 2 : pixelSize <= 10 ? 3 : Math.max(4, Math.floor(pixelSize * 0.5))
        ctx.font = `bold ${fontSize}px monospace`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(colorId, (x + 0.5) * pixelSize, (y + 0.55) * pixelSize)
      }
    }
  }

  return canvas
}

// 下载图像
export function downloadPixelArt(canvas: HTMLCanvasElement, filename: string = "pixel-art.png"): void {
  const link = document.createElement("a")
  link.href = canvas.toDataURL("image/png")
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 生成PDF图纸（用于参考）
export function generateBeadChart(pixelData: PixelArtResult): string {
  const { gridSize, pixels, colorPalette, colorUsage } = pixelData
  let chart = ""

  // 生成颜色ID网格（文本格式）
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const colorId = pixels[y][x]
      // 透明像素显示为空格
      chart += (colorId || " ").padEnd(4)
    }
    chart += "\n"
  }

  // 生成材料清单
  chart += "\n\n=== 材料清单 ===\n"
  chart += "颜色ID | 颜色名 | 数量\n"
  chart += "-".repeat(50) + "\n"

  for (const [colorId, color] of colorPalette) {
    const count = colorUsage[colorId] || 0
    chart += `${colorId} | ${color.name} | ${count}\n`
  }

  return chart
}
