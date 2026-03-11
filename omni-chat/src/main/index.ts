import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { ChatGPTBot } from './chatgpt-bot'
import { GeminiBot } from './gemini-bot'
import { ChatRouter } from './chat-router'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let chatGPTWindow: BrowserWindow | null = null
let geminiWindow: BrowserWindow | null = null
let chatGPTBot: ChatGPTBot | null = null
let geminiBot: GeminiBot | null = null
let chatRouter: ChatRouter | null = null

export interface Message {
  id: string
  sender: 'human' | 'chatgpt' | 'gemini'
  content: string
  timestamp: number
}

const isDev = !app.isPackaged
const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function createMainWindow(): BrowserWindow {
  // 确定 preload 路径
  let preloadPath: string
  if (app.isPackaged) {
    // 打包后: resources/app.asar.unpacked/dist/preload/index.cjs
    preloadPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'preload', 'index.cjs')
  } else {
    preloadPath = path.join(__dirname, '..', 'preload', 'index.js')
  }

  console.log('[Main] Preload path:', preloadPath)

  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600, show: false,
    title: 'Omni-GroupChat',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false, // 允许本地文件加载
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    // 打包后使用 file:// 协议
    const indexPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'renderer', 'index.html')
    const indexUrl = new URL('file://' + indexPath).toString()
    console.log('[Main] Loading URL:', indexUrl)
    win.loadURL(indexUrl)

    // 添加错误处理
    win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
      console.error('[Main] Failed to load:', errorCode, errorDescription)
    })

    win.webContents.on('dom-ready', () => {
      console.log('[Main] DOM ready')
    })
  }

  win.once('ready-to-show', () => { win.show(); win.focus() })
  win.on('closed', () => { mainWindow = null })
  return win
}

function createChatGPTWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200, height: 800, show: false, title: 'ChatGPT',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:chatgpt',
    },
  })
  win.webContents.setUserAgent(CHROME_USER_AGENT)
  win.loadURL('https://chatgpt.com')
  if (isDev) win.webContents.openDevTools()
  win.webContents.on('dom-ready', () => {
    console.log('[Main] ChatGPT ready')
    if (!chatGPTBot) {
      chatGPTBot = new ChatGPTBot(win.webContents)
      chatGPTBot.onMessage((msg) => handleAIResponse('chatgpt', msg.content))
    }
  })
  win.on('closed', () => { chatGPTWindow = null; chatGPTBot = null })
  return win
}

function createGeminiWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200, height: 800, show: false, title: 'Gemini',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:gemini',
    },
  })
  win.webContents.setUserAgent(CHROME_USER_AGENT)
  win.loadURL('https://gemini.google.com')
  if (isDev) win.webContents.openDevTools()
  win.webContents.on('dom-ready', () => {
    console.log('[Main] Gemini ready')
    if (!geminiBot) {
      geminiBot = new GeminiBot(win.webContents)
      geminiBot.onMessage((msg) => handleAIResponse('gemini', msg.content))
    }
  })
  win.on('closed', () => { geminiWindow = null; geminiBot = null })
  return win
}

function handleAIResponse(sender: 'chatgpt' | 'gemini', content: string): void {
  if (!chatRouter) return
  const msg = chatRouter.handleAIResponse(sender, content)
  notifyRenderer('new-message', msg)
  notifyRenderer('message-history', chatRouter.getHistory())
  notifyRenderer('chat-stats', chatRouter.getStats())
}

function notifyRenderer(channel: string, data: any): void {
  if (mainWindow?.webContents) mainWindow.webContents.send(channel, data)
}

function registerIpcHandlers(): void {
  ipcMain.handle('get-window-status', () => ({
    main: !!mainWindow, chatGPT: !!chatGPTWindow, gemini: !!geminiWindow
  }))
  ipcMain.handle('get-bot-status', () => ({
    chatGPT: chatGPTBot?.isPageReady() ?? false, gemini: geminiBot?.isPageReady() ?? false
  }))
  ipcMain.handle('reload-chatgpt', () => {
    if (chatGPTWindow) { chatGPTBot = null; chatGPTWindow.reload(); return { success: true } }
    return { success: false, error: 'Not found' }
  })
  ipcMain.handle('reload-gemini', () => {
    if (geminiWindow) { geminiBot = null; geminiWindow.reload(); return { success: true } }
    return { success: false, error: 'Not found' }
  })
  ipcMain.handle('set-window-visibility', (_, { window, visible }: { window: string; visible: boolean }) => {
    const target = window === 'chatgpt' ? chatGPTWindow : geminiWindow
    if (target) { visible ? target.show() : target.hide(); return { success: true } }
    return { success: false, error: 'Not found' }
  })
  ipcMain.handle('send-message', async (_, { content, target }: { content: string; target?: 'all' | 'chatgpt' | 'gemini' }) => {
    if (!chatRouter) return { success: false, error: 'Router not initialized' }
    const routes = chatRouter.routeMessage(content, target)
    const results: any = {}
    notifyRenderer('message-history', chatRouter.getHistory())
    for (const route of routes) {
      if (route.target === 'chatgpt' && chatGPTBot?.isPageReady()) {
        results.chatgpt = await chatGPTBot.sendMessage(route.content)
      }
      if (route.target === 'gemini' && geminiBot?.isPageReady()) {
        results.gemini = await geminiBot.sendMessage(route.content)
      }
    }
    return { success: true, results }
  })
  ipcMain.handle('get-message-history', () => chatRouter?.getHistory() ?? [])
  ipcMain.handle('get-chat-stats', () => chatRouter?.getStats() ?? { totalMessages: 0, humanMessages: 0, chatGPTMessages: 0, geminiMessages: 0 })
  ipcMain.handle('clear-history', () => {
    chatRouter?.clearHistory()
    notifyRenderer('message-history', [])
    notifyRenderer('chat-stats', { totalMessages: 0, humanMessages: 0, chatGPTMessages: 0, geminiMessages: 0 })
    return { success: true }
  })
  console.log('[Main] IPC handlers registered')
}

app.whenReady().then(() => {
  console.log('[Main] App ready, isPackaged:', app.isPackaged)
  chatRouter = new ChatRouter(20)
  registerIpcHandlers()
  mainWindow = createMainWindow()
  chatGPTWindow = createChatGPTWindow()
  geminiWindow = createGeminiWindow()
  app.on('activate', () => {
    if (!mainWindow) mainWindow = createMainWindow()
    if (!chatGPTWindow) chatGPTWindow = createChatGPTWindow()
    if (!geminiWindow) geminiWindow = createGeminiWindow()
  })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('web-contents-created', (_, contents) => { contents.on('new-window', (event) => event.preventDefault()) })
