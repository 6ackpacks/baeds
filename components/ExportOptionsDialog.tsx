"use client"

import { useState } from "react"
import { X } from "lucide-react"

export interface ExportOptions {
  showGrid: boolean
  gridInterval: number
  showCoordinates: boolean
  showColorCodes: boolean
  gridLineColor: string
  ignoreBackground: boolean
}

interface ExportOptionsDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: ExportOptions) => void
}

export default function ExportOptionsDialog({
  isOpen,
  onClose,
  onExport,
}: ExportOptionsDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    showGrid: true,
    gridInterval: 10,
    showCoordinates: true,
    showColorCodes: true,
    gridLineColor: "#000000",
    ignoreBackground: true,
  })

  if (!isOpen) return null

  const handleExport = () => {
    onExport(options)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">导出选项</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Show Grid */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">显示网格线</label>
            <input
              type="checkbox"
              checked={options.showGrid}
              onChange={(e) => setOptions({ ...options, showGrid: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          {/* Grid Interval */}
          {options.showGrid && (
            <div>
              <label className="text-sm font-medium mb-2 block">网格间隔</label>
              <input
                type="number"
                min="1"
                max="50"
                value={options.gridInterval}
                onChange={(e) => setOptions({ ...options, gridInterval: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          )}

          {/* Grid Line Color */}
          {options.showGrid && (
            <div>
              <label className="text-sm font-medium mb-2 block">网格线颜色</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={options.gridLineColor}
                  onChange={(e) => setOptions({ ...options, gridLineColor: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={options.gridLineColor}
                  onChange={(e) => setOptions({ ...options, gridLineColor: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 font-mono"
                />
              </div>
            </div>
          )}

          {/* Show Coordinates */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">显示坐标</label>
            <input
              type="checkbox"
              checked={options.showCoordinates}
              onChange={(e) => setOptions({ ...options, showCoordinates: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          {/* Show Color Codes */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">显示色号材料</label>
            <input
              type="checkbox"
              checked={options.showColorCodes}
              onChange={(e) => setOptions({ ...options, showColorCodes: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          {/* Ignore Background */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">自动忽略外部背景</label>
            <input
              type="checkbox"
              checked={options.ignoreBackground}
              onChange={(e) => setOptions({ ...options, ignoreBackground: e.target.checked })}
              className="w-4 h-4"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            导出
          </button>
        </div>
      </div>
    </div>
  )
}
