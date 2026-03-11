import React, { useState, useEffect, useCallback } from 'react'
import StatusBar from './components/StatusBar'
import ChatWindow from './components/ChatWindow'
import { Message, ChatStats } from './types'
import type { UpdateStatus, UpdateInfo, DownloadProgress } from '../../preload/index'

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<ChatStats>({
    totalMessages: 0,
    humanMessages: 0,
    chatGPTMessages: 0,
    geminiMessages: 0,
  })
  const [windowStatus, setWindowStatus] = useState({
    main: false,
    chatGPT: false,
    gemini: false,
  })
  const [botStatus, setBotStatus] = useState({
    chatGPT: false,
    gemini: false,
  })
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [target, setTarget] = useState<'all' | 'chatgpt' | 'gemini'>('all')

  // Auto-updater state
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const [status, bots, history, chatStats, version] = await Promise.all([
          window.electronAPI.getWindowStatus(),
          window.electronAPI.getBotStatus(),
          window.electronAPI.getMessageHistory(),
          window.electronAPI.getChatStats(),
          window.electronAPI.getCurrentVersion(),
        ])
        setWindowStatus(status)
        setBotStatus(bots)
        setMessages(history)
        setStats(chatStats)
        setCurrentVersion(version)
      } catch (error) {
        console.error('[App] Init failed:', error)
      }
    }

    init()

    const statusInterval = setInterval(async () => {
      const [status, bots] = await Promise.all([
        window.electronAPI.getWindowStatus(),
        window.electronAPI.getBotStatus(),
      ])
      setWindowStatus(status)
      setBotStatus(bots)
    }, 5000)

    const unsubscribeNewMessage = window.electronAPI.onNewMessage((message: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
    })

    const unsubscribeHistory = window.electronAPI.onMessageHistory((msgs: Message[]) => {
      setMessages(msgs)
    })

    const unsubscribeStats = window.electronAPI.onChatStats((newStats: ChatStats) => {
      setStats(newStats)
    })

    // Auto-updater event listeners
    const unsubscribeUpdateAvailable = window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
      console.log('[App] Update available:', info)
      setUpdateStatus('available')
      setUpdateInfo(info)
      setDownloadProgress(null)
    })

    const unsubscribeUpdateNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      console.log('[App] No update available')
      setUpdateStatus('idle')
      setUpdateInfo(null)
    })

    const unsubscribeDownloadProgress = window.electronAPI.onUpdateDownloadProgress((progress: DownloadProgress) => {
      setUpdateStatus('downloading')
      setDownloadProgress(progress)
    })

    const unsubscribeUpdateDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      console.log('[App] Update downloaded')
      setUpdateStatus('downloaded')
      setDownloadProgress(null)
    })

    const unsubscribeUpdateError = window.electronAPI.onUpdateError((error: string) => {
      console.error('[App] Update error:', error)
      setUpdateStatus('error')
    })

    // Optional: Auto-check for updates after 5 seconds
    const autoCheckTimeout = setTimeout(() => {
      if (updateStatus === 'idle') {
        handleCheckUpdate()
      }
    }, 5000)

    return () => {
      clearInterval(statusInterval)
      clearTimeout(autoCheckTimeout)
      unsubscribeNewMessage()
      unsubscribeHistory()
      unsubscribeStats()
      unsubscribeUpdateAvailable()
      unsubscribeUpdateNotAvailable()
      unsubscribeDownloadProgress()
      unsubscribeUpdateDownloaded()
      unsubscribeUpdateError()
    }
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isSending) return
    setIsSending(true)
    try {
      const result = await window.electronAPI.sendMessage({
        content: inputValue.trim(),
        target,
      })
      if (result.success) setInputValue('')
    } catch (error) {
      console.error('[App] Send failed:', error)
    } finally {
      setIsSending(false)
    }
  }, [inputValue, isSending, target])

  const toggleWindowVisibility = async (window: string, visible: boolean) => {
    const result = await window.electronAPI.setWindowVisibility({ window, visible })
    if (result.success) {
      const status = await window.electronAPI.getWindowStatus()
      setWindowStatus(status)
    }
  }

  const reloadWindow = async (window: string) => {
    if (window === 'chatgpt') await window.electronAPI.reloadChatGPT()
    else if (window === 'gemini') await window.electronAPI.reloadGemini()
    setTimeout(async () => {
      const bots = await window.electronAPI.getBotStatus()
      setBotStatus(bots)
    }, 5000)
  }

  const clearHistory = async () => {
    await window.electronAPI.clearHistory()
    setMessages([])
    setStats({ totalMessages: 0, humanMessages: 0, chatGPTMessages: 0, geminiMessages: 0 })
  }

  // Auto-updater handlers
  const handleCheckUpdate = async () => {
    if (updateStatus === 'checking' || updateStatus === 'downloading') return
    setUpdateStatus('checking')
    try {
      const result = await window.electronAPI.checkForUpdates()
      if (!result.success) {
        setUpdateStatus('error')
        console.error('[App] Check update failed:', result.error)
      } else if (!result.updateAvailable) {
        setUpdateStatus('idle')
        console.log('[App] No update available')
      }
    } catch (error) {
      setUpdateStatus('error')
      console.error('[App] Check update error:', error)
    }
  }

  const handleDownloadUpdate = async () => {
    if (updateStatus !== 'available') return
    setUpdateStatus('downloading')
    try {
      const result = await window.electronAPI.downloadUpdate()
      if (!result.success) {
        setUpdateStatus('error')
        console.error('[App] Download update failed:', result.error)
      }
    } catch (error) {
      setUpdateStatus('error')
      console.error('[App] Download update error:', error)
    }
  }

  const handleInstallUpdate = () => {
    if (updateStatus !== 'downloaded') return
    window.electronAPI.installUpdate()
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <StatusBar
        windowStatus={windowStatus}
        botStatus={botStatus}
        stats={stats}
        onToggleVisibility={toggleWindowVisibility}
        onReload={reloadWindow}
        onClearHistory={clearHistory}
        currentVersion={currentVersion}
        updateStatus={updateStatus}
        updateInfo={updateInfo}
        downloadProgress={downloadProgress}
        onCheckUpdate={handleCheckUpdate}
        onDownloadUpdate={handleDownloadUpdate}
        onInstallUpdate={handleInstallUpdate}
      />
      <div className="flex-1 overflow-hidden">
        <ChatWindow messages={messages} />
      </div>
      <div className="border-t bg-white p-4">
        <div className="flex gap-2 mb-3">
          {(['all', 'chatgpt', 'gemini'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                target === t
                  ? t === 'all'
                    ? 'bg-human-600 text-white'
                    : t === 'chatgpt'
                    ? 'bg-chatgpt-600 text-white'
                    : 'bg-gemini-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? '全部' : t === 'chatgpt' ? 'ChatGPT' : 'Gemini'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="输入消息... (Enter 发送)"
            className="flex-1 resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-human-500 focus:outline-none focus:ring-1 focus:ring-human-500"
            rows={3}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="rounded-lg bg-human-600 px-6 py-2 text-white transition-colors hover:bg-human-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSending ? '发送中...' : '发送'}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            Phase 3: 群聊上下文已启用 |
            ChatGPT: {botStatus.chatGPT ? '✅' : '⏳'} |
            Gemini: {botStatus.gemini ? '✅' : '⏳'}
          </span>
          <span>{stats.totalMessages} 条消息</span>
        </div>
      </div>
    </div>
  )
}

export default App
