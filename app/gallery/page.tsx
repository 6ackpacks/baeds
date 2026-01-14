"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Upload, Loader, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { FadeIn, FloatingCard, ShinyButton } from "@/components/ui/magic-animations"

interface GalleryWork {
  id: string
  title: string
  imagePath: string
  gridSize: number
  colorCount: number
  totalBeads: number
  colors: string[]
  createdAt: string
}

export default function GalleryPage() {
  const router = useRouter()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [works, setWorks] = useState<GalleryWork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch gallery works on mount
  useEffect(() => {
    fetchWorks()
  }, [])

  const fetchWorks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/gallery/upload")
      if (response.ok) {
        const data = await response.json()
        setWorks(data.works || [])
      }
    } catch (error) {
      console.error("Failed to fetch gallery works:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      setUploadFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert("请选择文件并填写作品标题")
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("image", uploadFile)
      formData.append("title", uploadTitle)
      formData.append("gridSize", "52")
      formData.append("colorCount", "30")
      formData.append("totalBeads", "2704")
      formData.append("colors", JSON.stringify([]))

      const response = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setShowUploadModal(false)
        setUploadedImage(null)
        setUploadTitle("")
        setUploadFile(null)
        // Refresh the gallery
        await fetchWorks()

        // 触发事件通知首页刷新数据
        window.dispatchEvent(new CustomEvent('new-work-uploaded'))
      } else {
        alert("上传失败，请重试")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("上传出错，请重试")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent selection:text-white">
      {/* Background ambient blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[100px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-[80px] pointer-events-none" />

      {/* 导航栏 */}
      <header className="sticky top-0 z-50 transition-all duration-300 bg-brand-surface py-3 shadow-sm">
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-accentHover transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-brand-text">Bead Universe</h1>
              <p className="text-xs text-brand-textSoft">拼豆宇宙</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-black text-white hover:bg-brand-accent border border-transparent"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload className="w-4 h-4" />
            <span>上传作品</span>
          </motion.button>
        </div>
      </header>

      <main className="container mx-auto px-6 md:px-12 py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-brand-text mb-4">
              我的作品集
            </h2>
            <p className="text-gray-500">展示你完成的拼豆作品</p>
          </motion.div>
        </div>

        {/* 加载状态 */}
        {isLoading ? (
          <motion.div
            className="flex items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                <Loader className="w-8 h-8 mx-auto mb-4 text-brand-accent" />
              </motion.div>
              <p className="text-gray-600">加载作品中...</p>
            </div>
          </motion.div>
        ) : works.length === 0 ? (
          <motion.div className="text-center py-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <motion.div className="w-24 h-24 rounded-full bg-brand-accent/20 flex items-center justify-center mx-auto mb-6 border-2 border-brand-accent">
              <Upload className="w-12 h-12 text-brand-accent" />
            </motion.div>
            <h3 className="text-2xl font-light mb-2 text-brand-text">还没有作品</h3>
            <p className="text-gray-600 mb-8">上传你完成的拼豆作品，开始建立你的作品集</p>
            <motion.button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-brand-text text-white hover:bg-brand-accent hover:shadow-[0_4px_15px_rgba(45,212,191,0.4)] shadow-md border border-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="w-4 h-4" />
              <span>上传第一个作品</span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
          >
            {works.map((work, index) => (
              <motion.div
                key={work.id}
                className="group relative h-56 rounded-2xl overflow-hidden cursor-pointer bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-accent/30 transition-all duration-300 mb-6"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={work.imagePath}
                    alt={work.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <h4 className="text-white font-bold text-xl group-hover:translate-x-1 transition-transform">
                      {work.title}
                    </h4>
                    <p className="text-gray-200 text-xs mt-1">
                      {work.gridSize}×{work.gridSize} · {work.totalBeads} 珠
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

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
              <h2 className="text-2xl font-bold text-brand-text">上传作品</h2>
              <motion.button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadedImage(null)
                  setUploadTitle("")
                  setUploadFile(null)
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-brand-text"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                ✕
              </motion.button>
            </div>

            <div className="space-y-6">
              {/* 图片上传区域 */}
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
                      <h3 className="text-xl font-bold text-brand-text mb-2">上传作品照片</h3>
                      <p className="text-gray-600 text-sm">支持 JPG、PNG 格式</p>
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
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-black text-white hover:bg-brand-accent border border-transparent"
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
                <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div className="relative rounded-2xl overflow-hidden border-2 border-gray-200" whileHover={{ scale: 1.02 }}>
                    <img src={uploadedImage || "/placeholder.svg"} alt="上传预览" className="w-full h-auto" />
                    <motion.button
                      onClick={() => {
                        setUploadedImage(null)
                        setUploadFile(null)
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-colors text-brand-text"
                      whileHover={{ scale: 1.1 }}
                    >
                      ✕
                    </motion.button>
                  </motion.div>

                  {/* 标题输入 */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-brand-text">作品标题</label>
                    <motion.input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="给你的作品起个名字..."
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all text-brand-text"
                      whileFocus={{ scale: 1.02 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* 操作按钮 */}
              {uploadedImage && (
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => {
                      setShowUploadModal(false)
                      setUploadedImage(null)
                      setUploadTitle("")
                      setUploadFile(null)
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-transparent text-brand-text border border-gray-300 hover:border-brand-accent hover:text-brand-accent"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    onClick={handleUploadSubmit}
                    disabled={isUploading || !uploadTitle.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 text-sm md:text-base bg-black text-white hover:bg-brand-accent border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isUploading ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                          <Loader className="w-4 h-4" />
                        </motion.div>
                        发布中...
                      </>
                    ) : (
                      "发布作品"
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
