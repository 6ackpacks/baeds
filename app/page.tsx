"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Upload, Sparkles, Heart, Eye, Trash2, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useImageUpload } from "@/hooks/useImageUpload"

export default function HomePage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [communityWorks, setCommunityWorks] = useState<any[]>([])
  const [isLoadingWorks, setIsLoadingWorks] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const { uploadedImage, setUploadedImage, fileInputRef, handleFileInput, handleFile } = useImageUpload()

  const handleUploadComplete = () => {
    if (uploadedImage) {
      localStorage.setItem("uploadedImage", uploadedImage)
      localStorage.setItem("gridSize", "52")
      localStorage.setItem("colorCount", "30")
      localStorage.setItem("colorComplexity", "70")
    }
    setShowUploadModal(false)
    router.push("/editor/custom")
  }

  // 删除作品
  const handleDeleteWork = async (workId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("确定要删除这个作品吗？")) {
      return
    }

    try {
      setDeletingId(workId)

      // 调用删除 API
      const response = await fetch(`/api/gallery/upload/${workId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // 从本地状态中移除该作品
        setCommunityWorks(prev => prev.filter(work => work.id !== workId))

        // 刷新作品列表
        const response = await fetch("/api/gallery/upload")
        if (response.ok) {
          const data = await response.json()
          const latestWorks = data.works?.slice(0, 60) || []
          setCommunityWorks(latestWorks)
        }
      } else {
        console.error("Delete failed:", await response.text())
        alert("删除失败，请重试")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("删除出错，请重试")
    } finally {
      setDeletingId(null)
    }
  }

  // 获取社区作品（只显示在画廊页面上传的作品，最多60个）
  useEffect(() => {
    let isMounted = true

    const fetchCommunityWorks = async () => {
      try {
        setIsLoadingWorks(true)
        console.log("Fetching community works...")
        const response = await fetch("/api/gallery/upload")
        if (!isMounted) return

        if (response.ok) {
          const data = await response.json()
          if (!isMounted) return

          console.log("API response:", data)
          const allWorks = data.works || []
          console.log("Total works from API:", allWorks.length)

          const processedWorks = allWorks.map((work: any) => ({
            ...work,
            author: work.author || "创作者"
          }))

          const latestWorks = processedWorks.slice(0, 60)
          console.log("Setting community works:", latestWorks)
          setCommunityWorks(latestWorks)
        } else {
          console.error("API response error:", response.status, response.statusText)
        }
      } catch (error) {
        if (!isMounted) return
        console.error("Failed to fetch community works:", error)
        const demoWorks = [
          {
            id: "demo-1",
            title: "示例作品 1",
            imagePath: "/discover/星空之梦.png",
            createdAt: new Date().toISOString(),
            gridSize: 64,
            author: "艺术家小明"
          },
          {
            id: "demo-2",
            title: "示例作品 2",
            imagePath: "/discover/彩虹天使.png",
            createdAt: new Date().toISOString(),
            gridSize: 48,
            author: "创意设计师"
          }
        ]
        console.log("Using demo works:", demoWorks)
        setCommunityWorks(demoWorks)
      } finally {
        if (isMounted) {
          setIsLoadingWorks(false)
        }
      }
    }

    fetchCommunityWorks()

    const handleNewWorkUploaded = () => {
      if (isMounted) {
        fetchCommunityWorks()
      }
    }

    window.addEventListener('new-work-uploaded', handleNewWorkUploaded)

    return () => {
      isMounted = false
      window.removeEventListener('new-work-uploaded', handleNewWorkUploaded)
    }
  }, [])

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent selection:text-white">
      {/* Background ambient blobs (Light Theme) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[100px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-[80px] pointer-events-none" />
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 transition-all duration-300 bg-brand-surface py-3 md:py-5">
        <div className="container mx-auto px-4 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-accent rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="md:w-6 md:h-6">
                    <circle cx="12" cy="12" r="8" fill="white" opacity="0.9"/>
                    <circle cx="8" cy="10" r="2" fill="#2dd4bf"/>
                    <circle cx="16" cy="10" r="2" fill="#2dd4bf"/>
                    <path d="M 8 16 Q 12 18 16 16" stroke="#2dd4bf" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-brand-text font-bold text-sm md:text-lg leading-tight tracking-tight">Bead Universe</span>
                <span className="text-brand-textSoft text-[10px] md:text-xs font-medium">拼豆宇宙</span>
              </div>
            </div>

            {/* Desktop Create Button */}
            <div className="hidden md:block">
              <motion.button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-black text-white hover:bg-brand-accent border border-transparent"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>创建</span>
                <span className="text-xl font-bold">+</span>
              </motion.button>
            </div>
          </div>

          {/* Mobile Create Button */}
          <div className="flex md:hidden">
            <motion.button
              onClick={() => setShowUploadModal(true)}
              className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-xl font-bold">+</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-12 flex-grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center py-8 md:py-0">

          {/* Left Column: Text & CTAs */}
          <div className="space-y-4 md:space-y-8 z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-brand-accentHover text-xs font-bold mb-4 md:mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"/>
                AI 驱动的拼豆设计工具
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-brand-text tracking-tight font-sans">
                Bead Universe <br />
                <span className="text-brand-accent">拼豆宇宙</span>
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-gray-500 mt-3 md:mt-4">
                 AI 灵感，指尖像素
              </h2>
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-400 mt-1 uppercase tracking-widest">
                AI Inspiration, Fingertip Pixels
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-lg mt-4 md:mt-6 leading-relaxed">
                上传图片，一键生成精美拼豆图纸。在这里，每一个像素都承载着无限创意。加入我们，开始你的创作之旅。
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 md:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-black text-white hover:bg-brand-accent border border-transparent"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload className="w-4 h-4" />
                <span>上传图片</span>
              </motion.button>

              <motion.button
                onClick={() => {
                  const discoverSection = document.getElementById("discover-section")
                  if (discoverSection) {
                    discoverSection.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-white text-black border border-gray-300 hover:bg-brand-accent hover:border-transparent"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-4 h-4" />
                <span>查看灵感</span>
              </motion.button>
            </motion.div>

            {/* Discovery Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={() => {
                  const discoverSection = document.getElementById("discover-section")
                  if (discoverSection) {
                    discoverSection.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className="group flex items-center gap-2 text-sm text-gray-500 hover:text-brand-accentHover transition-colors mt-4"
              >
                <span>发现 创意豆坊</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </button>
            </motion.div>
          </div>

          {/* Right Column: Animated Image */}
          <motion.div
            className="flex justify-center items-center relative mt-4 lg:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
             <motion.div
               className="w-[280px] h-[350px] sm:w-[380px] sm:h-[480px] md:w-[480px] md:h-[600px] cursor-pointer relative"
               onClick={() => setShowUploadModal(true)}
               whileHover={{ scale: 1.02 }}
               onMouseEnter={() => setIsHovered(true)}
               onMouseLeave={() => setIsHovered(false)}
             >
               {/* Main image with floating animation */}
               <motion.img
                 src="/unnamed-removebg-preview (1).png"
                 alt="Bead Art"
                 className="w-full h-full object-cover drop-shadow-lg"
                 animate={{
                   y: [0, -5, 0],
                 }}
                 transition={{
                   duration: 4,
                   repeat: Infinity,
                   ease: "easeInOut"
                 }}
                 whileHover={{
                   scale: 1.02,
                   transition: { duration: 0.3 }
                 }}
               />

               {/* Floating sparkle effects */}
               {isHovered && (
                 <>
                   <motion.div
                     className="absolute top-4 left-4 text-yellow-400"
                     animate={{
                       scale: [0, 1.5, 0],
                       opacity: [0, 1, 0],
                     }}
                     transition={{
                       duration: 2,
                       repeat: Infinity,
                       delay: 0
                     }}
                   >
                     ✨
                   </motion.div>
                   <motion.div
                     className="absolute top-8 right-8 text-pink-400"
                     animate={{
                       scale: [0, 1.5, 0],
                       opacity: [0, 1, 0],
                     }}
                     transition={{
                       duration: 2,
                       repeat: Infinity,
                       delay: 0.5
                     }}
                   >
                     ✨
                   </motion.div>
                   <motion.div
                     className="absolute bottom-6 left-8 text-purple-400"
                     animate={{
                       scale: [0, 1.5, 0],
                       opacity: [0, 1, 0],
                     }}
                     transition={{
                       duration: 2,
                       repeat: Infinity,
                       delay: 1
                     }}
                   >
                     ✨
                   </motion.div>
                 </>
               )}
             </motion.div>
          </motion.div>
        </div>

        {/* Discover Gallery Section - 创意豆坊 */}
        <motion.section
          id="discover-section"
          className="py-12 md:py-20 mt-12 md:mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="container mx-auto px-4 md:px-12">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-text mb-3 md:mb-4">
                创意豆坊
              </h2>
              <p className="text-base md:text-xl text-gray-600">发现精美的像素艺术作品，获取创作灵感</p>
            </div>

            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
            >
              {[
                {
                  id: "discover-1",
                  title: "可爱小兔",
                  size: "48x48",
                  imageUrl: "/discover/拿瓜动作@1x.png"
                },
                {
                  id: "discover-2",
                  title: "彩虹天使",
                  size: "48x48",
                  imageUrl: "/discover/image@1x.png"
                },
                {
                  id: "discover-3",
                  title: "魔法樱花",
                  size: "48x48",
                  imageUrl: "/discover/image (1).png"
                },
                {
                  id: "discover-4",
                  title: "星空之梦",
                  size: "48x48",
                  imageUrl: "/discover/image_美图抠图10-29-2025@1x.png"
                },
                {
                  id: "discover-5",
                  title: "甜蜜糖果",
                  size: "48x48",
                  imageUrl: "/discover/image_美图抠图10-29-2025 (2)@1x.png"
                },
                {
                  id: "discover-6",
                  title: "梦幻精灵",
                  size: "48x48",
                  imageUrl: "/discover/image_美图抠图10-29-2025 (2)@1x (1).png"
                },
                {
                  id: "discover-7",
                  title: "缤纷色彩",
                  size: "48x48",
                  imageUrl: "/discover/_美图抠图20251029@1x.png"
                },
                {
                  id: "discover-8",
                  title: "创意组合",
                  size: "48x48",
                  imageUrl: "/discover/组 759@1x.png"
                }
              ].map((item) => (
                <motion.div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:border-brand-accent/30 transition-all duration-300 cursor-pointer"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                  }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    // 存储当前图片信息到localStorage
                    localStorage.setItem("discoverImage", item.imageUrl)
                    localStorage.setItem("discoverId", item.id)
                    localStorage.setItem("discoverTitle", item.title)
                    router.push(`/editor/${item.id}`)
                  }}
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-[180px] sm:h-[240px] md:h-[300px] object-cover transition-all duration-700 group-hover:scale-110"
                    />

                    {/* Hover Overlay with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

                    {/* Size Badge with hover effect */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full transform scale-100 group-hover:scale-110 transition-all duration-300">
                      <span className="text-xs font-bold text-gray-700">{item.size}</span>
                    </div>

                    {/* Hover overlay with blur effect */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <div className="relative z-10">
                      <motion.h3
                        className="text-white font-bold text-lg mb-2 transition-transform duration-300 group-hover:-translate-y-1"
                      >
                        {item.title}
                      </motion.h3>

                      {/* Hover Actions with enhanced animation */}
                      <motion.div
                        className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-500"
                      >
                        <div className="flex gap-2 mb-20 backdrop-blur-sm bg-black/50 rounded-full p-1">
                          <motion.button
                            className="w-10 h-10 rounded-full bg-brand-accent text-white flex items-center justify-center hover:bg-brand-accentHover"
                            whileHover={{ scale: 1.2, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <span className="text-lg">♥</span>
                          </motion.button>
                          <motion.button
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-100"
                            whileHover={{ scale: 1.2, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <span className="text-lg">🔍</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100 text-center text-gray-500 text-sm">
        <div className="container mx-auto px-6">
          <div className="flex justify-center items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded bg-brand-accent flex items-center justify-center text-white font-bold text-xs">B</span>
            <span className="text-brand-text font-semibold">Bead Universe</span>
          </div>
          <p>© 2024 Bead Universe 拼豆宇宙. All rights reserved.</p>
        </div>
      </footer>

      {/* 上传模态框 */}
      {showUploadModal && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3xl border-2 border-gray-200 max-w-2xl w-full p-8 shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-brand-text">上传你的图片</h2>
              <motion.button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-brand-text text-xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                ✕
              </motion.button>
            </div>

            {!uploadedImage ? (
              <motion.div
                className="border-4 border-dashed border-brand-accent rounded-2xl p-12 text-center"
                whileHover={{ backgroundColor: "rgba(45,212,191,0.05)" }}
              >
                <div className="flex flex-col items-center gap-6">
                  <motion.div
                    className="w-24 h-24 rounded-full bg-brand-accent flex items-center justify-center"
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Upload className="w-12 h-12 text-white" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold text-brand-text mb-2">上传你的图片</h3>
                    <p className="text-gray-600 text-sm">支持 JPG、PNG 格式，最大 100MB</p>
                  </div>

                  <label className="cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileInput}
                    />
                    <motion.button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-black text-white hover:bg-brand-accent border border-transparent"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Upload className="w-4 h-4" />
                      <span>选择文件</span>
                    </motion.button>
                  </label>
                </div>
              </motion.div>
            ) : (
              <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div className="relative rounded-2xl overflow-hidden border-2 border-gray-200" whileHover={{ scale: 1.02 }}>
                  <img src={uploadedImage} alt="上传预览" className="w-full h-auto" />
                </motion.div>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setUploadedImage(null)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-transparent text-brand-text border border-gray-300 hover:border-brand-accent hover:text-brand-accentHover"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    重新选择
                  </motion.button>
                  <motion.button
                    onClick={handleUploadComplete}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-black text-white hover:bg-brand-accent border border-transparent"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Upload className="w-4 h-4" />
                    <span>生成图案</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
