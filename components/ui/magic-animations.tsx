import { motion } from "framer-motion"
import { ReactNode } from "react"

interface FloatingCardProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * 浮动卡片组件（MagicUI 风格）
 * 创建悬停浮动动画效果
 */
export function FloatingCard({ children, delay = 0, className = "" }: FloatingCardProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-10, 10, -10] }}
      transition={{
        duration: 3,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface PulseButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

/**
 * 脉冲按钮组件
 * 创建吸引注意力的脉冲效果
 */
export function PulseButton({ children, onClick, className = "" }: PulseButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={className}
    >
      <motion.div
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full bg-white opacity-30"
      />
      <div className="relative">{children}</div>
    </motion.button>
  )
}

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

/**
 * 淡入动画组件
 * 在元素首次出现时应用淡入效果
 */
export function FadeIn({ children, delay = 0, duration = 0.5, className = "" }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  staggerDelay?: number
  className?: string
}

/**
 * 交错容器组件
 * 为子元素创建交错动画效果
 */
export function StaggerContainer({ children, staggerDelay = 0.1, className = "" }: StaggerContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={className}>
      {Array.isArray(children) ? (
        children.map((child, i) => (
          <motion.div key={i} variants={itemVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={itemVariants}>{children}</motion.div>
      )}
    </motion.div>
  )
}

interface ShinyButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

/**
 * 闪光按钮组件（MagicUI 风格）
 * 创建光线划过效果
 */
export function ShinyButton({ children, onClick, className = "", disabled = false }: ShinyButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`relative overflow-hidden ${className}`}
    >
      {/* 闪光效果 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div className="relative">{children}</div>
    </motion.button>
  )
}

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * 揭示动画组件
 * 从边界向内展开的动画效果
 */
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  return (
    <motion.div
      initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" }}
      animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
