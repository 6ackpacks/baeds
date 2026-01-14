import fs from "fs/promises"
import path from "path"

export interface GalleryWork {
  id: string
  title: string
  imagePath: string
  gridSize: number
  colorCount: number
  totalBeads: number
  colors: string[]
  createdAt: string
  thumbnailPath?: string
}

export interface GalleryDatabase {
  works: GalleryWork[]
}

export interface PaginatedWorks {
  works: GalleryWork[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Path to the JSON database file
const DB_PATH = path.join(process.cwd(), "data", "gallery-db.json")

// Cache with TTL (5 minutes)
let cachedWorks: GalleryWork[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000

// Initialize database if it doesn't exist
async function ensureDatabase(): Promise<void> {
  try {
    await fs.access(DB_PATH)
  } catch {
    // Database doesn't exist, create it with empty structure
    const initialDb: GalleryDatabase = { works: [] }
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
    await fs.writeFile(DB_PATH, JSON.stringify(initialDb, null, 2))
  }
}

// Get sorted works with caching
async function getSortedWorks(): Promise<GalleryWork[]> {
  const now = Date.now()
  if (cachedWorks && now - cacheTimestamp < CACHE_TTL) {
    return cachedWorks
  }

  try {
    await ensureDatabase()
    const data = await fs.readFile(DB_PATH, "utf-8")
    const db: GalleryDatabase = JSON.parse(data)
    cachedWorks = db.works.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    cacheTimestamp = now
    return cachedWorks
  } catch (error) {
    console.error("Failed to read gallery database:", error)
    return []
  }
}

// Invalidate cache
function invalidateCache(): void {
  cachedWorks = null
  cacheTimestamp = 0
}

// Read all gallery works
export async function getAllWorks(): Promise<GalleryWork[]> {
  return getSortedWorks()
}

// Get paginated works
export async function getPaginatedWorks(page: number = 1, limit: number = 20): Promise<PaginatedWorks> {
  const works = await getSortedWorks()
  const total = works.length
  const offset = (page - 1) * limit
  const paginatedWorks = works.slice(offset, offset + limit)

  return {
    works: paginatedWorks,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  }
}

// Save a new work
export async function saveWork(work: Omit<GalleryWork, "id" | "createdAt">): Promise<GalleryWork> {
  try {
    await ensureDatabase()
    const data = await fs.readFile(DB_PATH, "utf-8")
    const db: GalleryDatabase = JSON.parse(data)

    // Generate unique ID (timestamp + random)
    const id = `work-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newWork: GalleryWork = {
      ...work,
      id,
      createdAt: new Date().toISOString(),
    }

    db.works.push(newWork)
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
    invalidateCache()

    return newWork
  } catch (error) {
    console.error("Failed to save gallery work:", error)
    throw error
  }
}

// Get a specific work by ID
export async function getWork(id: string): Promise<GalleryWork | null> {
  try {
    const works = await getAllWorks()
    return works.find((work) => work.id === id) || null
  } catch (error) {
    console.error("Failed to get gallery work:", error)
    return null
  }
}

// Delete a work
export async function deleteWork(id: string): Promise<boolean> {
  try {
    await ensureDatabase()
    const data = await fs.readFile(DB_PATH, "utf-8")
    const db: GalleryDatabase = JSON.parse(data)

    const initialLength = db.works.length
    db.works = db.works.filter((work) => work.id !== id)

    if (db.works.length < initialLength) {
      await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
      invalidateCache()
      return true
    }

    return false
  } catch (error) {
    console.error("Failed to delete gallery work:", error)
    return false
  }
}

// Update a work's metadata
export async function updateWork(id: string, updates: Partial<Omit<GalleryWork, "id" | "createdAt">>): Promise<GalleryWork | null> {
  try {
    await ensureDatabase()
    const data = await fs.readFile(DB_PATH, "utf-8")
    const db: GalleryDatabase = JSON.parse(data)

    const workIndex = db.works.findIndex((work) => work.id === id)
    if (workIndex === -1) return null

    const updatedWork = { ...db.works[workIndex], ...updates }
    db.works[workIndex] = updatedWork

    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2))
    invalidateCache()
    return updatedWork
  } catch (error) {
    console.error("Failed to update gallery work:", error)
    return null
  }
}
