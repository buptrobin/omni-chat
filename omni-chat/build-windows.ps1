# Omni-GroupChat Windows 打包脚本
# 在 Windows PowerShell 中运行

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Omni-GroupChat Windows 打包脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在正确目录
if (-not (Test-Path "package.json")) {
    Write-Host "错误：未找到 package.json" -ForegroundColor Red
    Write-Host "请确保在项目根目录运行此脚本" -ForegroundColor Yellow
    exit 1
}

# 检查 Node.js
Write-Host "检查 Node.js 环境..." -ForegroundColor Green
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "Node.js: $nodeVersion" -ForegroundColor Gray
Write-Host "npm: $npmVersion" -ForegroundColor Gray
Write-Host ""

# 安装依赖
Write-Host "步骤 1: 安装依赖..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "依赖安装完成" -ForegroundColor Green
Write-Host ""

# 构建应用
Write-Host "步骤 2: 构建应用..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "构建完成" -ForegroundColor Green
Write-Host ""

# 打包 Windows 版本
Write-Host "步骤 3: 打包 Windows 版本..." -ForegroundColor Green
Write-Host "这将生成两种版本：" -ForegroundColor Yellow
Write-Host "  - 安装程序 (NSIS)" -ForegroundColor Gray
Write-Host "  - 便携版 (Portable)" -ForegroundColor Gray
Write-Host ""

npm run dist:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "打包失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  打包成功！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# 显示输出文件
$releaseDir = "release"
if (Test-Path $releaseDir) {
    Write-Host "生成的文件：" -ForegroundColor Cyan
    Get-ChildItem -Path $releaseDir -Filter "*.exe" | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  - $($_.Name) (${size} MB)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "安装程序: release/Omni-GroupChat Setup *.exe" -ForegroundColor Yellow
Write-Host "便携版:   release/Omni-GroupChat-Portable-*.exe" -ForegroundColor Yellow
Write-Host ""
Write-Host "按 Enter 键退出..." -ForegroundColor Gray
Read-Host
