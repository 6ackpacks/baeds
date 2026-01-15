/**
 * Editable Canvas Component
 * Extends EnhancedPixelArtCanvas with editing capabilities
 * Based on change.md specifications
 */

"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { Pencil, Eraser, Pipette, PaintBucket, FlipHorizontal, Hand, Eye, Edit3 } from "lucide-react"
import type { PixelArtResult } from "@/lib/pixel-converter"
import { screenToGrid, floodFill, getMirrorPoint, type ToolType } from "@/lib/canvas-tools"
import UsedColorsPalette from "./UsedColorsPalette"
import FullColorPaletteDialog from "./FullColorPaletteDialog"

interface EditableCanvasProps {
  pixelData: PixelArtResult
  showGrid?: boolean
  onGridChange?: (newGrid: (string | null)[][]) => void
  isEditMode?: boolean
  onEditModeChange?: (isEditMode: boolean) => void
  selectedColor?: string
  onColorPick?: (color: string) => void
}

export default function EditableCanvas({
  pixelData,
  showGrid = true,
  onGridChange,
  isEditMode: isEditModeProp,
  onEditModeChange,
  selectedColor: selectedColorProp,
  onColorPick,
}: EditableCanvasProps) {
  const { gridSize, pixels, colorPalette } = pixelData
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const basePixelSize = 20

  // Editor state
  const [isEditMode, setIsEditMode] = useState(isEditModeProp ?? false)
  const [currentTool, setCurrentTool] = useState<ToolType>('pen')
  const [selectedColorId, setSelectedColorId] = useState<string | null>(selectedColorProp ?? null)
  const [editableGrid, setEditableGrid] = useState<(string | null)[][]>(pixels)
  const [history, setHistory] = useState<(string | null)[][][]>([pixels])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Canvas transform state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)
  const [showFullPalette, setShowFullPalette] = useState(false)

  // Calculate initial zoom to fit canvas in viewport
  const calculateInitialZoom = useCallback(() => {
    if (!containerRef.current) return 1
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const pixelSize = basePixelSize
    const canvasWidth = gridSize * pixelSize
    const canvasHeight = gridSize * pixelSize

    // Calculate zoom to fit with padding
    const zoomX = (containerWidth * 0.85) / canvasWidth
    const zoomY = (containerHeight * 0.85) / canvasHeight
    return Math.min(zoomX, zoomY, 2)
  }, [gridSize])

  // Set initial zoom when component mounts or gridSize changes
  useEffect(() => {
    const initialZoom = calculateInitialZoom()
    setZoom(initialZoom)
  }, [calculateInitialZoom, gridSize])

  // Initialize editable grid when pixelData changes
  useEffect(() => {
    setEditableGrid(pixels)
    setHistory([pixels])
    setHistoryIndex(0)
  }, [pixels])

  // Sync edit mode with parent
  useEffect(() => {
    if (isEditModeProp !== undefined && isEditModeProp !== isEditMode) {
      setIsEditMode(isEditModeProp)
    }
  }, [isEditModeProp])

  // Sync selected color with parent
  useEffect(() => {
    if (selectedColorProp && selectedColorProp !== selectedColorId) {
      setSelectedColorId(selectedColorProp)
    }
  }, [selectedColorProp])

  // Select first color by default
  useEffect(() => {
    if (!selectedColorId && colorPalette.size > 0) {
      const firstColor = Array.from(colorPalette.values())[0]
      setSelectedColorId(firstColor.id)
    }
  }, [colorPalette, selectedColorId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          handleUndo()
        } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
          e.preventDefault()
          handleRedo()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [historyIndex, history])

  const saveToHistory = useCallback((newGrid: (string | null)[][]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newGrid.map(row => [...row]))
    if (newHistory.length > 20) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setEditableGrid(history[historyIndex - 1])
      onGridChange?.(history[historyIndex - 1])
    }
  }, [historyIndex, history, onGridChange])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setEditableGrid(history[historyIndex + 1])
      onGridChange?.(history[historyIndex + 1])
    }
  }, [historyIndex, history, onGridChange])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canvasRef.current || !containerRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const point = screenToGrid(e.clientX, e.clientY, rect, pan.x, pan.y, basePixelSize, zoom)

    // Pan mode (Space key or middle mouse button or not in edit mode)
    if (isSpacePressed || e.button === 1 || !isEditMode) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      return
    }

    // Edit mode tools
    if (point.x < 0 || point.x >= gridSize || point.y < 0 || point.y >= gridSize) return

    setIsDrawing(true)

    const newGrid = editableGrid.map(row => [...row])

    switch (currentTool) {
      case 'pen':
        if (selectedColorProp) {
          // Use custom color from color picker
          newGrid[point.y][point.x] = selectedColorProp
        } else if (selectedColorId) {
          // Use color from palette
          newGrid[point.y][point.x] = selectedColorId
        }
        break
      case 'eraser':
        // Set to white color
        newGrid[point.y][point.x] = '#FFFFFF'
        break
      case 'picker':
        const pickedColorValue = editableGrid[point.y][point.x]
        if (pickedColorValue) {
          // Check if it's a hex color or colorId
          if (pickedColorValue.startsWith('#')) {
            // It's a hex color, update parent color picker
            onColorPick?.(pickedColorValue)
          } else {
            // It's a colorId, get hex from palette
            const color = colorPalette.get(pickedColorValue)
            if (color) {
              onColorPick?.(color.hex)
            }
          }
          setSelectedColorId(pickedColorValue)
        }
        setIsDrawing(false)
        return
      case 'clear':
        const targetColor = editableGrid[point.y][point.x]
        const clearedGrid = floodFill(editableGrid, point.x, point.y, targetColor, null)
        setEditableGrid(clearedGrid)
        saveToHistory(clearedGrid)
        onGridChange?.(clearedGrid)
        setIsDrawing(false)
        return
    }

    setEditableGrid(newGrid)
  }, [canvasRef, containerRef, pan, zoom, isSpacePressed, isEditMode, currentTool, selectedColorId, editableGrid, gridSize, saveToHistory, onGridChange])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!canvasRef.current) return

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
      return
    }

    if (!isDrawing || !isEditMode) return

    const rect = canvasRef.current.getBoundingClientRect()
    const point = screenToGrid(e.clientX, e.clientY, rect, pan.x, pan.y, basePixelSize, zoom)

    if (point.x < 0 || point.x >= gridSize || point.y < 0 || point.y >= gridSize) return

    const newGrid = editableGrid.map(row => [...row])

    switch (currentTool) {
      case 'pen':
        if (selectedColorProp) {
          newGrid[point.y][point.x] = selectedColorProp
        } else if (selectedColorId) {
          newGrid[point.y][point.x] = selectedColorId
        }
        break
      case 'eraser':
        newGrid[point.y][point.x] = '#FFFFFF'
        break
    }

    setEditableGrid(newGrid)
  }, [canvasRef, isPanning, panStart, isDrawing, isEditMode, currentTool, selectedColorId, editableGrid, gridSize, pan, zoom])

  const handlePointerUp = useCallback(() => {
    if (isDrawing) {
      saveToHistory(editableGrid)
      onGridChange?.(editableGrid)
    }
    setIsPanning(false)
    setIsDrawing(false)
  }, [isDrawing, editableGrid, saveToHistory, onGridChange])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)))
  }, [])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pixelSize = basePixelSize * zoom
    const canvasWidth = gridSize * pixelSize
    const canvasHeight = gridSize * pixelSize

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Draw pixels
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const colorValue = editableGrid[y][x]
        if (!colorValue) continue

        let hexColor: string | undefined

        // Check if it's a hex color or colorId
        if (colorValue.startsWith('#')) {
          hexColor = colorValue
        } else {
          const color = colorPalette.get(colorValue)
          hexColor = color?.hex
        }

        if (!hexColor) continue

        ctx.fillStyle = hexColor
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)

        // Draw grid
        if (showGrid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.2)'
          ctx.lineWidth = 0.5
          ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
        }
      }
    }
  }, [editableGrid, gridSize, zoom, colorPalette, showGrid])

  const getCursor = () => {
    if (isPanning || isSpacePressed || !isEditMode) return 'grab'
    if (currentTool === 'picker') return 'crosshair'
    return 'crosshair'
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Tool Toolbar */}
      {isEditMode && (
        <div className="w-full md:w-16 bg-white border-b md:border-r md:border-b-0 border-border flex md:flex-col items-center py-2 md:py-4 gap-2 px-2 md:px-0 overflow-x-auto md:overflow-x-visible">
          <div className="relative">
            <button
              onClick={() => setCurrentTool('pen')}
              onMouseEnter={() => setHoveredTool('pen')}
              onMouseLeave={() => setHoveredTool(null)}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                currentTool === 'pen' ? 'bg-black text-white' : 'hover:bg-gray-200 hover:scale-110'
              }`}
            >
              <Pencil className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {hoveredTool === 'pen' && (
              <div className="hidden md:block absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white px-3 py-1.5 rounded text-sm whitespace-nowrap z-50 pointer-events-none">
                画笔
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setCurrentTool('eraser')}
              onMouseEnter={() => setHoveredTool('eraser')}
              onMouseLeave={() => setHoveredTool(null)}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                currentTool === 'eraser' ? 'bg-black text-white' : 'hover:bg-gray-200 hover:scale-110'
              }`}
            >
              <Eraser className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {hoveredTool === 'eraser' && (
              <div className="hidden md:block absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white px-3 py-1.5 rounded text-sm whitespace-nowrap z-50 pointer-events-none">
                橡皮
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setCurrentTool('picker')}
              onMouseEnter={() => setHoveredTool('picker')}
              onMouseLeave={() => setHoveredTool(null)}
              className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                currentTool === 'picker' ? 'bg-black text-white' : 'hover:bg-gray-200 hover:scale-110'
              }`}
            >
              <Pipette className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {hoveredTool === 'picker' && (
              <div className="hidden md:block absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white px-3 py-1.5 rounded text-sm whitespace-nowrap z-50 pointer-events-none">
                吸管
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Mode Toggle */}
        <div className="h-12 md:h-14 bg-white border-b border-border flex items-center justify-between px-3 md:px-6">
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => {
                setIsEditMode(false)
                onEditModeChange?.(false)
              }}
              className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                !isEditMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-300 hover:scale-105'
              }`}
            >
              <Eye className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">查看模式</span>
              <span className="sm:hidden">查看</span>
            </button>
            <button
              onClick={() => {
                setIsEditMode(true)
                onEditModeChange?.(true)
              }}
              className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                isEditMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-300 hover:scale-105'
              }`}
            >
              <Edit3 className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
              <span className="hidden sm:inline">编辑模式</span>
              <span className="sm:hidden">编辑</span>
            </button>
          </div>

          {/* Compact Color Palette in Edit Mode */}
          {isEditMode && (
            <div className="hidden md:block flex-1 max-w-md ml-4">
              <UsedColorsPalette
                colorPalette={colorPalette}
                selectedColor={selectedColorProp || selectedColorId || ''}
                onColorSelect={(color) => {
                  onColorPick?.(color)
                  setCurrentTool('pen')
                }}
                onOpenFullPalette={() => setShowFullPalette(true)}
              />
            </div>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 bg-gray-50 overflow-hidden relative flex items-center justify-center"
          style={{ cursor: getCursor() }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Clear Button - Top Left */}
          {isEditMode && (
            <button
              onClick={() => setCurrentTool('clear')}
              className={`absolute top-4 left-4 z-10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg ${
                currentTool === 'clear'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-red-50 hover:scale-105 border-2 border-gray-300'
              }`}
            >
              <PaintBucket className="w-4 h-4 inline mr-2" />
              消除
            </button>
          )}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          >
            <canvas ref={canvasRef} className="block shadow-2xl" style={{ background: 'white' }} />
          </div>
        </div>
      </div>

      {/* Color Palette Sidebar */}
      <div className="w-full md:w-80 bg-white border-t md:border-l md:border-t-0 border-border overflow-y-auto max-h-[40vh] md:max-h-none">
        <div className="p-3 md:p-6">
          <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">颜色统计</h2>

          {/* Overall Statistics */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">颜色种类</p>
                <p className="text-xl md:text-2xl font-bold">{colorPalette.size}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">总珠子数</p>
                <p className="text-xl md:text-2xl font-bold">{pixelData.totalBeads}</p>
              </div>
            </div>
          </div>

          <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-3">颜色清单</h3>
          <div className="space-y-2 md:space-y-3">
            {Array.from(colorPalette.values()).map((color) => (
              <div
                key={color.id}
                className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg border border-border"
              >
                <div
                  className="w-8 h-8 md:w-12 md:h-12 rounded-lg border-2 border-border flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 md:mb-1">
                    <span className="font-medium text-xs md:text-sm truncate">{color.id}</span>
                    <span className="text-[10px] md:text-xs bg-white px-1.5 py-0.5 md:px-2 md:py-1 rounded border border-border">
                      {color.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-xs text-muted-foreground">{color.hex}</span>
                    <span className="font-medium text-xs md:text-sm">
                      {pixelData.colorUsage[color.id] || 0} 颗
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Color Palette Dialog */}
      <FullColorPaletteDialog
        isOpen={showFullPalette}
        onClose={() => setShowFullPalette(false)}
        onColorSelect={(color) => {
          onColorPick?.(color)
          setCurrentTool('pen')
        }}
        selectedColor={selectedColorProp || selectedColorId || ''}
      />
    </div>
  )
}
