import { NextRequest, NextResponse } from "next/server"
import { deleteWork } from "@/lib/gallery-service"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const success = await deleteWork(id)

    if (success) {
      return NextResponse.json(
        { success: true, message: "Work deleted successfully" },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: "Work not found" },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    )
  }
}