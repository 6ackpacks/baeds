"use client"

import { motion } from "framer-motion"
import { useState, useRef } from "react"

interface DraggableBeadsProps {
  onDrag?: (bead: string, position: { x: number; y: number }) => void
}

export function DraggableBeads({ onDrag }: DraggableBeadsProps) {
  const [draggingBead, setDraggingBead] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const beadColors = [
    { color: "#FF5252", name: "red" },
    { color: "#2196F3", name: "blue" },
    { color: "#FFD700", name: "yellow" },
    { color: "#4CAF50", name: "green" },
    { color: "#FF9800", name: "orange" },
    { color: "#9C27B0", name: "purple" },
    { color: "#E91E63", name: "pink" },
    { color: "#00BCD4", name: "cyan" },
    { color: "#795548", name: "brown" },
    { color: "#607D8B", name: "gray" }
  ]

  const handleDragStart = (beadName: string, e: React.DragEvent) => {
    setDraggingBead(beadName)
    e.dataTransfer.setData("text/plain", beadName)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const beadName = e.dataTransfer.getData("text/plain")

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      onDrag?.(beadName, { x, y })
    }

    setDraggingBead(null)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* 调色板 */}
      <motion.div
        className="flex flex-wrap gap-3 p-4 bg-white rounded-2xl border-2 border-gray-300 shadow-lg"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {beadColors.map((bead) => (
          <motion.div
            key={bead.name}
            className="cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => handleDragStart(bead.name, e)}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileDrag={{ scale: 1.2, zIndex: 50 }}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={0.2}
          >
            <div
              className="w-10 h-10 rounded-full shadow-md"
              style={{ backgroundColor: bead.color }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* 拼豆板区域 */}
      <div
        ref={containerRef}
        className="relative w-96 h-64 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-400 overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* 网格背景 */}
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ccc" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* 已放置的珠子 */}
        {/* 这里可以添加状态来跟踪已放置的珠子 */}

        {/* 拖拽提示 */}
        {draggingBead && (
          <motion.div
            className="absolute pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-10 h-10 rounded-full shadow-lg scale-110" style={{
              backgroundColor: beadColors.find(b => b.name === draggingBead)?.color
            }} />
          </motion.div>
        )}

        {/* 放置提示文字 */}
        {!draggingBead && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <p>将珠子拖拽到这里开始创作</p>
          </div>
        )}
      </div>

      {/* 说明文字 */}
      <motion.p
        className="text-sm text-gray-600 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        从调色板中选择珠子，拖拽到拼豆板上创作你的像素艺术
      </motion.p>
    </div>
  )
}