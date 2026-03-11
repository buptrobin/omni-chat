# 调试指南

## 问题：打包后界面空白

### 原因
打包后的 Electron 应用路径解析与开发环境不同。

### 修复内容

1. **主进程路径修复** ✅
   - 使用 `process.resourcesPath` 获取打包后的资源路径
   - 使用 `app.isPackaged` 检测是否在打包环境
   - Preload 脚本路径自动切换 `.js` (dev) / `.cjs` (prod)

2. **electron-builder 配置修复** ✅
   - 添加 `asarUnpack` 确保 preload 脚本可访问
   - 添加 `package.json` 到 files 列表

### 测试步骤

#### 1. 本地测试（不打包）

```bash
npm run build
npm run preview
```

如果 `preview` 能正常工作，说明路径修复正确。

#### 2. 检查打包内容

打包后在 Windows 中检查：

```powershell
# 进入打包后的目录
cd release\win-unpacked

# 检查文件是否存在
ls resources\app\dist\
ls resources\app\dist\renderer\
ls resources\app\dist\preload\
```

#### 3. 查看控制台日志

打包后的应用启动时，按 `Ctrl+Shift+I` 打开 DevTools 查看控制台错误。

### 常见问题

#### Preload 脚本加载失败

如果看到错误：
```
Unable to load preload script: ...
```

检查 `asarUnpack` 是否正确配置。

#### 空白页面

如果页面空白，在 DevTools Console 中查看：
- 是否有 `file://` 协议错误
- 是否找不到 `index.html`

#### 资源路径错误

在主进程中添加调试日志（已添加）：
```typescript
console.log('[Main] Loading from:', indexPath)
console.log('[Main] App ready, isPackaged:', app.isPackaged)
```

### 快速修复清单

- [ ] 重新构建：`npm run build`
- [ ] 重新打包：`npm run dist:win`
- [ ] 检查 `release/win-unpacked/resources/app/dist/` 是否存在
- [ ] 运行便携版测试：`release/Omni-GroupChat-Portable-1.0.0.exe`
