. 页面流转逻辑 (Page Flow)
应用主要分为两个核心状态：初始化配置模式 (Setup Mode) 和 编辑器模式 (Editor Mode)。
2.1 初始化配置模式 (Setup Mode)
这是用户进入后的首屏状态。
输入交互:
文件上传: 监听 <input type="file"> 的 change 事件或拖拽区域的 drop 事件。
预览: 使用 FileReader 读取图片并在前端显示缩略图。
参数配置:
粒度滑块 (Granularity): 范围 10 - 300。此数值代表横向格数（Grid Width）。纵向格数根据图片长宽比自动计算：Height = Width * (ImgH / ImgW)。
算法选择: 用户选择 Dominant (锐利/主色) 或 Average (平滑/均值)。这将作为参数传递给生成算法。
触发生成:
点击 "Generate Pattern" 按钮。
逻辑钩子: 调用生成函数（目前为前端 processImage，需对接后端 API），返回颜色 ID 组成的数组 (Grid Array)。
状态切换: 设置 SetupMode = false，初始化 History 栈，进入编辑器模式。
2.2 编辑器模式 (Editor Mode)
这是主要工作区，包含三个主要区域：
左侧工具栏 (Toolbar): 仅在“编辑状态”下显示。
中间画布 (Canvas): 核心交互区。
右侧侧边栏 (Sidebar): 调色板、统计、设置。
顶部浮动栏: 视图/编辑 模式切换。
3. 核心交互逻辑 (Interaction Logic)
3.1 视图 vs 编辑 模式 (View vs Edit Mode)
为了防止误操作并优化触控体验，引入了模式切换：
View Mode (浏览模式):
鼠标行为: 此时忽略工具选择。鼠标左键拖拽、中键拖拽、空格+拖拽 统一被拦截为 平移画布 (Pan)。
UI 变化: 隐藏左侧工具栏，光标变为 grab (抓手)。
用途: 方便用户放大查看细节，对比原图。
Edit Mode (编辑模式):
鼠标行为: 左键点击/拖拽触发当前选中的工具逻辑 (画笔、橡皮等)。
例外: 即使在编辑模式下，按住 Space 键或使用鼠标中键，仍可临时激活平移功能。
UI 变化: 显示左侧工具栏，光标变为 crosshair (十字准星)。
3.2 画布渲染与坐标系统 (Canvas Rendering)
EditorCanvas.tsx 是渲染核心。
坐标转换 (Coordinate System):
屏幕坐标 (Screen): 鼠标点击的 clientX/Y。
画布变换 (Transform): 包含 Scale (缩放) 和 Translate X/Y (平移)。
网格坐标 (Grid): 计算公式为：
code
TypeScript
GridX = floor( (ClientX - RectLeft - TranslateX) / (CellSize * Scale) )
GridY = floor( (ClientY - RectTop - TranslateY) / (CellSize * Scale) )
渲染循环 (Render Loop):
采用 requestAnimationFrame 进行绘制。
图层顺序:
背景层: 清空画布。
模板层 (Template): 绘制原始上传的半透明图片（globalAlpha 控制透明度）。
拼豆层 (Beads): 遍历 Grid Array，根据 GridX/Y 绘制圆形。
Simple Mode: 绘制纯色圆形。
Realistic Mode: 绘制带阴影、高光、内孔的复杂图形。
UI 辅助层: 绘制 29x29 的物理板子分割线。
信息层: 当 Scale > 0.8 且开启设置时，在豆子上绘制色号文字。
3.3 工具逻辑 (Tool Implementation)
Pen (画笔): 修改 Grid[Index] 为当前 SelectedColorId。支持按住拖拽连续绘制。
Eraser (橡皮): 修改 Grid[Index] 为 null。
Picker (吸管): 读取点击位置的 ColorId，更新全局 SelectedColorId。
Fill (油漆桶): 实现 广度优先搜索 (BFS) 泛洪填充算法，寻找连通的同色区域并替换。
Mirror (镜像):
计算中心轴：(Width - 1) / 2。
当在 (x, y) 落笔时，同时修改 (Width - 1 - x, y) 位置的像素。
4. 数据结构设计 (Data Structure)
4.1 网格数据 (The Grid)
为了性能和序列化方便，使用 一维数组 存储二维数据：
类型: Array<string | null>
长度: Width * Height
索引计算: Index = y * Width + x
值: 存储 ColorID (如 "M-01")，空位为 null。
4.2 调色板 (Palette)
常量数据 (MARD_PALETTE)，包含：
id: 唯一标识 (后端对接关键)。
hex: 渲染用的十六进制颜色。
code: 显示在图纸上的简码 (如 "A1", "B2")。
4.3 历史记录 (Undo System)
结构: Stack<GridArray>。
逻辑: 每次 onPointerUp (绘图结束) 或 Fill 操作后，将当前的 Grid 深拷贝一份推入栈中。撤销时弹出栈顶状态覆盖当前 Grid。限制栈深度为 20 以节省内存。
5. 后端对接方案 (Backend Integration)
目前代码中使用的是前端 services/imageEngine.ts 进行像素化。既然您的后端算法已开发完成，需进行以下改造：
5.1 接口定义 (建议)
Request (POST /api/generate):
code
JSON
{
  "image": "base64_string...", // 或 multipart/form-data
  "width": 100,                // 用户设定的粒度
  "algorithm": "AVERAGE",      // 用户选择的算法
  "palette": "MARD"            // 品牌
}
Response:
code
JSON
{
  "width": 100,
  "height": 120,
  "grid": ["M-01", "M-01", null, "M-05", ...], // 对应的一维颜色ID数组
  "paletteMap": { ... } // 可选，如果后端动态返回颜色定义
}
5.2 前端改造点
在 App.tsx 的 handleGenerate 函数中：
当前逻辑 (前端计算):
code
TypeScript
const { grid: generatedGrid, height } = processImage(templateImage, ...);
setGrid(generatedGrid);
修改后逻辑 (调用后端):
code
TypeScript
const handleGenerate = async () => {
    if (!templateImage) return;
    
    // 1. 准备数据
    const formData = new FormData();
    formData.append('file', templateImageFile); // 需在 handleImageUpload 时保存原始 File 对象
    formData.append('width', previewGridSize.toString());
    formData.append('algorithm', pixelationAlgorithm);

    try {
        // 2. 调用后端
        const response = await fetch('https://your-api.com/generate', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        // 3. 应用数据
        setGridSize({ width: data.width, height: data.height });
        setGrid(data.grid); // 确保后端返回的 ID 与前端 constants.ts 中的 ID 一致
        setSetupMode(false);
    } catch (e) {
        alert("Generation failed");
    }
};
6. UI/UX 细节规范
主题色:
Primary: #98ff98 (Mint Green) - 用于激活状态、按钮、高亮。
Background: #f1f5f9 (Slate 100) - 画布背景。
Surface: White - 工具栏和侧边栏。
响应式布局:
Sidebar: 固定宽度 (320px)，右侧停靠。
Canvas: 占据剩余空间 (flex-1)，溢出隐藏 (overflow-hidden)。
Edit Toggle: 绝对定位悬浮于顶部中央，确保显眼易触达。
性能优化:
EditorCanvas 使用 React.memo 或 useCallback 避免无关 State 变化导致的重绘。
拖拽 (Drag) 过程中不直接修改 React State (Grid)，而是仅修改 Canvas 视觉反馈，在 pointerUp 时才提交数据更新 State，减少 React Render 周期。