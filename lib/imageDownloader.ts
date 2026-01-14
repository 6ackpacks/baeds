import type { PixelArtResult } from './pixel-converter'

export interface ExportOptions {
  showHeader?: boolean
  showCoordinates?: boolean
  showStatistics?: boolean
  coordinateInterval?: number // 10 or 15
  cellSize?: number
  title?: string
  showGrid?: boolean
  gridLineColor?: string
  ignoreBackground?: boolean
}

/**
 * 判断颜色亮度，返回对比色（黑或白）
 */
function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#FFFFFF'
}

/**
 * 绘制专业的图纸标题栏
 */
function drawHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  title: string
): number {
  const headerHeight = 80

  // 绘制渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, 0)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(1, '#764ba2')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, headerHeight)

  // 绘制标题
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(title, 30, 50)

  return headerHeight
}

/**
 * 绘制坐标轴标注
 */
function drawCoordinates(
  ctx: CanvasRenderingContext2D,
  gridSize: number,
  cellSize: number,
  offsetX: number,
  offsetY: number
) {
  const coordSize = 30
  ctx.fillStyle = '#666666'
  ctx.font = 'bold 12px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 顶部和底部坐标
  for (let i = 0; i < gridSize; i++) {
    const x = offsetX + i * cellSize + cellSize / 2
    ctx.fillText(i.toString(), x, offsetY - coordSize / 2)
    ctx.fillText(i.toString(), x, offsetY + gridSize * cellSize + coordSize / 2)
  }

  // 左侧和右侧坐标
  ctx.textAlign = 'center'
  for (let j = 0; j < gridSize; j++) {
    const y = offsetY + j * cellSize + cellSize / 2
    ctx.fillText(j.toString(), offsetX - coordSize / 2, y)
    ctx.fillText(j.toString(), offsetX + gridSize * cellSize + coordSize / 2, y)
  }
}

/**
 * 绘制网格和色号
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  pixelData: PixelArtResult,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  coordinateInterval: number
) {
  const { gridSize, pixels, colorPalette } = pixelData

  // 绘制单元格
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const colorId = pixels[y][x]
      if (colorId === null) continue

      const color = colorPalette.get(colorId)
      if (!color) continue

      const posX = offsetX + x * cellSize
      const posY = offsetY + y * cellSize

      // 填充颜色
      ctx.fillStyle = color.hex
      ctx.fillRect(posX, posY, cellSize, cellSize)

      // 绘制色号
      ctx.fillStyle = getContrastColor(color.hex)
      ctx.font = `bold ${Math.max(8, cellSize * 0.4)}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(colorId, posX + cellSize / 2, posY + cellSize / 2)
    }
  }

  // 绘制网格线
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.lineWidth = 1

  for (let i = 0; i <= gridSize; i++) {
    // 每隔 coordinateInterval 格绘制粗线
    if (i % coordinateInterval === 0) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
    } else {
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
    }

    // 竖线
    ctx.beginPath()
    ctx.moveTo(offsetX + i * cellSize, offsetY)
    ctx.lineTo(offsetX + i * cellSize, offsetY + gridSize * cellSize)
    ctx.stroke()

    // 横线
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY + i * cellSize)
    ctx.lineTo(offsetX + gridSize * cellSize, offsetY + i * cellSize)
    ctx.stroke()
  }
}

/**
 * 绘制统计面板
 */
function drawStatistics(
  ctx: CanvasRenderingContext2D,
  pixelData: PixelArtResult,
  startY: number,
  width: number
): number {
  const { colorPalette, colorUsage, totalBeads } = pixelData
  const padding = 30
  const rowHeight = 40
  const colorBlockSize = 30

  ctx.fillStyle = '#333333'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('材料清单', padding, startY + 30)

  let currentY = startY + 60

  // 绘制每个颜色的统计
  const colors = Array.from(colorPalette.values())
  for (const color of colors) {
    const count = colorUsage[color.id] || 0

    // 绘制色块
    ctx.fillStyle = color.hex
    ctx.fillRect(padding, currentY, colorBlockSize, colorBlockSize)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.strokeRect(padding, currentY, colorBlockSize, colorBlockSize)

    // 绘制色号
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(color.id, padding + colorBlockSize + 15, currentY + colorBlockSize / 2 + 5)

    // 绘制颜色名称
    ctx.font = '14px Arial'
    ctx.fillText(color.name, padding + colorBlockSize + 80, currentY + colorBlockSize / 2 + 5)

    // 绘制数量
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(`${count} 颗`, width - padding, currentY + colorBlockSize / 2 + 5)

    currentY += rowHeight
  }

  // 绘制总计
  currentY += 20
  ctx.fillStyle = '#000000'
  ctx.fillRect(padding, currentY, width - padding * 2, 2)
  currentY += 30

  ctx.fillStyle = '#333333'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('总计', padding, currentY)
  ctx.textAlign = 'right'
  ctx.fillText(`${totalBeads} 颗`, width - padding, currentY)

  return currentY + 40
}

/**
 * 导出专业的拼豆图纸
 */
export function exportProfessionalChart(
  pixelData: PixelArtResult,
  options: ExportOptions = {}
): HTMLCanvasElement {
  const {
    showHeader = true,
    showCoordinates = true,
    showStatistics = true,
    coordinateInterval = 10,
    cellSize = 30,
    title = '拼豆图纸'
  } = options

  const { gridSize } = pixelData
  const coordSize = showCoordinates ? 30 : 0
  const gridWidth = gridSize * cellSize
  const gridHeight = gridSize * cellSize

  // 计算画布尺寸
  let canvasWidth = gridWidth + coordSize * 2 + 60
  let canvasHeight = gridHeight + coordSize * 2 + 60

  if (showHeader) canvasHeight += 80
  if (showStatistics) canvasHeight += 400 // 预留统计面板空间

  // 创建画布
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取Canvas上下文')

  // 白色背景
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  let currentY = 0

  // 绘制标题栏
  if (showHeader) {
    currentY += drawHeader(ctx, canvasWidth, title)
  }

  currentY += 30
  const offsetX = coordSize + 30
  const offsetY = currentY + coordSize

  // 绘制坐标
  if (showCoordinates) {
    drawCoordinates(ctx, gridSize, cellSize, offsetX, offsetY)
  }

  // 绘制网格
  drawGrid(ctx, pixelData, cellSize, offsetX, offsetY, coordinateInterval)

  currentY = offsetY + gridHeight + coordSize + 30

  // 绘制统计面板
  if (showStatistics) {
    drawStatistics(ctx, pixelData, currentY, canvasWidth)
  }

  return canvas
}

/**
 * 下载图纸
 */
export function downloadChart(canvas: HTMLCanvasElement, filename: string = 'perler-beads-chart.png'): void {
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
