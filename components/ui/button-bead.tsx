"use client"

import React from "react"
import { motion } from "framer-motion"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost"
  children: React.ReactNode
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", children, className = "", icon, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base"

    const variants = {
      // Primary: Black background -> Teal Hover in light theme
      primary:
        "bg-brand-text text-white hover:bg-brand-accent hover:shadow-[0_4px_15px_rgba(45,212,191,0.4)] shadow-md border border-transparent",
      // Outline: Gray Border -> Black text
      outline:
        "bg-transparent text-brand-text border border-gray-300 hover:border-brand-accent hover:text-brand-accentHover",
      ghost: "text-gray-500 hover:text-brand-text",
    }

    return (
      <motion.button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        {...props}
      >
        {children}
        {icon && <span className="w-4 h-4">{icon}</span>}
      </motion.button>
    )
  }
)

Button.displayName = "Button"

export default Button
