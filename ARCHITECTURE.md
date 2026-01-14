# 文件存储和数据库架构指南

## 🎯 架构概述

你的像素艺术生成器采用了**混合存储方案**：
- **发现页面图片**：静态文件（`public/discover/`）
- **用户上传作品**：动态存储（`public/uploads/user-works/` + JSON数据库）
- **元数据存储**：轻量级 JSON 数据库（`data/gallery-db.json`）

---

## 📂 文件目录结构

```
pixel-art-generator-2/
├── public/
│   ├── discover/                    # 发现页示例图片（静态）
│   │   ├── discover-1.png
│   │   ├── discover-2.png
│   │   └── ... (8 个示例)
│   │
│   └── uploads/
│       └── user-works/              # 用户上传的作品
│           ├── work-1704696000-abc123.png
│           ├── work-1704696050-def456.jpg
│           └── ... 更多用户作品
│
├── data/
│   └── gallery-db.json              # 作品元数据数据库（自动生成）
│
├── lib/
│   ├── pixel-converter.ts           # 像素艺术转换算法
│   └── gallery-service.ts           # 画廊数据服务 ✨ 新增
│
└── app/
    ├── api/
    │   └── gallery/
    │       └── upload/
    │           └── route.ts          # 上传接口 ✨ 新增
    │
    ├── page.tsx                      # 首页（发现页）
    ├── editor/[id]/page.tsx          # 编辑器
    └── gallery/page.tsx              # 作品集页（已更新）
```

---

## 🗂️ 1. 发现页面图片（Discovery Page）

### 位置
```
public/discover/discover-1.png
public/discover/discover-2.png
...
```

### 特点
- ✅ 静态文件，由 Next.js 直接提供
- ✅ 无需数据库，快速加载
- ✅ 可使用本地文件或外部 URL

### 如何添加示例图片

**步骤 1：准备图片**
- 格式：PNG 或 JPG
- 推荐尺寸：300×300px 或更大

**步骤 2：放入目录**
```bash
cp your-image.png public/discover/discover-1.png
```

**步骤 3：更新首页配置**

编辑 `app/page.tsx`，在约第150行找到示例数据：

```typescript
{[
  { id: 1, title: "可爱小兔", size: "32x32", image: "/discover/discover-1.png" },
  { id: 2, title: "像素城堡", size: "48x48", image: "/discover/discover-2.png" },
  // ... 更多
].map((item) => (
  // ...
  {item.image ? (
    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
  ) : (
    <div>{/* 默认占位符 */}</div>
  )}
))}
```

---

## 📤 2. 用户上传作品（User Uploads）

### 存储位置
```
public/uploads/user-works/work-1704696000-abc123.png  # 实际图片文件
data/gallery-db.json                                   # 元数据
```

### 工作流程

```
用户上传图片
    ↓
app/gallery/page.tsx (上传表单)
    ↓
POST /api/gallery/upload (API 端点)
    ↓
lib/gallery-service.ts (保存数据)
    ├─→ 保存图片文件到 public/uploads/user-works/
    └─→ 保存元数据到 data/gallery-db.json
    ↓
GET /api/gallery/upload (获取列表)
    ↓
app/gallery/page.tsx (显示作品)
```

### 数据库格式 (gallery-db.json)

```json
{
  "works": [
    {
      "id": "work-1704696000-abc123",
      "title": "我的梦幻城堡",
      "imagePath": "/uploads/user-works/work-1704696000-abc123.png",
      "gridSize": 52,
      "colorCount": 30,
      "totalBeads": 2704,
      "colors": ["A1", "A2", "B5", ...],
      "createdAt": "2024-01-08T10:00:00Z"
    },
    {
      "id": "work-1704696050-def456",
      "title": "樱花漫舞",
      "imagePath": "/uploads/user-works/work-1704696050-def456.jpg",
      "gridSize": 48,
      "colorCount": 25,
      "totalBeads": 2304,
      "colors": ["C1", "D5", "E10", ...],
      "createdAt": "2024-01-08T10:05:00Z"
    }
  ]
}
```

### API 端点

#### 上传作品
```bash
POST /api/gallery/upload

Content-Type: multipart/form-data
{
  "image": <File>,
  "title": "作品标题",
  "gridSize": 52,
  "colorCount": 30,
  "totalBeads": 2704,
  "colors": "["A1", "A2", "B5"]"  // JSON 字符串
}

响应:
{
  "success": true,
  "work": { ...GalleryWork },
  "message": "Work uploaded successfully"
}
```

#### 获取所有作品
```bash
GET /api/gallery/upload

响应:
{
  "works": [ ...GalleryWork[] ]
}
```

---

## 💾 3. 数据库决策

### 当前方案：JSON 文件存储

**优点：**
- ✅ 零配置，无需数据库服务器
- ✅ 完全免费
- ✅ 易于备份和版本控制
- ✅ 适合 MVP 和小型项目
- ✅ 容易迁移到真实数据库

**缺点：**
- ❌ 并发性有限（单文件锁定）
- ❌ 扩展性差（>1000 个文件时变慢）
- ❌ 不支持复杂查询
- ❌ 无身份验证/用户隔离

### 何时升级到真实数据库

建议在以下情况升级到 **PostgreSQL** 或 **MongoDB**：

| 场景 | JSON 文件 | 真实数据库 |
|------|---------|---------|
| 单个用户/小团队 | ✅ 足够 | 过度 |
| <100 个作品 | ✅ 足够 | 可选 |
| 多用户并发上传 | ❌ 不足 | ✅ 需要 |
| >1000 个作品 | ❌ 变慢 | ✅ 必需 |
| 需要用户账户系统 | ❌ 不支持 | ✅ 必需 |
| 需要复杂搜索/过滤 | ❌ 困难 | ✅ 容易 |

