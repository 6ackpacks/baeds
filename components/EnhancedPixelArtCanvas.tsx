"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { ZoomIn, ZoomOut, Hand } from "lucide-react"
import type { PixelArtResult } from "@/lib/pixel-converter"

type DisplayMode = "simple" | "realistic"

interface EnhancedPixelArtCanvasProps {
  pixelData: PixelArtResult
  showGrid?: boolean
}

function isColorLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

export default function EnhancedPixelArtCanvas({
  pixelData,
  showGrid = true,
}: EnhancedPixelArtCanvasProps) {
  const { gridSize, pixels, colorPalette } = pixelData
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate initial zoom to fit canvas in viewport
  const calculateInitialZoom = useCallback(() => {
    if (!containerRef.current) return 1
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const basePixelSize = 20
    const canvasWidth = gridSize * basePixelSize
    const canvasHeight = gridSize * basePixelSize

    // Calculate zoom to fit with some padding
    const zoomX = (containerWidth * 0.9) / canvasWidth
    const zoomY = (containerHeight * 0.9) / canvasHeight
    return Math.min(zoomX, zoomY, 1)
  }, [gridSize])

  const [zoom, setZoom] = useState(1)
  const [displayMode, setDisplayMode] = useState<DisplayMode>("realistic")
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Set initial zoom when component mounts
  useEffect(() => {
    const initialZoom = calculateInitialZoom()
    setZoom(initialZoom)
  }, [calculateInitialZoom])

  const basePixelSize = 20
  const pixelSize = basePixelSize * zoom
  const canvasWidth = gridSize * pixelSize
  const canvasHeight = gridSize * pixelSize

  const handleZoom = useCallback((direction: "in" | "out") => {
    setZoom((prev) => {
      const newZoom = direction === "in" ? prev + 0.2 : Math.max(0.5, prev - 0.2)
      return Math.round(newZoom * 10) / 10
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 0) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => Math.max(0.1, Math.min(3, prev + delta)))
  }, [])

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  const getFontSize = () => {
    if (displayMode === "simple") return 0
    // Hide text when zoomed out (pixelSize < 12)
    if (pixelSize < 12) return 0
    if (pixelSize < 15) return 6
    if (pixelSize < 25) return 8
    return Math.max(10, pixelSize * 0.4)
  }

  return (
    <div className="flex h-full">
      {/* 左侧工具栏 */}
      <div className="w-16 bg-white border-r border-border flex flex-col items-center py-4 gap-2">
        <button
          className="w-12 h-12 rounded-lg flex items-center justify-center bg-black text-white"
          title="拖动"
        >
          <Hand className="w-5 h-5" />
        </button>

        <div className="h-px w-10 bg-border my-2" />

        <button
          onClick={() => handleZoom("out")}
          className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
          title="缩小"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom("in")}
          className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
          title="放大"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="h-14 bg-white border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {gridSize}×{gridSize} · {colorPalette.size} 色 · {pixelData.totalBeads} 珠 · {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(["simple", "realistic"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDisplayMode(mode)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  displayMode === mode
                    ? "bg-black text-white"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {mode === "simple" ? "简单" : "真实"}
              </button>
            ))}
          </div>
        </div>

        {/* 画布区域 */}
        <div className="flex-1 bg-gray-50 overflow-hidden relative">
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center"
            style={{
              cursor: isPanning ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: "center center",
              }}
            >
              <svg
                width={canvasWidth}
                height={canvasHeight}
                className="block shadow-2xl"
                style={{ background: "white" }}
              >
                {pixels.map((row, y) =>
                  row.map((colorId, x) => {
                    if (colorId === null) return null

                    const color = colorPalette.get(colorId)
                    const textColor = isColorLight(color?.hex || "#fff") ? "#000000" : "#FFFFFF"
                    const fontSize = getFontSize()

                    return (
                      <g key={`${x}-${y}`}>
                        <rect
                          x={x * pixelSize}
                          y={y * pixelSize}
                          width={pixelSize}
                          height={pixelSize}
                          fill={color?.hex || "#fff"}
                          stroke={showGrid ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)"}
                          strokeWidth={0.5}
                        />

                        {fontSize > 0 && (
                          <text
                            x={(x + 0.5) * pixelSize}
                            y={(y + 0.5) * pixelSize}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={fontSize}
                            fontWeight="bold"
                            fill={textColor}
                            fontFamily="monospace"
                            style={{
                              pointerEvents: "none",
                              userSelect: "none",
                            }}
                          >
                            {colorId}
                          </text>
                        )}
                      </g>
                    )
                  })
                )}
              </svg>
            </div>
          </div>

          {/* 底部信息栏 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border">
            <p className="text-sm text-muted-foreground">
              使用拖动工具移动画布 · 使用缩放工具调整大小
            </p>
          </div>
        </div>
      </div>

      {/* 右侧材料清单 */}
      <div className="w-80 bg-white border-l border-border overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">材料清单</h2>

          <div className="space-y-3">
            {Array.from(colorPalette.values()).map((color) => (
              <div
                key={color.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-border"
              >
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{color.id}</span>
                    <span className="text-xs bg-white px-2 py-1 rounded border border-border">
                      {color.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{color.hex}</span>
                    <span className="font-medium text-sm">
                      {pixelData.colorUsage[color.id] || 0} 颗
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-black text-white rounded-lg">
            <p className="text-sm font-medium">总计珠子数量</p>
            <p className="text-3xl font-semibold mt-1">{pixelData.totalBeads}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
