import React from 'react'
import { ChatStats } from '../types'

interface StatusBarProps {
  windowStatus: { main: boolean; chatGPT: boolean; gemini: boolean }
  botStatus: { chatGPT: boolean; gemini: boolean }
  stats: ChatStats
  onToggleVisibility: (window: string, visible: boolean) => void
  onReload: (window: string) => void
  onClearHistory: () => void
}

const StatusBar: React.FC<StatusBarProps> = ({
  windowStatus, botStatus, stats, onToggleVisibility, onReload, onClearHistory
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
