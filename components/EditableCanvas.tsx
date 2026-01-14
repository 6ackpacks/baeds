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

interface EditableCanvasProps {
  pixelData: PixelArtResult
  showGrid?: boolean
  onGridChange?: (newGrid: (string | null)[][]) => void
}

export default function EditableCanvas({
  pixelData,
  showGrid = true,
  onGridChange,
}: EditableCanvasProps) {
  const { gridSize, pixels, colorPalette } = pixelData
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Editor state
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentTool, setCurrentTool] = useState<ToolType>('pen')
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)
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
        if (selectedColorId) {
          newGrid[point.y][point.x] = selectedColorId
        }
        break
      case 'eraser':
        newGrid[point.y][point.x] = null
        break
      case 'picker':
        const pickedColor = editableGrid[point.y][point.x]
        if (pickedColor) setSelectedColorId(pickedColor)
        setIsDrawing(false)
        return
      case 'fill':
        const targetColor = editableGrid[point.y][point.x]
        const filledGrid = floodFill(editableGrid, point.x, point.y, targetColor, selectedColorId)
        setEditableGrid(filledGrid)
        saveToHistory(filledGrid)
        onGridChange?.(filledGrid)
        setIsDrawing(false)
        return
      case 'mirror':
        if (selectedColorId) {
          newGrid[point.y][point.x] = selectedColorId
          const mirrorX = getMirrorPoint(point.x, gridSize)
          newGrid[point.y][mirrorX] = selectedColorId
        }
        break
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
        if (selectedColorId) {
          newGrid[point.y][point.x] = selectedColorId
        }
        break
      case 'eraser':
        newGrid[point.y][point.x] = null
        break
      case 'mirror':
        if (selectedColorId) {
          newGrid[point.y][point.x] = selectedColorId
          const mirrorX = getMirrorPoint(point.x, gridSize)
          newGrid[point.y][mirrorX] = selectedColorId
        }
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
        const colorId = editableGrid[y][x]
        if (!colorId) continue

        const color = colorPalette.get(colorId)
        if (!color) continue

        ctx.fillStyle = color.hex
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
    <div className="flex h-full">
      {/* Tool Toolbar */}
      {isEditMode && (
        <div className="w-16 bg-white border-r border-border flex flex-col items-center py-4 gap-2">
          <button
            onClick={() => setCurrentTool('pen')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              currentTool === 'pen' ? 'bg-black text-white' : 'hover:bg-secondary'
            }`}
            title="画笔 (Pen)"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentTool('eraser')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              currentTool === 'eraser' ? 'bg-black text-white' : 'hover:bg-secondary'
            }`}
            title="橡皮 (Eraser)"
          >
            <Eraser className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentTool('picker')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              currentTool === 'picker' ? 'bg-black text-white' : 'hover:bg-secondary'
            }`}
            title="吸管 (Picker)"
          >
            <Pipette className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentTool('fill')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              currentTool === 'fill' ? 'bg-black text-white' : 'hover:bg-secondary'
            }`}
            title="填充 (Fill)"
          >
            <PaintBucket className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentTool('mirror')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              currentTool === 'mirror' ? 'bg-black text-white' : 'hover:bg-secondary'
            }`}
            title="镜像 (Mirror)"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Mode Toggle */}
        <div className="h-14 bg-white border-b border-border flex items-center justify-center px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isEditMode ? 'bg-black text-white' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              查看模式
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditMode ? 'bg-black text-white' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <Edit3 className="w-4 h-4 inline mr-2" />
              编辑模式
            </button>
          </div>
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
      <div className="w-80 bg-white border-l border-border overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">调色板</h2>
          <div className="grid grid-cols-4 gap-2">
            {Array.from(colorPalette.values()).map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColorId(color.id)}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  selectedColorId === color.id ? 'border-black scale-110' : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color.hex }}
                title={`${color.id} - ${color.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
