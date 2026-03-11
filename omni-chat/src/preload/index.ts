import { contextBridge, ipcRenderer } from 'electron'

export interface ChatStats {
  totalMessages: number
  humanMessages: number
  chatGPTMessages: number
  geminiMessages: number
}

export interface Message {
  id: string
  sender: 'human' | 'chatgpt' | 'gemini'
  content: string
  timestamp: number
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

export interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  total: number
  transferred: number
}

export interface ElectronAPI {
  getWindowStatus: () => Promise<{ main: boolean; chatGPT: boolean; gemini: boolean }>
  getBotStatus: () => Promise<{ chatGPT: boolean; gemini: boolean }>
  reloadChatGPT: () => Promise<{ success: boolean; error?: string }>
  reloadGemini: () => Promise<{ success: boolean; error?: string }>
  setWindowVisibility: (params: { window: string; visible: boolean }) => Promise<{ success: boolean; error?: string }>
  sendMessage: (params: { content: string; target?: 'all' | 'chatgpt' | 'gemini' }) => Promise<{ success: boolean; results?: { chatgpt?: boolean; gemini?: boolean } }>
  getMessageHistory: () => Promise<Message[]>
  getChatStats: () => Promise<ChatStats>
  clearHistory: () => Promise<{ success: boolean }>
  onNewMessage: (callback: (message: Message) => void) => () => void
  onMessageHistory: (callback: (messages: Message[]) => void) => () => void
  onChatStats: (callback: (stats: ChatStats) => void) => () => void
  platform: string
  // Auto-updater
  getCurrentVersion: () => Promise<string>
  checkForUpdates: () => Promise<{ success: boolean; updateAvailable?: boolean; version?: string; error?: string }>
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>
  installUpdate: () => void
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void
  onUpdateNotAvailable: (callback: () => void) => () => void
  onUpdateDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void
  onUpdateDownloaded: (callback: () => void) => () => void
  onUpdateError: (callback: (error: string) => void) => () => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  getWindowStatus: () => ipcRenderer.invoke('get-window-status'),
  getBotStatus: () => ipcRenderer.invoke('get-bot-status'),
  reloadChatGPT: () => ipcRenderer.invoke('reload-chatgpt'),
  reloadGemini: () => ipcRenderer.invoke('reload-gemini'),
  setWindowVisibility: (params: { window: string; visible: boolean }) =>
    ipcRenderer.invoke('set-window-visibility', params),
  sendMessage: (params: { content: string; target?: 'all' | 'chatgpt' | 'gemini' }) =>
    ipcRenderer.invoke('send-message', params),
  getMessageHistory: () => ipcRenderer.invoke('get-message-history'),
  getChatStats: () => ipcRenderer.invoke('get-chat-stats'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  onNewMessage: (callback: (message: Message) => void) => {
    const handler = (_: any, message: Message) => callback(message)
    ipcRenderer.on('new-message', handler)
    return () => ipcRenderer.removeListener('new-message', handler)
  },
  onMessageHistory: (callback: (messages: Message[]) => void) => {
    const handler = (_: any, messages: Message[]) => callback(messages)
    ipcRenderer.on('message-history', handler)
    return () => ipcRenderer.removeListener('message-history', handler)
  },
  onChatStats: (callback: (stats: ChatStats) => void) => {
    const handler = (_: any, stats: ChatStats) => callback(stats)
    ipcRenderer.on('chat-stats', handler)
    return () => ipcRenderer.removeListener('chat-stats', handler)
  },
  platform: process.platform,
  // Auto-updater
  getCurrentVersion: () => ipcRenderer.invoke('get-current-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    const handler = (_: any, info: UpdateInfo) => callback(info)
    ipcRenderer.on('update-available', handler)
    return () => ipcRenderer.removeListener('update-available', handler)
  },
  onUpdateDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const handler = (_: any, progress: DownloadProgress) => callback(progress)
    ipcRenderer.on('update-download-progress', handler)
    return () => ipcRenderer.removeListener('update-download-progress', handler)
  },
  onUpdateNotAvailable: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('update-not-available', handler)
    return () => ipcRenderer.removeListener('update-not-available', handler)
  },
  onUpdateDownloaded: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('update-downloaded', handler)
    return () => ipcRenderer.removeListener('update-downloaded', handler)
  },
  onUpdateError: (callback: (error: string) => void) => {
    const handler = (_: any, error: string) => callback(error)
    ipcRenderer.on('update-error', handler)
    return () => ipcRenderer.removeListener('update-error', handler)
  },
} as ElectronAPI)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

console.log('[Preload] Phase 3 API exposed')
