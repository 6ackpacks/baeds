"use client"

import { useState } from "react"

interface UsedColorsPaletteProps {
  colorPalette: Map<string, { id: string; name: string; hex: string }>
  selectedColor: string
  onColorSelect: (color: string) => void
  onOpenFullPalette: () => void
}

export default function UsedColorsPalette({
  colorPalette,
  selectedColor,
  onColorSelect,
  onOpenFullPalette,
}: UsedColorsPaletteProps) {
  const colors = Array.from(colorPalette.values())

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">完整色板编辑</span>
        <button
          onClick={onOpenFullPalette}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          全部色板
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => onColorSelect(color.hex)}
            className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
              selectedColor === color.hex
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-300"
            }`}
            style={{ backgroundColor: color.hex }}
            title={color.id}
          />
        ))}
      </div>

      {selectedColor && (
        <div className="mt-2 text-xs text-gray-600">
          当前: {colorPalette.get(selectedColor)?.id || "自定义"}
        </div>
      )}
    </div>
  )
}
