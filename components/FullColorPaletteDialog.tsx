"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, ChevronRight } from "lucide-react"

interface FullColorPaletteDialogProps {
  isOpen: boolean
  onClose: () => void
  onColorSelect: (color: string) => void
  selectedColor: string
}

export default function FullColorPaletteDialog({
  isOpen,
  onClose,
  onColorSelect,
  selectedColor,
}: FullColorPaletteDialogProps) {
  const [colorData, setColorData] = useState<Record<string, { MARD: string }>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set(['A', 'B', 'C']))

  useEffect(() => {
    if (isOpen) {
      fetch('/color.json')
        .then(res => res.json())
        .then(data => setColorData(data))
        .catch(err => console.error('Failed to load colors:', err))
    }
  }, [isOpen])

  if (!isOpen) return null

  // Group colors by series (A, B, C, D, etc.)
  const colorsBySeries: Record<string, Array<[string, { MARD: string }]>> = {}
  Object.entries(colorData).forEach(([hex, codes]) => {
    const series = codes.MARD.match(/^[A-Z]+/)?.[0] || 'Other'
    if (!colorsBySeries[series]) {
      colorsBySeries[series] = []
    }
    colorsBySeries[series].push([hex, codes])
  })

  // Sort series alphabetically
  const sortedSeries = Object.keys(colorsBySeries).sort()

  // Filter colors based on search
  const filteredSeries = sortedSeries.reduce((acc, series) => {
    const filtered = colorsBySeries[series].filter(([hex, codes]) =>
      codes.MARD.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hex.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filtered.length > 0) {
      acc[series] = filtered
    }
    return acc
  }, {} as Record<string, Array<[string, { MARD: string }]>>)

  const toggleSeries = (series: string) => {
    const newExpanded = new Set(expandedSeries)
    if (newExpanded.has(series)) {
      newExpanded.delete(series)
    } else {
      newExpanded.add(series)
    }
    setExpandedSeries(newExpanded)
  }

  const totalColors = Object.values(filteredSeries).reduce((sum, colors) => sum + colors.length, 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">MARD 色板</h2>
            <input
              type="text"
              placeholder="搜索色号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(filteredSeries).length === 0 ? (
            <div className="text-center text-gray-500 py-8">未找到匹配的颜色</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(filteredSeries).map(([series, colors]) => (
                <div key={series} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSeries(series)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium">
                      {series} 系列 ({colors.length})
                    </span>
                    {expandedSeries.has(series) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  {expandedSeries.has(series) && (
                    <div className="p-3 grid grid-cols-8 gap-2">
                      {colors.map(([hex, codes]) => (
                        <button
                          key={hex}
                          onClick={() => {
                            onColorSelect(hex)
                            onClose()
                          }}
                          className={`relative group aspect-square rounded border-2 transition-all hover:scale-110 ${
                            selectedColor === hex ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
                          }`}
                          style={{ backgroundColor: hex }}
                          title={`${codes.MARD} - ${hex}`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded text-white text-xs font-bold">
                            {codes.MARD}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          共 {totalColors} 个颜色
        </div>
      </div>
    </div>
  )
}
