"use client"

import { useState, useEffect, use } from "react"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { convertImageToPixelArt, type PixelArtResult } from "@/lib/pixel-converter"
import { exportProfessionalChart, downloadChart } from "@/lib/imageDownloader"
import EditableCanvas from "@/components/EditableCanvas"
import ExportOptionsDialog, { type ExportOptions } from "@/components/ExportOptionsDialog"

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
  useEffect(() => {
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

    generatePixelArt()
  }, [uploadedImage, gridSize, colorCount, colorComplexity, mode])

  const handleDownload = () => {
    setShowExportDialog(true)
  }

  const handleExport = (options: ExportOptions) => {
    if (!pixelArtResult) return
    try {
      // 使用导出选项生成图纸
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

    // Update the pixel art result with the new grid
    setPixelArtResult({
      ...pixelArtResult,
      pixels: newGrid
    })
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="w-10 h-10 rounded-full bg-black text-white hover:bg-brand-accent flex items-center justify-center">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">图案工作台</h1>
            <p className="text-xs text-muted-foreground">
              {gridSize}x{gridSize} · {colorCount} 色 · {pixelArtResult ? pixelArtResult.totalBeads : 0} 珠
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="px-6 py-2 rounded-full bg-black text-white hover:bg-brand-accent"
          >
            <Download className="w-4 h-4 inline mr-2" />
            下载图纸
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Settings Panel */}
        <aside className="w-80 bg-white border-r border-border overflow-y-auto p-6">
          <h2 className="text-lg font-semibold mb-4">参数设置</h2>

          <div className="space-y-6">
            {/* Grid Size */}
            <div>
              <label className="text-sm font-medium mb-2 block">网格尺寸 (粒度)</label>
              <input
                type="range"
                min="10"
                max="300"
                step="2"
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center mt-2 text-sm font-mono bg-gray-100 py-2 rounded">
                {gridSize} x {gridSize}
              </div>
              <p className="text-xs text-gray-500 mt-1">控制横向格子数量（10-300）</p>
            </div>

            {/* Mode Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">像素化模式</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("dominant")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "dominant"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  简单
                </button>
                <button
                  onClick={() => setMode("average")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "average"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  真实
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {mode === "dominant" && "简单模式：保留清晰边界"}
                {mode === "average" && "真实模式：色彩过渡自然"}
              </p>
            </div>

            {/* Color Merge Threshold - Only for dominant mode */}
            {mode === "dominant" && (
              <div>
                <label className="text-sm font-medium mb-2 block">颜色合并阈值</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={colorMergeThreshold}
                  onChange={(e) => setColorMergeThreshold(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center mt-2 text-sm font-mono bg-gray-100 py-2 rounded">
                  {colorMergeThreshold}
                </div>
                <p className="text-xs text-gray-500 mt-1">数值越大合并越多，色块越平滑</p>
              </div>
            )}

            {/* Color Count */}
            <div>
              <label className="text-sm font-medium mb-2 block">颜色数量</label>
              <input
                type="range"
                min="3"
                max="100"
                step="1"
                value={colorCount}
                onChange={(e) => setColorCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center mt-2 text-sm font-mono bg-gray-100 py-2 rounded">
                {colorCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">支持3-100种颜色</p>
            </div>

            {/* Color Complexity */}
            <div>
              <label className="text-sm font-medium mb-2 block">颜色还原度</label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={colorComplexity}
                onChange={(e) => setColorComplexity(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center mt-2 text-sm font-mono bg-gray-100 py-2 rounded">
                {colorComplexity}%
              </div>
              <p className="text-xs text-gray-500 mt-1">控制颜色过渡的平滑程度</p>
            </div>
          </div>
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
            <EditableCanvas pixelData={pixelArtResult} showGrid={showGrid} onGridChange={handleGridChange} />
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
