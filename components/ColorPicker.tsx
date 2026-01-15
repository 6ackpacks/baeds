"use client"

import { useState, useRef, useEffect } from "react"

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
  recentColors?: string[]
}

export default function ColorPicker({ selectedColor, onColorChange, recentColors = [] }: ColorPickerProps) {
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [lightness, setLightness] = useState(50)
  const [hexInput, setHexInput] = useState(selectedColor)
  const gradientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHexInput(selectedColor)
  }, [selectedColor])

  const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gradientRef.current) return
    const rect = gradientRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newSaturation = (x / rect.width) * 100
    const newLightness = 100 - (y / rect.height) * 100
    setSaturation(newSaturation)
    setLightness(newLightness)
    updateColor(hue, newSaturation, newLightness)
  }

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value)
    setHue(newHue)
    updateColor(newHue, saturation, lightness)
  }

  const updateColor = (h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l)
    setHexInput(hex)
    onColorChange(hex)
  }

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHexInput(value)
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onColorChange(value)
      const { h, s, l } = hexToHsl(value)
      setHue(h)
      setSaturation(s)
      setLightness(l)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">颜色</h2>
      </div>

      {/* 2D Gradient Picker */}
      <div
        ref={gradientRef}
        onClick={handleGradientClick}
        className="w-full h-48 rounded-lg cursor-crosshair mb-4 relative"
        style={{
          background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`
        }}
      >
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
          style={{
            left: `${saturation}%`,
            top: `${100 - lightness}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {/* Hue Slider */}
      <input
        type="range"
        min="0"
        max="360"
        value={hue}
        onChange={handleHueChange}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer mb-4"
        style={{
          background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
        }}
      />

      {/* Hex Input */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-10 h-10 rounded border-2 border-gray-300 flex-shrink-0"
          style={{ backgroundColor: selectedColor }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInput}
          className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 font-mono text-sm"
          placeholder="#000000"
        />
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">最近使用</h3>
          <div className="grid grid-cols-8 gap-2">
            {recentColors.map((color, index) => (
              <button
                key={index}
                onClick={() => onColorChange(color)}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100
  const a = s * Math.min(l, 1 - l) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}
