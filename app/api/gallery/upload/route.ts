import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { saveWork } from "@/lib/gallery-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form fields
    const imageFile = formData.get("image") as File | null
    const title = formData.get("title") as string || "Untitled Work"
    const gridSize = parseInt(formData.get("gridSize") as string || "52")
    const colorCount = parseInt(formData.get("colorCount") as string || "30")
    const totalBeads = parseInt(formData.get("totalBeads") as string || "2704")
    const colorsJson = formData.get("colors") as string || "[]"

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Validate file type
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    const fileExtension = imageFile.name.split(".").pop() || "png"
    const filename = `work-${timestamp}-${random}.${fileExtension}`

    // Convert file to buffer
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save file to public/uploads/user-works/
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "user-works")
    await fs.mkdir(uploadsDir, { recursive: true })
    const filePath = path.join(uploadsDir, filename)
    await fs.writeFile(filePath, buffer)

    // Parse colors array
    let colors: string[] = []
    try {
      colors = JSON.parse(colorsJson)
    } catch {
      colors = []
    }

    // Save work metadata to database
    const work = await saveWork({
      title,
      imagePath: `/uploads/user-works/${filename}`,
      gridSize,
      colorCount,
      totalBeads,
      colors,
    })

    return NextResponse.json(
      {
        success: true,
        work,
        message: "Work uploaded successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { getAllWorks } = await import("@/lib/gallery-service")
    const works = await getAllWorks()
    return NextResponse.json({ works })
  } catch (error) {
    console.error("Fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch works" }, { status: 500 })
  }
}
