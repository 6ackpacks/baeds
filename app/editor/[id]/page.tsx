"use client"

import { useState, useEffect, use } from "react"
import { ArrowLeft, Download, Scissors } from "lucide-react"
import Link from "next/link"
import { convertImageToPixelArt, type PixelArtResult } from "@/lib/pixel-converter"
import { exportProfessionalChart, downloadChart } from "@/lib/imageDownloader"
import EnhancedPixelArtCanvas from "@/components/EnhancedPixelArtCanvas"
import { removeBackground } from "@imgly/background-removal"

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [gridSize, setGridSize] = useState(52)
  const [colorCount, setColorCount] = useState(30)
  const [colorComplexity, setColorComplexity] = useState(70)
  const [showGrid, setShowGrid] = useState(true)
  const [pixelArtResult, setPixelArtResult] = useState<PixelArtResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"dominant" | "average">("dominant")
  const [isRemovingBackground, setIsRemovingBackground] = useState(false)

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
      const savedMode = localStorage.getItem("mode")

      if (savedGridSize) setGridSize(parseInt(savedGridSize))
      if (savedColorCount) setColorCount(parseInt(savedColorCount))
      if (savedColorComplexity) setColorComplexity(parseInt(savedColorComplexity))
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
        const result = await convertImageToPixelArt(uploadedImage, gridSize, colorCount, colorComplexity, mode)
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
    if (!pixelArtResult) return
    try {
      // 使用新的专业导出引擎
      const canvas = exportProfessionalChart(pixelArtResult, {
        showHeader: true,
        showCoordinates: true,
        showStatistics: true,
        coordinateInterval: 10,
        cellSize: 30,
        title: '拼豆图纸'
      })
      downloadChart(canvas, `pixel-art-${gridSize}x${gridSize}.png`)
    } catch (error) {
      console.error("下载失败:", error)
    }
  }

  const handleRemoveBackground = async () => {
    if (!uploadedImage || isRemovingBackground) return

    setIsRemovingBackground(true)
    setError(null)

    try {
      // Convert data URL to Blob
      const response = await fetch(uploadedImage)
      const blob = await response.blob()

      // Remove background
      const resultBlob = await removeBackground(blob)

      // Convert result back to data URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
        setIsRemovingBackground(false)
      }
      reader.onerror = () => {
        setError("图片转换失败")
        setIsRemovingBackground(false)
      }
      reader.readAsDataURL(resultBlob)
    } catch (error) {
      console.error("背景移除失败:", error)
      setError(`背景移除失败: ${error instanceof Error ? error.message : "未知错误"}`)
      setIsRemovingBackground(false)
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
            onClick={handleRemoveBackground}
            disabled={!uploadedImage || isRemovingBackground}
            className="px-6 py-2 rounded-full bg-white border-2 border-black text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Scissors className="w-4 h-4 inline mr-2" />
            {isRemovingBackground ? "处理中..." : "移除背景"}
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-2 rounded-full bg-black text-white hover:bg-brand-accent"
          >
            <Download className="w-4 h-4 inline mr-2" />
            下载图纸
          </button>
        </div>
      </header>

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
          <EnhancedPixelArtCanvas pixelData={pixelArtResult} showGrid={showGrid} onModeChange={handleModeChange} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <p>暂无图像数据，请上传图像</p>
          </div>
        )}
      </div>
    </div>
  )
}
