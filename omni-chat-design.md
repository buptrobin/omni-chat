# Omni-GroupChat (Electron 桌面版) - 架构设计与开发指南

## 1. 项目概述
本项目旨在构建一个跨平台的桌面应用程序，实现：人类、ChatGPT（网页版）、Gemini（网页版）的三方群聊。
系统将基于 **Electron** 框架，通过不可见的后台窗口接管 AI 网页的 DOM 交互，并通过 IPC 通信与前端可见的群聊 UI 进行数据交换。

## 2. 技术栈选型
*   **核心框架**: Electron
*   **前端 UI**: React + Vite (推荐使用 `electron-vite` 脚手架一步到位)
*   **语言**: TypeScript (严格类型)
*   **UI 样式**: TailwindCSS

## 3. 架构设计与核心逻辑 (Claude Code 必读重点)

### 3.1 进程设计 (Multi-Window Strategy)
*   **MainWindow (可见窗口)**: 渲染 React 群聊 UI。
*   **ChatGPT WebContents (隐藏/后台)**: 加载 `https://chatgpt.com`。
*   **Gemini WebContents (隐藏/后台)**: 加载 `https://gemini.google.com`。

### 3.2 逆向 DOM 操作 (DOM Injection)
不使用 Playwright，直接在 Main Process 中使用 `webContents.executeJavaScript()` 来执行注入脚本，实现自动化。
*   **发送消息**: 主进程收到 UI 的消息后，通过 `executeJavaScript` 查找对应页面的输入框 DOM，填入文字并触发 `click()` 提交。
*   **读取回复**: 通过注入 `MutationObserver` 脚本或者定时器，轮询抓取最新的 Assistant 回复文本。

### 3.3 关键防封禁策略 (Anti-Bot Bypass)
Electron 默认的 User-Agent 会被 Cloudflare 拦截。在创建隐藏的 `BrowserWindow` 时，必须：
1.  设置常规 Chrome 的 User-Agent（剥离 Electron 字样）。
2.  在启动时，提供一个“登录模式”：允许将隐藏窗口暂时设为 `show: true`，让用户手动扫码/登录。登录完成后，状态会持久化保存在 Electron 的 `session` 中。

## 4. 目录结构预期 (基于 electron-vite)
```text
omni-chat/
├── src/
│   ├── main/
│   │   ├── index.ts          # 主进程入口，管理窗口和 IPC 路由
│   │   ├── chatgpt-bot.ts    # 封装对 ChatGPT 隐藏窗口的 DOM 操作逻辑
│   │   └── gemini-bot.ts     # 流程同上
│   ├── preload/
│   │   └── index.ts          # IPC 桥接
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── App.tsx       # 群聊界面
│           └── components/   # 聊天气泡组件
```

## 0.2 开发阶段划分 (Phases for Claude Code)

*   **Phase 1: Electron 基础与会话管理**
    *   使用 `electron-vite` (React+TS) 初始化项目。
    *   在主进程创建主窗口 (UI)，并创建两个**初始可见**的辅助窗口分别加载 ChatGPT 和 Gemini。
    *   *目标*: 运行程序后，弹出三个窗口。用户可以在另外两个窗口中完成账号登录。确认登录状态可以跨重启保持。

*   **Phase 2: DOM 交互与 IPC 通信建立**
    *   将辅助窗口改为**隐藏** (`show: false`)。
    *   编写 `chatgpt-bot.ts` 和 `gemini-bot.ts`。实现：通过主进程向这两个隐藏窗口注入 JS 代码以读取历史/发送消息。
    *   建立 Main 和 Renderer 之间的 IPC 管道 (`window.electron.ipcRenderer.send`)。

*   **Phase 3: 群聊上下文路由与 UI**
    *   在主进程维护全局的 `MessageHistory`。
    *   实现前缀拼接逻辑（如发给 ChatGPT 前拼接 `[Human]: xxx \n [Gemini]: yyy`）。
    *   完成 React 端类似微信群聊的精美 UI。左侧为 AI，右侧为人类。

## 0.3 特别提示
* DOM 交互可能会因为页面更新失效，请在注入脚本中加入详细的 `console.log` 以便通过 `webContents.openDevTools()` 调试。
* 为了模拟人类打字，注入输入框时推荐通过触发 Input Event 或者逐字修改 `value` 的方式，而不仅仅是直接赋值。

现在，请开始执行 Phase 1！使用 `npm create @quick-start/electron@latest` 或者类似命令初始化脚手架。
