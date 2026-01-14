import { ReactNode } from "react"

interface AnimatedGradientProps {
  children?: ReactNode
  className?: string
}

/**
 * 渐变背景动画组件
 * 创建流动的渐变背景效果
 */
export function AnimatedGradient({ children, className = "" }: AnimatedGradientProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 动画渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 animate-gradient" />

      {/* 第二层渐变用于更丰富的效果 */}
      <div className="absolute inset-0 bg-gradient-to-tl from-blue-400 via-purple-400 to-pink-400 animate-gradient-reverse opacity-30" />

      {/* 内容层 */}
      <div className="relative z-10">{children}</div>

      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes gradient-reverse {
          0%,
          100% {
            background-position: 100% 50%;
          }
          50% {
            background-position: 0% 50%;
          }
        }

        :global(.animate-gradient) {
          background-size: 200% 200%;
          animation: gradient 6s ease infinite;
        }

        :global(.animate-gradient-reverse) {
          background-size: 200% 200%;
          animation: gradient-reverse 8s ease infinite;
        }
      `}</style>
    </div>
  )
}
