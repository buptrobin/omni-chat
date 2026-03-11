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
