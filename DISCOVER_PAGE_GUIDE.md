# 发现页图片添加指南

## 如何为发现页（创意豆坊）添加示例图片

### 第一步：准备你的图片

1. 准备PNG或JPG格式的图片，推荐尺寸：**300×300px 或更大**
2. 图片应该是已经转换好的像素艺术或拼豆作品效果图

### 第二步：上传图片文件

1. 将你的图片文件放在项目目录中：
   ```
   pixel-art-generator-2/public/discover/
   ```
   （如果没有 `discover` 文件夹，请自己创建）

2. 建议的文件命名规范：
   ```
   discover-1.png
   discover-2.png
   discover-3.jpg
   等等...
   ```

### 第三步：修改首页配置

编辑文件：`app/page.tsx`

找到这段代码（大约在第141-180行）：
```typescript
{[
  { id: 1, title: "可爱小兔", size: "32x32" },
  { id: 2, title: "像素城堡", size: "48x48" },
  { id: 3, title: "彩虹心形", size: "40x40" },
  // ... 更多项目
].map((item) => (
```

修改为你的图片和标题。例如：
```typescript
{[
  {
    id: 1,
    title: "你的作品标题1",
    size: "32x32",
    image: "/discover/discover-1.png"  // 添加这一行
  },
  {
    id: 2,
    title: "你的作品标题2",
    size: "48x48",
    image: "/discover/discover-2.png"  // 添加这一行
  },
  // ... 更多项目
].map((item) => (
```

### 第四步：更新图片渲染部分

在同一个文件中，找到这段代码（大约在第162-177行）：
```typescript
<div
  className="w-full bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center relative"
  style={{...}}
>
  {/* 显示示例像素艺术 */}
  <div className="flex flex-col items-center gap-2">
    <div className="text-4xl">{"🎨"}</div>
    <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
  </div>
</div>
```

替换为：
```typescript
<div
  className="w-full bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center relative overflow-hidden"
  style={{...}}
>
  {item.image ? (
    <img
      src={item.image}
      alt={item.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="flex flex-col items-center gap-2">
      <div className="text-4xl">{"🎨"}</div>
      <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
    </div>
  )}
</div>
```

### 示例完整配置

```typescript
{[
  {
    id: 1,
    title: "可爱小兔",
    size: "32x32",
    image: "/discover/discover-1.png"
  },
  {
    id: 2,
    title: "像素城堡",
    size: "48x48",
    image: "/discover/discover-2.png"
  },
  {
    id: 3,
    title: "彩虹心形",
    size: "40x40",
    image: "/discover/discover-3.png"
  },
  {
    id: 4,
    title: "星空夜晚",
    size: "56x56",
    image: "/discover/discover-4.png"
  },
  // ... 更多项目
].map((item) => (
  <button
    key={item.id}
    onClick={() => router.push(`/editor/${item.id}`)}
    className="break-inside-avoid group cursor-pointer mb-6 w-full animate-fade-in"
    style={{ animationDelay: `${item.id * 0.1}s` }}
  >
    <div className="relative rounded-2xl overflow-hidden bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      <div
        className="w-full bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex items-center justify-center relative overflow-hidden"
        style={{
          height: item.id % 4 === 0 ? "400px" : item.id % 3 === 0 ? "300px" : item.id % 2 === 0 ? "250px" : "350px",
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl">{"🎨"}</div>
            <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
          </div>
        )}
      </div>
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
        <span className="text-xs font-medium">{item.size}</span>
      </div>
    </div>
  </button>
))}
```

## 文件结构参考

```
pixel-art-generator-2/
├── public/
│   ├── discover/
│   │   ├── discover-1.png
│   │   ├── discover-2.png
│   │   ├── discover-3.png
│   │   └── ... 更多图片
│   └── ... 其他文件
├── app/
│   └── page.tsx  (修改这个文件)
└── ... 其他目录
```

## 提示

- 图片会自动在卡片中缩放，保持宽高比
- 如果没有提供 `image` 属性，会显示默认的emoji和标题
- 所有图片都会显示在右上角的尺寸标签（如 "32x32"）
- 点击卡片会跳转到编辑器查看该作品

## 常见问题

**Q: 图片显示不出来？**
A: 检查文件路径是否正确，确保图片文件在 `public/discover/` 目录中

**Q: 图片看起来被拉伸了？**
A: 使用 `object-cover` 会保持宽高比裁剪，如果希望完整显示图片，改为 `object-contain`

**Q: 可以使用网络URL吗？**
A: 可以！直接在 `image` 属性中填写完整的URL即可
