"use client"

import { useState, useEffect, use } from "react"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { convertImageToPixelArt, type PixelArtResult } from "@/lib/pixel-converter"
import { exportProfessionalChart, downloadChart } from "@/lib/imageDownloader"
import EditableCanvas from "@/components/EditableCanvas"
import ExportOptionsDialog, { type DialogExportOptions } from "@/components/ExportOptionsDialog"
import MardColorPalette from "@/components/MardColorPalette"

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [gridSize, setGridSize] = useState(52)
  const [colorCount, setColorCount] = useState(30)
  const [colorComplexity, setColorComplexity] = useState(70)
  const [colorMergeThreshold, setColorMergeThreshold] = useState(30)
  const [showGrid, setShowGrid] = useState(true)
  const [pixelArtResult, setPixelArtResult] = useState<PixelArtResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"dominant" | "average">("dominant")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [gridSizeInput, setGridSizeInput] = useState(gridSize.toString())

  // 初始化颜色和示例图像
  useEffect(() => {
    // 从localStorage加载之前保存的设置
    if (id.startsWith("discover-")) {
      // 对于discover项目，使用专门的存储
      const discoverImage = localStorage.getItem("discoverImage")

      if (discoverImage && !uploadedImage) {
        setUploadedImage(discoverImage)
      }
    } else if (id === "custom" || id === "discover") {
      // 从localStorage加载之前保存的设置
      const savedGridSize = localStorage.getItem("gridSize")
      const savedColorCount = localStorage.getItem("colorCount")
      const savedColorComplexity = localStorage.getItem("colorComplexity")
      const savedColorMergeThreshold = localStorage.getItem("colorMergeThreshold")
      const savedMode = localStorage.getItem("mode")

      if (savedGridSize) setGridSize(parseInt(savedGridSize))
      if (savedColorCount) setColorCount(parseInt(savedColorCount))
      if (savedColorComplexity) setColorComplexity(parseInt(savedColorComplexity))
      if (savedColorMergeThreshold) setColorMergeThreshold(parseInt(savedColorMergeThreshold))
      if (savedMode) setMode(savedMode as "dominant" | "average")

      const storedImage = localStorage.getItem("uploadedImage")
      if (storedImage && !uploadedImage) {
        setUploadedImage(storedImage)
      }
    }
  }, [id, uploadedImage])

  // 生成像素艺术
  const generatePixelArt = async () => {
    if (!uploadedImage) {
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      console.log(`[生成像素图] 使用模式: ${mode}`)
      const result = await convertImageToPixelArt(uploadedImage, gridSize, colorCount, colorComplexity, mode, colorMergeThreshold)
      console.log(`[生成完成] 模式: ${mode}, 颜色数: ${result.colorPalette.size}`)
      setPixelArtResult(result)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "未知错误"
      console.error("像素艺术生成失败:", errorMsg)
      setError(`生成失败: ${errorMsg}`)
      setPixelArtResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始生成 - 仅在图片上传时
  useEffect(() => {
    if (uploadedImage && !pixelArtResult) {
      generatePixelArt()
    }
  }, [uploadedImage])

  const handleDownload = () => {
    setShowExportDialog(true)
  }

  const handleExport = (options: DialogExportOptions) => {
    if (!pixelArtResult) return
    try {
      const canvas = exportProfessionalChart(pixelArtResult, {
        showHeader: options.showColorCodes,
        showCoordinates: options.showCoordinates,
        showStatistics: options.showColorCodes,
        coordinateInterval: options.gridInterval,
        cellSize: 30,
        title: '拼豆图纸',
        showGrid: options.showGrid,
        gridLineColor: options.gridLineColor,
        ignoreBackground: options.ignoreBackground,
      })
      downloadChart(canvas, `pixel-art-${gridSize}x${gridSize}.png`)
    } catch (error) {
      console.error("下载失败:", error)
    }
  }

  const handleModeChange = async (newMode: "dominant" | "average") => {
    console.log(`[模式切换] 从 ${mode} 切换到 ${newMode}`)
    if (!uploadedImage) {
      console.log(`[模式切换] 没有上传图片，取消切换`)
      return
    }

    if (newMode === mode) {
      console.log(`[模式切换] 模式相同，无需切换`)
      return
    }

    setMode(newMode)
  }

  const handleGridChange = (newGrid: (string | null)[][]) => {
    if (!pixelArtResult) return

    // Recalculate statistics from the new grid
    const newColorPalette = new Map<string, any>()
    const newColorUsage: Record<string, number> = {}
    let totalBeads = 0

    for (let y = 0; y < newGrid.length; y++) {
      for (let x = 0; x < newGrid[y].length; x++) {
        const colorValue = newGrid[y][x]
        if (!colorValue) continue

        totalBeads++

        // Check if it's a hex color or colorId
        if (colorValue.startsWith('#')) {
          // It's a custom hex color
          if (!newColorPalette.has(colorValue)) {
            newColorPalette.set(colorValue, {
              id: colorValue,
              name: colorValue,
              hex: colorValue,
              rgb: [
                parseInt(colorValue.slice(1, 3), 16),
                parseInt(colorValue.slice(3, 5), 16),
                parseInt(colorValue.slice(5, 7), 16),
              ] as [number, number, number],
              category: 'Custom'
            })
            newColorUsage[colorValue] = 0
          }
          newColorUsage[colorValue]++
        } else {
          // It's a colorId from original palette
          const color = pixelArtResult.colorPalette.get(colorValue)
          if (color) {
            if (!newColorPalette.has(colorValue)) {
              newColorPalette.set(colorValue, color)
              newColorUsage[colorValue] = 0
            }
            newColorUsage[colorValue]++
          }
        }
      }
    }

    // Update the pixel art result with the new grid and statistics
    setPixelArtResult({
      ...pixelArtResult,
      pixels: newGrid,
      colorPalette: newColorPalette,
      colorUsage: newColorUsage,
      totalBeads: totalBeads,
      transparentPixels: (gridSize * gridSize) - totalBeads
    })
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 md:h-16 bg-white border-b border-border flex items-center justify-between px-3 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/">
            <button className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black text-white hover:bg-gray-700 hover:scale-110 transition-all duration-200 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-sm md:text-lg font-semibold text-foreground">图案工作台</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {gridSize}x{gridSize} · {colorCount} 色 · {pixelArtResult ? pixelArtResult.totalBeads : 0} 珠
            </p>
          </div>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 md:px-6 md:py-2 rounded-full bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 text-xs md:text-base"
          >
            <Download className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">下载图纸</span>
            <span className="sm:hidden">下载</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Settings Panel / Color Picker */}
        <aside className={`${isEditMode ? 'hidden md:block' : ''} w-full md:w-80 bg-white border-b md:border-r md:border-b-0 border-border overflow-y-auto ${isEditMode ? 'max-h-0 md:max-h-none' : 'max-h-[40vh] md:max-h-none'}`}>
          {!isEditMode ? (
            // Parameter Settings Panel
            <div className="p-3 md:p-6">
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">参数设置</h2>

              <div className="space-y-4 md:space-y-6">
                {/* Grid Size */}
                <div>
                  <label className="text-xs md:text-sm font-medium mb-2 block">画布切分数量</label>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="2"
                    value={gridSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setGridSize(val)
                      setGridSizeInput(val.toString())
                    }}
                    className="w-full"
                  />
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      min="10"
                      max="300"
                      step="2"
                      value={gridSizeInput}
                      onChange={(e) => setGridSizeInput(e.target.value)}
                      onBlur={() => {
                        const val = parseInt(gridSizeInput)
                        if (!isNaN(val) && val >= 10 && val <= 300) {
                          setGridSize(val)
                        } else {
                          setGridSizeInput(gridSize.toString())
                        }
                      }}
                      className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-1.5 md:px-4 md:py-2 text-center font-mono font-bold text-sm md:text-lg focus:border-black focus:outline-none"
                      placeholder="10-300"
                    />
                    <div className="flex-1 text-center text-xs md:text-sm font-mono bg-gray-100 py-1.5 md:py-2 rounded flex items-center justify-center">
                      {gridSize} x {gridSize}
                    </div>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1">控制横向格子数量（10-300）</p>
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="text-xs md:text-sm font-medium mb-2 block">像素化模式</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode("dominant")}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                        mode === "dominant"
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-300 hover:scale-105"
                      }`}
                    >
                      简单
                    </button>
                    <button
                      onClick={() => setMode("average")}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                        mode === "average"
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-300 hover:scale-105"
                      }`}
                    >
                      真实
                    </button>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                    {mode === "dominant" && "简单模式：保留清晰边界"}
                    {mode === "average" && "真实模式：色彩过渡自然"}
                  </p>
                </div>

                {/* Color Merge Threshold - Only for dominant mode */}
                {mode === "dominant" && (
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-2 block">颜色合并阈值</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={colorMergeThreshold}
                      onChange={(e) => setColorMergeThreshold(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-center mt-2 text-xs md:text-sm font-mono bg-gray-100 py-1.5 md:py-2 rounded">
                      {colorMergeThreshold}
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-1">数值越大合并越多，色块越平滑</p>
                  </div>
                )}

                {/* Apply Button */}
                <button
                  onClick={generatePixelArt}
                  disabled={isLoading}
                  className="w-full px-3 py-2 md:px-4 md:py-3 bg-black text-white rounded-lg hover:bg-gray-800 hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base"
                >
                  {isLoading ? '生成中...' : '应用设置'}
                </button>
              </div>
            </div>
          ) : (
            // MARD Color Palette Panel
            <MardColorPalette
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
            />
          )}
        </aside>

        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                <p className="text-muted-foreground">正在生成像素艺术...</p>
              </div>
            </div>
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium mb-2">错误</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            </div>
          ) : pixelArtResult ? (
            <EditableCanvas
              pixelData={pixelArtResult}
              showGrid={showGrid}
              onGridChange={handleGridChange}
              isEditMode={isEditMode}
              onEditModeChange={setIsEditMode}
              selectedColor={selectedColor}
              onColorPick={setSelectedColor}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <p>暂无图像数据，请上传图像</p>
            </div>
          )}
        </div>
      </div>

      {/* Export Options Dialog */}
      <ExportOptionsDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />
    </div>
  )
}
