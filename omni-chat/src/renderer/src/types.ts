export interface Message {
  id: string
  sender: 'human' | 'chatgpt' | 'gemini'
  content: string
  timestamp: number
}

export interface ChatStats {
  totalMessages: number
  humanMessages: number
  chatGPTMessages: number
  geminiMessages: number
}

// Update related types
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

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'

export interface WindowAPI {
  getCurrentVersion(): Promise<string>
  checkForUpdates(): Promise<{ hasUpdate: boolean; info?: UpdateInfo }>
  downloadUpdate(): Promise<void>
  installUpdate(): Promise<void>
  onUpdateAvailable(callback: (info: UpdateInfo) => void): () => void
  onUpdateDownloadProgress(callback: (progress: DownloadProgress) => void): () => void
  onUpdateDownloaded(callback: () => void): () => void
  onUpdateError(callback: (error: string) => void): () => void
}
