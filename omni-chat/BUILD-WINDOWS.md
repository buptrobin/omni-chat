# Windows 打包指南

## 方案一：在 Windows PowerShell 中打包（最简单 ⭐）

将项目复制到 Windows 目录，在 PowerShell 中运行：

```powershell
# 进入项目目录
cd C:\Projects\omni-chat

# 安装依赖并打包
npm install
npm run dist:win
```

## 方案二：安装 Wine 后在 WSL 中打包

在 WSL 终端中执行：

```bash
# 1. 安装 Wine
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install -y wine64 wine32

# 2. 验证 Wine 安装
wine --version

# 3. 打包
npm run dist:win
```

## 方案三：使用 GitHub Actions 自动构建

项目已配置 `.github/workflows/build-windows.yml`，推送代码到 GitHub 后会自动构建 Windows 应用。

### 设置步骤：

1. 在 GitHub 上创建仓库并推送代码
2. 进入 GitHub 仓库 → Actions → Build Windows App
3. 点击 "Run workflow" 手动触发构建
4. 构建完成后，在 Artifacts 中下载 exe 文件

### 自动发布：

推送标签时会自动创建 Release：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 常见问题

### 1. 缺少 Wine

错误：`wine is required`

解决方案：
- 在 Windows PowerShell 中打包，或
- 安装 Wine: `sudo apt install wine64`

### 2. 缺少图标

错误：`application icon is not set`

解决方案：
```bash
# 生成默认图标
cp node_modules/electron/dist/electron.exe build/icon.ico
```

### 3. 杀毒软件拦截

未签名的 exe 可能被 Windows Defender 拦截。用户需要点击"更多信息"→"仍要运行"。

正式分发需要购买代码签名证书。

## 生成的文件

打包完成后，`release/` 目录包含：

| 文件 | 说明 |
|------|------|
| `Omni-GroupChat Setup 1.0.0.exe` | 安装程序 |
| `Omni-GroupChat-Portable-1.0.0.exe` | 便携版 |
| `win-unpacked/` | 未打包的文件 |
