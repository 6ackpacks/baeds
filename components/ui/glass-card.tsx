"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function GlassCard({ children, className = "", hover = true, onClick }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl",
        "shadow-lg overflow-hidden",
        hover && "hover:shadow-xl hover:border-white/30",
        onClick && "cursor-pointer",
        className
      )}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  )
}