# 🎵 Music Player

一个功能丰富的本地音乐播放器，基于 Electron 构建，界面美观，操作流畅。

## 功能特性

- **多格式支持** — MP3、FLAC、WAV、AAC、OGG 等主流音频格式
- **音频可视化** — 三种可视化模式（频谱柱状图 / 涡旋 / 波形），点击切换
- **10 段均衡器** — 内置 Rock、Pop、Jazz、Classical 等预设，支持自定义调节
- **歌词显示** — 支持 LRC 歌词文件加载与同步滚动，可调整歌词偏移
- **悬浮歌词** — 独立置顶歌词窗口，可自由拖动和调整大小
- **迷你播放器** — 置顶小窗模式，不遮挡其他工作
- **播放列表管理** — 拖拽添加文件、搜索筛选、右键菜单操作、导入/导出播放列表
- **播放模式** — 顺序播放 / 随机播放 / 单曲循环 / 列表循环
- **收藏功能** — 标记喜爱的歌曲
- **ID3 标签编辑** — 直接编辑歌曲的标题、艺术家、专辑等信息
- **主题切换** — 深色 / 浅色主题
- **中英双语** — 界面支持中文和英文切换
- **键盘快捷键** — 全键盘操作，支持媒体键
- **状态记忆** — 自动保存播放列表、音量、主题等设置

## 快捷键

| 快捷键 | 功能 |
|---|---|
| `Space` | 播放 / 暂停 |
| `←` / `→` | 快退 / 快进 5 秒 |
| `↑` / `↓` | 音量增减 |
| `Ctrl + ←` / `→` | 上一首 / 下一首 |
| `Ctrl + O` | 打开文件 |
| `Ctrl + Shift + O` | 打开文件夹 |
| `Ctrl + M` | 迷你播放器 |
| `Ctrl + T` | 切换主题 |

## 安装与运行

### 环境要求

- [Node.js](https://nodejs.org/) >= 16
- npm 或 yarn

### 启动

```bash
# 克隆项目
git clone https://github.com/你的用户名/music-player.git
cd music-player

# 安装依赖
npm install

# 启动应用
npm start
```

## 技术栈

- **Electron** — 跨平台桌面应用框架
- **Web Audio API** — 音频处理与均衡器
- **Canvas** — 音频可视化渲染
- **music-metadata** — 音频文件元数据解析
- **electron-store** — 本地数据持久化

## 项目结构

```
music-player/
├── main/                  # Electron 主进程
│   ├── index.js           # 应用入口，窗口管理
│   ├── menu.js            # 菜单栏
│   ├── shortcuts.js       # 全局媒体快捷键
│   ├── preload.js         # 预加载脚本
│   └── ipc/               # IPC 通信模块
│       ├── files.js       # 文件操作
│       ├── metadata.js    # 元数据读取
│       └── store.js       # 数据存储
├── renderer/              # 渲染进程（前端界面）
│   ├── index.html         # 主界面
│   ├── mini-player.html   # 迷你播放器
│   ├── floating-lyrics.html # 悬浮歌词
│   ├── css/               # 样式文件
│   └── js/                # 功能模块
│       ├── app.js         # 应用初始化
│       ├── audio-engine.js # 音频引擎
│       ├── playlist.js    # 播放列表逻辑
│       ├── equalizer.js   # 均衡器
│       ├── visualizer.js  # 可视化
│       ├── lyrics.js      # 歌词解析与显示
│       ├── i18n.js        # 国际化
│       └── ...
└── package.json
```

## License

MIT
