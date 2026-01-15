"use client"

import { useState, useEffect } from "react"

interface MardColorPaletteProps {
  selectedColor: string
  onColorChange: (color: string) => void
}

export default function MardColorPalette({ selectedColor, onColorChange }: MardColorPaletteProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [colorData, setColorData] = useState<Record<string, { MARD: string; COCO: string }>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load color data on mount
  useEffect(() => {
    fetch('/color.json')
      .then(res => res.json())
      .then(data => {
        setColorData(data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to load color data:', err)
        setIsLoading(false)
      })
  }, [])

  // Convert color data to array format
  const colors = Object.entries(colorData).map(([hex, codes]) => ({
    hex,
    mardCode: codes.MARD,
    cocoCode: codes.COCO,
  }))

  // Filter colors based on search
  const filteredColors = colors.filter(
    (color) =>
      color.mardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      color.hex.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-gray-500">加载色板中...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">MARD 色板</h2>
        <input
          type="text"
          placeholder="搜索色号..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-black focus:outline-none"
        />
      </div>

      {/* Selected Color Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded border-2 border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <p className="text-sm font-medium">
              {colorData[selectedColor]?.MARD || "自定义"}
            </p>
            <p className="text-xs text-gray-500">{selectedColor}</p>
          </div>
        </div>
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto">
        {filteredColors.map((color) => (
          <button
            key={color.hex}
            onClick={() => onColorChange(color.hex)}
            className={`relative group ${
              selectedColor === color.hex ? "ring-2 ring-black" : ""
            }`}
            title={`${color.mardCode} - ${color.hex}`}
          >
            <div
              className="w-full aspect-square rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color.hex }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded text-white text-xs font-bold">
              {color.mardCode}
            </div>
          </button>
        ))}
      </div>

      {filteredColors.length === 0 && (
        <p className="text-center text-gray-500 text-sm mt-4">未找到匹配的颜色</p>
      )}
    </div>
  )
}
