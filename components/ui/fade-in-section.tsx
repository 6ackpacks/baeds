"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface FadeInSectionProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
  direction?: "up" | "down" | "left" | "right"
}

export function FadeInSection({
  children,
  delay = 0,
  duration = 0.6,
  className = "",
  direction = "up"
}: FadeInSectionProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 40, opacity: 0 }
      case "down":
        return { y: -40, opacity: 0 }
      case "left":
        return { x: 40, opacity: 0 }
      case "right":
        return { x: -40, opacity: 0 }
      default:
        return { y: 40, opacity: 0 }
    }
  }

  const getFinalPosition = () => {
    switch (direction) {
      case "up":
      case "down":
        return { y: 0, opacity: 1 }
      case "left":
      case "right":
        return { x: 0, opacity: 1 }
      default:
        return { y: 0, opacity: 1 }
    }
  }

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={getFinalPosition()}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}