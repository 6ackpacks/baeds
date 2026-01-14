"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { ArrowLeft, Upload, ImageIcon, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export default function UploadPage() {
  const router = useRouter()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [gridSize, setGridSize] = useState(52)
  const [colorCount, setColorCount] = useState(30)
  const [colorComplexity, setColorComplexity] = useState(70)
  const [colorMergeThreshold, setColorMergeThreshold] = useState(30)
  const [mode, setMode] = useState<"dominant" | "average">("dominant")
  const [brand, setBrand] = useState<string>("MARD")

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = () => {
    // Save uploaded image to localStorage
    if (uploadedImage) {
      localStorage.setItem("uploadedImage", uploadedImage)
      localStorage.setItem("gridSize", gridSize.toString())
      localStorage.setItem("colorCount", colorCount.toString())
      localStorage.setItem("colorComplexity", colorComplexity.toString())
      localStorage.setItem("colorMergeThreshold", colorMergeThreshold.toString())
      localStorage.setItem("mode", mode)
      localStorage.setItem("brand", brand)
    }
    // Navigate to editor with uploaded image
    router.push("/editor/custom")
  }

  const clearImage = () => {
    setUploadedImage(null)
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent selection:text-white">
      {/* Background ambient blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[100px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-[80px] pointer-events-none" />

      {/* 导航栏 */}
      <header className="border-b border-gray-100 bg-brand-surface">
        <div className="container mx-auto px-6 md:px-12 flex items-center gap-4 py-4">
          <Link href="/">
            <button className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-brand-accent transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-brand-text">上传图片</h1>
            <p className="text-sm text-gray-600">支持 JPG / PNG，单张不超过 100MB</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Upload Area */}
        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-4 border-dashed rounded-3xl transition-all duration-300
                ${isDragging ? "border-brand-accent bg-brand-accent/10 scale-105" : "border-gray-300"}
                ${uploadedImage ? "p-4" : "p-12"}
              `}
            >
              {uploadedImage ? (
                <div className="relative">
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 z-10 bg-brand-accent text-white rounded-full p-2 hover:scale-110 transition-transform"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded preview"
                    className="w-full h-auto rounded-2xl border-2 border-gray-200"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <Upload className="h-24 w-24 text-brand-accent animate-bounce-cute" />
                      <div className="absolute -bottom-2 -right-2">
                        <ImageIcon className="h-10 w-10 text-brand-text" />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-brand-text mb-3">拖拽图片到这里</h2>
                  <p className="text-lg text-gray-600 mb-8">或者点击下方按钮选择文件</p>

                  <label htmlFor="file-input">
                    <div className="inline-block">
                      <button
                        className="inline-flex items-center justify-center gap-2 px-8 py-6 rounded-full font-medium transition-all duration-300 text-xl bg-black text-white hover:bg-brand-accent border border-transparent cursor-pointer font-bold"
                        onClick={() => document.getElementById('file-input')?.click()}
                      >
                        <Upload className="w-5 h-5" />
                        <span>选择图片文件</span>
                      </button>
                    </div>
                  </label>
                  <input id="file-input" type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

                  <p className="text-sm text-gray-600 mt-6">支持格式：JPG、PNG、GIF、WebP</p>
                </div>
              )}
            </div>

            {/* Preview Info */}
            {uploadedImage && (
              <div className="mt-6 flex justify-center">
                <motion.button
                  onClick={handleGenerate}
                  className="inline-flex items-center justify-center gap-2 px-12 py-6 rounded-full font-medium transition-all duration-300 text-xl bg-black text-white hover:bg-brand-accent border border-transparent font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  生成拼豆图案
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Settings Panel */}
        <aside className="lg:w-96 border-t border-gray-100 lg:border-t-0 lg:border-l border-gray-100 bg-white p-8">
          <h2 className="text-2xl font-bold text-brand-text mb-6">图案设置</h2>

          <div className="space-y-8">
            {/* Grid Size */}
            <div>
              <Label className="text-sm font-bold mb-3 block text-brand-text">网格尺寸 (粒度)</Label>
              <div className="space-y-3">
                <Slider
                  value={[gridSize]}
                  onValueChange={(value) => setGridSize(value[0])}
                  min={10}
                  max={300}
                  step={2}
                  className="w-full"
                />
                <input
                  type="text"
                  value={`${gridSize} x ${gridSize}`}
                  readOnly
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-center font-mono font-bold text-lg text-brand-text"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">控制横向格子数量（10-300），更大的尺寸会保留更多细节。</p>
            </div>

            {/* Color Count */}
            <div>
              <Label className="text-sm font-bold mb-3 block text-brand-text">颜色数量</Label>
              <div className="space-y-3">
                <Slider
                  value={[colorCount]}
                  onValueChange={(value) => setColorCount(value[0])}
                  min={3}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <input
                  type="text"
                  value={colorCount}
                  readOnly
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-center font-mono font-bold text-lg text-brand-text"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">支持3-100种颜色，默认30种能很好地代表原图。</p>
            </div>

            {/* Color Complexity */}
            <div>
              <Label className="text-sm font-bold mb-3 block text-brand-text">颜色还原度</Label>
              <div className="space-y-3">
                <Slider
                  value={[colorComplexity]}
                  onValueChange={(value) => setColorComplexity(value[0])}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <input
                  type="text"
                  value={`${colorComplexity}%`}
                  readOnly
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-center font-mono font-bold text-lg text-brand-text"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">控制颜色过渡的平滑程度和细节保留。</p>
            </div>

            {/* Pixelation Mode */}
            <div>
              <Label className="text-sm font-bold mb-3 block text-brand-text">像素化模式</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("dominant")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    mode === "dominant"
                      ? "bg-brand-accent text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  简单
                </button>
                <button
                  onClick={() => setMode("average")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    mode === "average"
                      ? "bg-brand-accent text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  真实
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {mode === "dominant" && "简单模式：提取单元格内最常见的颜色，保留清晰边界，适合卡通图片"}
                {mode === "average" && "真实模式：计算单元格内颜色平均值，色彩过渡更自然，适合照片"}
              </p>
            </div>

            {/* Color Merge Threshold - Only for dominant mode */}
            {mode === "dominant" && (
              <div>
                <Label className="text-sm font-bold mb-3 block text-brand-text">颜色合并阈值</Label>
                <div className="space-y-3">
                  <Slider
                    value={[colorMergeThreshold]}
                    onValueChange={(value) => setColorMergeThreshold(value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <input
                    type="text"
                    value={colorMergeThreshold}
                    readOnly
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-center font-mono font-bold text-lg text-brand-text"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">调整相似颜色的合并阈值（0-100），数值越大合并越多，色块越平滑。</p>
              </div>
            )}

            {/* Brand Selection */}
            <div>
              <Label className="text-sm font-bold mb-3 block text-brand-text">拼豆品牌</Label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 bg-white text-brand-text font-medium"
              >
                <option value="MARD">MARD</option>
                <option value="COCO">COCO</option>
                <option value="漫漫">漫漫</option>
                <option value="盼盼">盼盼</option>
                <option value="咪小窝">咪小窝</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">选择您使用的拼豆品牌色号系统</p>
            </div>

            {/* Info Box */}
            <div className="bg-brand-accent/10 p-4 rounded-lg">
              <h3 className="font-bold mb-2 text-brand-text">当前预计</h3>
              <div className="space-y-1 text-sm text-brand-text">
                <p>
                  网格大小：{gridSize}x{gridSize} 像素
                </p>
                <p>使用颜色：约 {colorCount} 种</p>
                <p>总珠子数：约 {gridSize * gridSize} 颗</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
