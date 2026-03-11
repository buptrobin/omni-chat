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
} as ElectronAPI)

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

console.log('[Preload] Phase 3 API exposed')
