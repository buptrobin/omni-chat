@echo off
chcp 65001 >nul
echo ==========================================
echo   Omni-GroupChat Windows 打包脚本
echo ==========================================
echo.

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo 正在安装依赖...
call npm install
if errorlevel 1 (
    echo 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 正在构建应用...
call npm run build
if errorlevel 1 (
    echo 构建失败
    pause
    exit /b 1
)

echo.
echo 正在打包 Windows 版本...
call npm run dist:win
if errorlevel 1 (
    echo 打包失败
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   打包成功！
echo ==========================================
echo.
echo 生成的文件在 release\ 目录中
echo.
pause
