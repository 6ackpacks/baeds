"use client"

import React, { useState, useCallback } from "react"
import type { PixelArtResult } from "@/lib/pixel-converter"

interface FullscreenPixelTableProps {
  pixelData: PixelArtResult
  showGrid?: boolean
  onPixelChange?: (x: number, y: number, colorId: string | null) => void
}

interface HistoryState {
  pixels: (string | null)[][]
  colorPalette: Map<string, any>
  colorUsage: Record<string, number>
}

export default function FullscreenPixelTable({
  pixelData,
  showGrid = true,
  onPixelChange,
}: FullscreenPixelTableProps) {
  const { gridSize, colorPalette } = pixelData
  const [pixels, setPixels] = useState(pixelData.pixels)
  const [colorUsage, setColorUsage] = useState(pixelData.colorUsage)
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  // 保存历史状态
  const saveHistory = useCallback((newPixels: (string | null)[][], newUsage: Record<string, number>) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({
      pixels: newPixels.map(row => [...row]),
      colorPalette,
      colorUsage: newUsage,
    })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex, colorPalette])

  // 处理像素点击
  const handlePixelClick = useCallback((x: number, y: number) => {
    if (!selectedColor) return

    const newPixels = pixels.map(row => [...row])
    const oldColor = newPixels[y][x]
    newPixels[y][x] = selectedColor

    // 更新颜色使用统计
    const newUsage = { ...colorUsage }
    if (oldColor) {
      newUsage[oldColor] = (newUsage[oldColor] || 0) - 1
    }
    newUsage[selectedColor] = (newUsage[selectedColor] || 0) + 1

    setPixels(newPixels)
    setColorUsage(newUsage)
    saveHistory(newPixels, newUsage)
    onPixelChange?.(x, y, selectedColor)
  }, [pixels, selectedColor, colorUsage, saveHistory, onPixelChange])

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const state = history[newIndex]
      setPixels(state.pixels.map(row => [...row]))
      setColorUsage(state.colorUsage)
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex])

  // 重做
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const state = history[newIndex]
      setPixels(state.pixels.map(row => [...row]))
      setColorUsage(state.colorUsage)
      setHistoryIndex(newIndex)
    }
  }, [history, historyIndex])

  const pixelSize = Math.max(8, Math.min(40, Math.floor(window.innerWidth * 0.7 / gridSize)))

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      {/* 工具栏 */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-white">
        <button
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="px-3 py-2 rounded bg-secondary disabled:opacity-50"
        >
          撤销
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="px-3 py-2 rounded bg-secondary disabled:opacity-50"
        >
          重做
        </button>
        <div className="flex gap-2">
          {Array.from(colorPalette.values()).map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color.id)}
              className={`w-8 h-8 rounded border-2 ${
                selectedColor === color.id ? "border-black" : "border-gray-300"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* 全屏表格 */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <svg
          width={gridSize * pixelSize}
          height={gridSize * pixelSize}
          className="bg-white"
          style={{ border: "1px solid #ccc" }}
        >
          {pixels.map((row, y) =>
            row.map((colorId, x) => {
              if (colorId === null) return null
              const color = colorPalette.get(colorId)
              return (
                <g key={`${x}-${y}`} onClick={() => handlePixelClick(x, y)} style={{ cursor: "pointer" }}>
                  <rect
                    x={x * pixelSize}
                    y={y * pixelSize}
                    width={pixelSize}
                    height={pixelSize}
                    fill={color?.hex || "#fff"}
                    stroke={showGrid ? "rgba(0,0,0,0.1)" : "none"}
                    strokeWidth={0.5}
                  />
                </g>
              )
            })
          )}
        </svg>
      </div>
    </div>
  )
}