---

## 🔄 gallery-service.ts 使用说明

### 导入
```typescript
import {
  saveWork,
  getAllWorks,
  getWork,
  updateWork,
  deleteWork,
  type GalleryWork
} from "@/lib/gallery-service"
```

### 常用函数

**1. 保存新作品**
```typescript
const newWork = await saveWork({
  title: "我的作品",
  imagePath: "/uploads/user-works/work-123.png",
  gridSize: 52,
  colorCount: 30,
  totalBeads: 2704,
  colors: ["A1", "A2", "B5"]
})
// 返回: { id, createdAt, ...savedWork }
```

**2. 获取所有作品（按创建时间倒序）**
```typescript
const works = await getAllWorks()
// 返回: GalleryWork[]
```

**3. 获取单个作品**
```typescript
const work = await getWork("work-1704696000-abc123")
// 返回: GalleryWork | null
```

**4. 更新作品**
```typescript
const updated = await updateWork("work-id", {
  title: "新标题",
  // ... 其他可修改字段
})
// 返回: GalleryWork | null
```

**5. 删除作品**
```typescript
const deleted = await deleteWork("work-id")
// 返回: boolean
```

---

## 🌐 集成到编辑器（可选增强）

为了让用户直接从编辑器保存作品到画廊，可以在编辑器页面添加"保存到作品集"功能：

```typescript
// app/editor/[id]/page.tsx

const handleSaveToGallery = async () => {
  if (!pixelArtResult) return

  // 1. 导出为图片
  const canvas = exportPixelArtAsImage(pixelArtResult, 20, showGrid, true)

  // 2. 转换为 Blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png")
  })

  // 3. 上传到画廊
  const formData = new FormData()
  formData.append("image", blob, `pixel-art-${gridSize}x${gridSize}.png`)
  formData.append("title", "未命名作品")
  formData.append("gridSize", gridSize.toString())
  formData.append("colorCount", colorCount.toString())
  formData.append("totalBeads", pixelArtResult.totalBeads.toString())
  formData.append("colors", JSON.stringify(Array.from(pixelArtResult.colorPalette.keys())))

  const response = await fetch("/api/gallery/upload", {
    method: "POST",
    body: formData
  })

  if (response.ok) {
    alert("已保存到作品集！")
    router.push("/gallery")
  }
}
```

---

## 🛠️ 维护和管理

### 备份数据
```bash
# 备份元数据
cp data/gallery-db.json data/gallery-db.backup.json

# 备份所有上传的图片
cp -r public/uploads public/uploads.backup
```

### 清理旧文件
```typescript
// lib/cleanup-service.ts
export async function deleteOldWorks(daysOld: number) {
  const works = await getAllWorks()
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)

  for (const work of works) {
    if (new Date(work.createdAt) < cutoffDate) {
      // 删除文件
      await fs.unlink(path.join(process.cwd(), "public", work.imagePath))
      // 删除数据库记录
      await deleteWork(work.id)
    }
  }
}
```

### 导出数据
```typescript
// 导出为 CSV
export async function exportToCSV() {
  const works = await getAllWorks()
  let csv = "ID,标题,网格大小,珠数,创建时间\n"

  for (const work of works) {
    csv += `${work.id},"${work.title}",${work.gridSize}x${work.gridSize},${work.totalBeads},"${work.createdAt}"\n`
  }

  return csv
}
```

---

## 📊 性能建议

### 分页加载（推荐）
```typescript
// 不一次加载所有，而是分页
export async function getWorksPage(page: number, pageSize: number = 12) {
  const works = await getAllWorks()
  return works.slice(page * pageSize, (page + 1) * pageSize)
}
```

### 缩略图生成
```typescript
// 保存缩略图以加快画廊加载
formData.append("thumbnail", thumbnailBlob, "thumb.jpg")
```

### CDN/静态化
未来升级时，可将上传的图片迁移到：
- Vercel Blob 存储
- Cloudinary
- AWS S3
- 阿里云 OSS

---

## 🚀 下一步

1. **测试上传**：运行项目，尝试上传作品
2. **添加示例图片**：将示例图片放入 `public/discover/`
3. **美化UI**：优化画廊和编辑器的外观
4. **考虑用户系统**：如需多用户支持，升级到真实数据库 + 身份验证

---

## 📝 常见问题

**Q: 上传的文件存储在哪里？**
A: `public/uploads/user-works/` 目录，可通过 `/uploads/user-works/filename` URL 访问。

**Q: 如何限制上传文件大小？**
A: 在 `app/api/gallery/upload/route.ts` 中添加验证：
```typescript
if (buffer.length > 10 * 1024 * 1024) { // 10MB
  return NextResponse.json({ error: "文件过大" }, { status: 413 })
}
```

**Q: 数据库文件会变成什么样？**
A: 随着用户上传增加，`data/gallery-db.json` 会逐渐增大。定期备份是个好主意。

**Q: 如何迁移到 PostgreSQL？**
A: 安装 Prisma，创建 schema，使用迁移脚本转移现有数据。

**Q: 能删除用户上传的作品吗？**
A: 可以！在 gallery 页面添加删除按钮，调用 `deleteWork(id)` 即可。

---

## 📚 相关文件

- `lib/gallery-service.ts` - 核心服务层
- `app/api/gallery/upload/route.ts` - API 端点
- `app/gallery/page.tsx` - 前端界面
- `DISCOVER_PAGE_GUIDE.md` - 发现页面指南
