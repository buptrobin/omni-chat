import React, { useRef, useEffect } from 'react'
import { Message } from '../types'

interface ChatWindowProps {
  messages: Message[]
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getSenderConfig = (sender: Message['sender']) => {
    switch (sender) {
      case 'human':
        return {
          name: '你',
          color: 'bg-human-500',
          bgColor: 'bg-human-50',
          textColor: 'text-human-700',
          borderColor: 'border-human-200',
          align: 'items-end',
        }
      case 'chatgpt':
        return {
          name: 'ChatGPT',
          color: 'bg-chatgpt-500',
          bgColor: 'bg-chatgpt-50',
          textColor: 'text-chatgpt-700',
          borderColor: 'border-chatgpt-200',
          align: 'items-start',
        }
      case 'gemini':
        return {
          name: 'Gemini',
          color: 'bg-gemini-500',
          bgColor: 'bg-gemini-50',
          textColor: 'text-gemini-700',
          borderColor: 'border-gemini-200',
          align: 'items-start',
        }
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-gray-400">
          <div className="mb-4 text-6xl">💬</div>
          <p className="text-lg">开始群聊吧</p>
          <p className="mt-2 text-sm">你的消息将同时发送给 ChatGPT 和 Gemini</p>
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-500 max-w-md">
            <p className="font-medium mb-2">💡 使用提示：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>首次使用需要在 ChatGPT/Gemini 窗口中登录</li>
              <li>点击状态栏的「显示」按钮打开登录窗口</li>
              <li>登录后点击「隐藏」将窗口转入后台</li>
              <li>支持选择发送目标：全部/ChatGPT/Gemini</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => {
            const config = getSenderConfig(message.sender)
            const isFirstOfType =
              index === 0 || messages[index - 1].sender !== message.sender

            return (
              <div
                key={message.id}
                className={`flex flex-col ${config.align} animate-fade-in`}
              >
                {/* 发送者标签（每种类型的第一条消息显示） */}
                {isFirstOfType && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-2 w-2 rounded-full ${config.color}`} />
                    <span className={`text-xs font-medium ${config.textColor}`}>
                      {config.name}
                    </span>
                  </div>
                )}

                {/* 消息气泡 */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${config.bgColor} border ${config.borderColor}`}
                >
                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${config.textColor}`}>
                    {message.content}
                  </p>
                  <span className={`mt-1 block text-[10px] opacity-60 ${config.textColor}`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ChatWindow
