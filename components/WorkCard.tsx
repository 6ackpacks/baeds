import React from "react"
import { Heart } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

interface WorkCardProps {
  work: {
    id: string
    title: string
    imagePath: string
    gridSize: number
  }
  onDelete: (workId: string, e: React.MouseEvent) => void
  isDeletingId: string | null
}

const WorkCard = React.memo(({ work, onDelete, isDeletingId }: WorkCardProps) => {
  const router = useRouter()

  return (
    <motion.div
      key={work.id}
      className="group relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-brand-accent/30 transition-all duration-300 cursor-pointer"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
      whileHover={{ scale: 1.02 }}
      onClick={() => {
        localStorage.setItem("discoverImage", work.imagePath)
        localStorage.setItem("discoverId", work.id)
        localStorage.setItem("discoverTitle", work.title)
        router.push(`/editor/${work.id}`)
      }}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <img
          src={work.imagePath}
          alt={work.title}
          className="w-full h-[280px] object-cover transition-all duration-700 group-hover:scale-110"
          onError={(e) => {
            console.log("Image load error:", work.imagePath)
            e.currentTarget.src = "/placeholder.jpg"
          }}
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

        {/* Size Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full transform scale-100 group-hover:scale-110 transition-all duration-300">
          <span className="text-xs font-bold text-gray-700">{work.gridSize}x{work.gridSize}</span>
        </div>

        {/* Author badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-xs text-white font-medium">用户作品</span>
        </div>

        {/* Likes badge */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
          <Heart className="w-3 h-3 text-red-500" />
          <span className="text-xs font-bold text-gray-700">{Math.floor(Math.random() * 500) + 50}</span>
        </div>

        {/* Hover overlay with blur */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-4 w-full">
        <div className="relative z-10">
          <motion.h3 className="text-white font-bold text-lg mb-2 transition-transform duration-300 group-hover:-translate-y-1">
            {work.title}
          </motion.h3>
        </div>
      </div>
    </motion.div>
  )
})

WorkCard.displayName = "WorkCard"

export default WorkCard
