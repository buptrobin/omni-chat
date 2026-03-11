import React from 'react'
import { ChatStats } from '../types'
import type { UpdateStatus, UpdateInfo, DownloadProgress } from '../../../preload/index'

interface StatusBarProps {
  windowStatus: { main: boolean; chatGPT: boolean; gemini: boolean }
  botStatus: { chatGPT: boolean; gemini: boolean }
  stats: ChatStats
  onToggleVisibility: (window: string, visible: boolean) => void
  onReload: (window: string) => void
  onClearHistory: () => void
  currentVersion: string
  updateStatus: UpdateStatus
  updateInfo: UpdateInfo | null
  downloadProgress: DownloadProgress | null
  onCheckUpdate: () => void
  onDownloadUpdate: () => void
  onInstallUpdate: () => void
}

const StatusBar: React.FC<StatusBarProps> = ({
  windowStatus,
  botStatus,
  stats,
  onToggleVisibility,
  onReload,
  onClearHistory,
  currentVersion,
  updateStatus,
  updateInfo,
  downloadProgress,
  onCheckUpdate,
  onDownloadUpdate,
  onInstallUpdate
}) => {
  return (
    <div className="border-b bg-white px-4 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-800">Omni-GroupChat</h1>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Phase 3</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>你: {stats.humanMessages}</span>
          <span className="text-chatgpt-600">ChatGPT: {stats.chatGPTMessages}</span>
          <span className="text-gemini-600">Gemini: {stats.geminiMessages}</span>
          <span className="text-gray-400">|</span>
          <span>共 {stats.totalMessages} 条</span>
          <span className="text-gray-400">|</span>
          {/* Version and Update UI */}
          <div className="flex items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">v{currentVersion}</span>
            {updateStatus === 'idle' && (
              <button
                onClick={onCheckUpdate}
                className="rounded bg-blue-50 px-2 py-0.5 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                检查更新
              </button>
            )}
            {updateStatus === 'checking' && (
              <span className="rounded bg-yellow-50 px-2 py-0.5 text-yellow-600 flex items-center gap-1">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                检查中...
              </span>
            )}
            {updateStatus === 'available' && updateInfo && (
              <button
                onClick={onDownloadUpdate}
                className="rounded bg-green-50 px-2 py-0.5 text-green-600 hover:bg-green-100 transition-colors animate-pulse"
              >
                有可用更新 v{updateInfo.version}
              </button>
            )}
            {updateStatus === 'downloading' && downloadProgress && (
              <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-600 flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                下载中 {Math.round(downloadProgress.percent)}%
                <span className="h-1.5 w-16 rounded-full bg-blue-200 overflow-hidden">
                  <span
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${downloadProgress.percent}%` }}
                  />
                </span>
              </span>
            )}
            {updateStatus === 'downloaded' && (
              <button
                onClick={onInstallUpdate}
                className="rounded bg-purple-50 px-2 py-0.5 text-purple-600 hover:bg-purple-100 transition-colors font-medium"
              >
                下载完成，点击安装
              </button>
            )}
            {updateStatus === 'error' && (
              <button
                onClick={onCheckUpdate}
                className="rounded bg-red-50 px-2 py-0.5 text-red-600 hover:bg-red-100 transition-colors"
              >
                更新检查失败，重试
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${botStatus.chatGPT ? 'bg-chatgpt-500' : 'bg-gray-300'}`} />
          <span className="text-sm text-gray-600">ChatGPT</span>
          <button onClick={() => onToggleVisibility('chatgpt', true)} className="rounded bg-chatgpt-100 px-2 py-0.5 text-xs text-chatgpt-700">显示</button>
          <button onClick={() => onToggleVisibility('chatgpt', false)} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">隐藏</button>
          <button onClick={() => onReload('chatgpt')} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">刷新</button>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${botStatus.gemini ? 'bg-gemini-500' : 'bg-gray-300'}`} />
          <span className="text-sm text-gray-600">Gemini</span>
          <button onClick={() => onToggleVisibility('gemini', true)} className="rounded bg-gemini-100 px-2 py-0.5 text-xs text-gemini-700">显示</button>
          <button onClick={() => onToggleVisibility('gemini', false)} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">隐藏</button>
          <button onClick={() => onReload('gemini')} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">刷新</button>
        </div>
        <button onClick={onClearHistory} className="ml-auto rounded bg-red-50 px-2 py-0.5 text-xs text-red-600 hover:bg-red-100">清空</button>
      </div>
    </div>
  )
}

export default StatusBar
