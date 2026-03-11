import { Message } from './index'

/**
 * 群聊消息路由与上下文管理
 *
 * Phase 3 核心功能：
 * 1. 维护全局消息历史
 * 2. 实现上下文拼接逻辑（发给 AI 前拼接群聊上下文）
 * 3. 智能消息路由决策
 */

export interface RoutedMessage {
  target: 'chatgpt' | 'gemini'
  content: string  // 拼接了上下文的完整消息
  originalContent: string  // 原始消息内容
}

export class ChatRouter {
  private messageHistory: Message[] = []
  private maxContextLength: number = 10  // 保留最近10条消息作为上下文
  private maxContentLength: number = 4000  // 单条消息最大长度

  constructor(maxContextLength?: number) {
    if (maxContextLength) {
      this.maxContextLength = maxContextLength
    }
  }

  /**
   * 添加消息到历史
   */
  addMessage(message: Message): void {
    this.messageHistory.push(message)

    // 限制历史长度
    if (this.messageHistory.length > this.maxContextLength) {
      this.messageHistory = this.messageHistory.slice(-this.maxContextLength)
    }
  }

  /**
   * 获取完整消息历史
   */
  getHistory(): Message[] {
    return [...this.messageHistory]
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.messageHistory = []
  }

  /**
   * 格式化单条消息为字符串
   */
  private formatMessage(msg: Message): string {
    const sender = this.getSenderName(msg.sender)
    return `[${sender}]: ${msg.content}`
  }

  /**
   * 获取发送者显示名称
   */
  private getSenderName(sender: Message['sender']): string {
    switch (sender) {
      case 'human':
        return 'Human'
      case 'chatgpt':
        return 'ChatGPT'
      case 'gemini':
        return 'Gemini'
      default:
        return 'Unknown'
    }
  }

  /**
   * 构建群聊上下文
   *
   * 格式示例：
   * [Human]: 你好
   * [ChatGPT]: 你好！有什么我可以帮助你的吗？
   * [Gemini]: 你好！我也在这里，随时准备协助。
   * [Human]: 你们能一起帮我写代码吗？
   */
  private buildContext(excludeSender?: Message['sender']): string {
    if (this.messageHistory.length === 0) {
      return ''
    }

    const contextLines = this.messageHistory
      .filter((msg) => msg.sender !== excludeSender)  // 可选：排除特定发送者的消息
      .map((msg) => this.formatMessage(msg))

    return contextLines.join('\n')
  }

  /**
   * 构建发送给特定 AI 的消息
   *
   * 策略：
   * 1. 包含所有群聊历史
   * 2. 在末尾添加当前用户输入
   * 3. 可选：添加角色提示
   */
  buildMessageForAI(
    target: 'chatgpt' | 'gemini',
    userMessage: string,
    options: {
      includeHistory?: boolean
      addRolePrompt?: boolean
    } = {}
  ): string {
    const { includeHistory = true, addRolePrompt = true } = options

    let parts: string[] = []

    // 1. 角色提示（可选）
    if (addRolePrompt) {
      const otherAI = target === 'chatgpt' ? 'Gemini' : 'ChatGPT'
      parts.push(
        `You are participating in a group chat with a Human and ${otherAI}. ` +
        `Please respond naturally as part of this conversation. ` +
        `You can agree with, disagree with, or build upon what ${otherAI} says.`
      )
      parts.push('')  // 空行
    }

    // 2. 群聊上下文（可选）
    if (includeHistory && this.messageHistory.length > 0) {
      parts.push('=== Group Chat History ===')
      parts.push(this.buildContext())
      parts.push('')  // 空行
    }

    // 3. 当前用户消息
    parts.push('=== Your Turn ===')
    parts.push(`[Human]: ${userMessage}`)
    parts.push('')  // 空行
    parts.push(`Please respond as ${target === 'chatgpt' ? 'ChatGPT' : 'Gemini'}:`)

    const fullMessage = parts.join('\n')

    // 截断超长内容
    if (fullMessage.length > this.maxContentLength) {
      return this.truncateMessage(fullMessage)
    }

    return fullMessage
  }

  /**
   * 为单个 AI 构建简洁消息（不添加过多上下文提示）
   *
   * 适用于直接发送的场景
   */
  buildSimpleMessage(target: 'chatgpt' | 'gemini', userMessage: string): string {
    const otherAI = target === 'chatgpt' ? 'Gemini' : 'ChatGPT'

    const parts: string[] = []

    // 添加上下文（如果有）
    if (this.messageHistory.length > 0) {
      parts.push('Previous conversation:')
      parts.push(this.buildContext())
      parts.push('')
    }

    parts.push(`[Human]: ${userMessage}`)

    // 提示这是群聊
    parts.push(`\n(Note: ${otherAI} is also in this group chat and may respond too)`)

    const fullMessage = parts.join('\n')

    if (fullMessage.length > this.maxContentLength) {
      return this.truncateMessage(fullMessage)
    }

    return fullMessage
  }

  /**
   * 截断超长消息
   */
  private truncateMessage(message: string): string {
    const truncated = message.slice(0, this.maxContentLength - 100)
    return truncated + '\n\n[Message truncated due to length...]'
  }

  /**
   * 路由消息到 AI
   *
   * 返回需要发送给各个 AI 的消息
   */
  routeMessage(
    userMessage: string,
    target: 'all' | 'chatgpt' | 'gemini' = 'all'
  ): RoutedMessage[] {
    const routes: RoutedMessage[] = []

    // 先添加用户消息到历史
    this.addMessage({
      id: `human_${Date.now()}`,
      sender: 'human',
      content: userMessage,
      timestamp: Date.now(),
    })

    // 构建路由
    if (target === 'all' || target === 'chatgpt') {
      routes.push({
        target: 'chatgpt',
        content: this.buildSimpleMessage('chatgpt', userMessage),
        originalContent: userMessage,
      })
    }

    if (target === 'all' || target === 'gemini') {
      routes.push({
        target: 'gemini',
        content: this.buildSimpleMessage('gemini', userMessage),
        originalContent: userMessage,
      })
    }

    return routes
  }

  /**
   * 处理 AI 回复
   *
   * 将 AI 回复添加到历史，并返回格式化后的消息
   */
  handleAIResponse(
    sender: 'chatgpt' | 'gemini',
    content: string
  ): Message {
    const message: Message = {
      id: `${sender}_${Date.now()}`,
      sender,
      content,
      timestamp: Date.now(),
    }

    this.addMessage(message)
    return message
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalMessages: number
    humanMessages: number
    chatGPTMessages: number
    geminiMessages: number
  } {
    return {
      totalMessages: this.messageHistory.length,
      humanMessages: this.messageHistory.filter((m) => m.sender === 'human').length,
      chatGPTMessages: this.messageHistory.filter((m) => m.sender === 'chatgpt').length,
      geminiMessages: this.messageHistory.filter((m) => m.sender === 'gemini').length,
    }
  }
}
