# Omni-GroupChat

人类、ChatGPT、Gemini 三方群聊桌面应用

## 技术栈

- **框架**: Electron + React + TypeScript
- **构建**: Vite + electron-vite
- **样式**: TailwindCSS
- **打包**: electron-builder

## 项目结构

```
omni-chat/
├── src/
│   ├── main/           # 主进程代码
│   ├── preload/        # Preload 脚本
│   └── renderer/       # 渲染进程 (React)
├── build/              # 打包资源 (图标等)
├── dist/               # 编译输出
├── release/            # 打包后的安装程序
└── ...
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev
```

### 3. 构建

```bash
npm run build
```

## Windows 打包说明

由于你使用的是 **WSL (Windows Subsystem for Linux)**，有两种打包方式：

### 方式一：在 WSL 中交叉编译（需要 Wine）

```bash
# 1. 安装 Wine 和 Mono（WSL Ubuntu/Debian）
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install -y wine64 wine32 mono-complete

# 2. 安装依赖
npm install

# 3. 打包 Windows 版本
npm run dist:win
```

打包后的文件将在 `release/` 目录中：
- `Omni-GroupChat Setup 1.0.0.exe` - 安装程序
- `Omni-GroupChat-Portable-1.0.0.exe` - 便携版（无需安装）

### 方式二：在 Windows 宿主中打包（推荐）

在 WSL 中编译可能会遇到一些问题，推荐在 Windows PowerShell 中打包：

```powershell
# 1. 进入项目目录（Windows 路径）
cd \\wsl$\Ubuntu\home\robin\repo\omni-chat2\omni-chat

# 或复制到 Windows 目录
cp -r /home/robin/repo/omni-chat2/omni-chat /mnt/c/Projects/
cd C:\Projects\omni-chat

# 2. 安装依赖
npm install

# 3. 打包 Windows 版本
npm run dist:win
```

### 打包命令

```bash
# 打包 Windows 安装程序 + 便携版
npm run dist:win

# 仅打包便携版
npm run dist:win:portable

# 打包所有平台（需要对应环境）
npm run dist
```

### 添加应用图标

在打包前，建议添加应用图标：

1. 准备 256x256 或更大的 PNG 图标
2. 转换为 ICO 格式（使用 [icoconverter.com](https://www.icoconverter.com/) 或 ImageMagick）
3. 放入 `build/icon.ico`

```bash
# 使用 ImageMagick 生成多尺寸 ICO
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```

## 使用说明

### 首次使用

1. 运行应用后，点击状态栏「显示」按钮打开 ChatGPT/Gemini 窗口
2. 在对应窗口中完成登录
3. 登录成功后点击「隐藏」将窗口转入后台
4. 在主窗口开始群聊

### 发送目标选择

- **全部**：同时发送给 ChatGPT 和 Gemini
- **ChatGPT**：仅发送给 ChatGPT
- **Gemini**：仅发送给 Gemini

### 群聊上下文

ChatRouter 会自动将群聊历史拼接成以下格式发送给 AI：

```
[Human]: 你好
[ChatGPT]: 你好！有什么我可以帮助你的？
[Gemini]: 你好！我也在这里。
[Human]: 你们能一起帮我写代码吗？
```

这让 AI 能感知到其他参与者的存在。

## 注意事项

1. **DOM 选择器**：ChatGPT/Gemini 网页更新可能导致 DOM 注入失效，需要在 `chatgpt-bot.ts` 和 `gemini-bot.ts` 中更新选择器

2. **调试隐藏窗口**：开发模式下按 F12 或手动打开 DevTools：
   ```typescript
   chatGPTWindow.webContents.openDevTools()
   ```

3. **会话持久化**：登录状态保存在 Electron 的 partition 中，重启后保持登录

4. **WSL 图形界面**：如果在 WSL 中运行开发模式，需要配置 X Server（如 VcXsrv）

## 故障排除

### Wine 相关错误

如果在 WSL 中打包遇到 Wine 错误：

```bash
# 设置 Wine 环境
export WINEARCH=win64
export WINEPREFIX=~/.wine

# 初始化 Wine 环境
winecfg
```

### 找不到 rc.exe 错误

```bash
# 安装 Windows 资源编译器
sudo apt install mingw-w64
```

### 推荐：直接在 Windows 中打包

在 Windows PowerShell 中运行打包命令最稳定：

```powershell
npm run dist:win
```

## 开发阶段回顾

### Phase 1: Electron 基础 ✅
- 三窗口架构
- 持久化会话
- 窗口可见性控制

### Phase 2: DOM 交互与 IPC ✅
- DOM 注入
- 模拟人类输入
- 双向 IPC 通信

### Phase 3: 群聊上下文路由 ✅
- ChatRouter 管理
- 上下文拼接
- 统计 UI

### Phase 4: Windows 打包 ✅
- electron-builder 配置
- NSIS 安装程序
- 便携版打包
