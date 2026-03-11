import { WebContents } from 'electron'

export interface ChatGPTMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export class ChatGPTBot {
  private webContents: WebContents
  private isReady: boolean = false
  private messageListeners: ((message: ChatGPTMessage) => void)[] = []

  constructor(webContents: WebContents) {
    this.webContents = webContents
    this.setupReadyCheck()
  }

  // 检查页面是否准备好
  private setupReadyCheck(): void {
    const checkInterval = setInterval(async () => {
      try {
        const isLoaded = await this.webContents.executeJavaScript(`
          !!document.querySelector('#prompt-textarea') ||
          !!document.querySelector('[data-testid="text-input"]') ||
          !!document.querySelector('textarea[placeholder*="Message"]')
        `)

        if (isLoaded && !this.isReady) {
          this.isReady = true
          console.log('[ChatGPTBot] Page is ready for interaction')
          this.setupMessageObserver()
          clearInterval(checkInterval)
        }
      } catch (error) {
        console.log('[ChatGPTBot] Page not ready yet')
      }
    }, 2000)
  }

  // 设置消息监听
  private setupMessageObserver(): void {
    const observerScript = `
      (function() {
        if (window.__chatgptObserverInstalled) return;
        window.__chatgptObserverInstalled = true;

        console.log('[ChatGPT Inject] Setting up message observer');

        // 存储最后处理的回复
        window.__lastProcessedReply = '';

        // 查找所有消息元素
        function findMessages() {
          const messages = [];

          // 尝试多种选择器
          const selectors = [
            '[data-testid="conversation-turn-2"] .markdown',
            '[data-message-author-role="assistant"] .markdown',
            '.group .prose',
            '[data-testid="model-turn"] .markdown'
          ];

          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              const lastElement = elements[elements.length - 1];
              const text = lastElement.textContent?.trim();
              if (text && text !== window.__lastProcessedReply) {
                window.__lastProcessedReply = text;
                return {
                  id: Date.now().toString(),
                  content: text,
                  timestamp: Date.now()
                };
              }
            }
          }
          return null;
        }

        // 定期检查新消息
        setInterval(() => {
          const message = findMessages();
          if (message) {
            console.log('[ChatGPT Inject] New message detected:', message.content.substring(0, 100));
            if (window.__chatgptMessageCallback) {
              window.__chatgptMessageCallback(message);
            }
          }
        }, 1000);

        console.log('[ChatGPT Inject] Observer installed successfully');
      })();

      // 暴露回调函数
      window.__chatgptMessageCallback = null;
      true;
    `

    this.webContents.executeJavaScript(observerScript).catch(console.error)

    // 监听来自页面的消息
    this.webContents.on('ipc-message', (event, channel, data) => {
      if (channel === 'chatgpt-message') {
        console.log('[ChatGPTBot] Received message from page:', data)
        this.notifyListeners({
          ...data,
          role: 'assistant',
        })
      }
    })
  }

  // 发送消息
  async sendMessage(text: string): Promise<boolean> {
    if (!this.isReady) {
      console.log('[ChatGPTBot] Not ready yet')
      return false
    }

    try {
      const result = await this.webContents.executeJavaScript(`
        (async function() {
          console.log('[ChatGPT Inject] Sending message:', '${text.replace(/'/g, "\\'")}');

          // 查找输入框 - 尝试多种选择器
          const inputSelectors = [
            '#prompt-textarea',
            '[data-testid="text-input"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="message"]'
          ];

          let inputElement = null;
          for (const selector of inputSelectors) {
            inputElement = document.querySelector(selector);
            if (inputElement) break;
          }

          if (!inputElement) {
            console.error('[ChatGPT Inject] Input element not found');
            return { success: false, error: 'Input element not found' };
          }

          console.log('[ChatGPT Inject] Found input element:', inputElement.tagName);

          // 模拟人类输入 - 逐字输入
          inputElement.focus();
          inputElement.click();

          // 清除现有内容
          inputElement.value = '';
          inputElement.dispatchEvent(new Event('input', { bubbles: true }));

          // 逐字输入
          const text = '${text.replace(/'/g, "\\'")}';
          for (let i = 0; i < text.length; i++) {
            inputElement.value += text[i];
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 10 + Math.random() * 20));
          }

          // 触发键盘事件
          inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          inputElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));

          // 查找发送按钮
          const buttonSelectors = [
            '[data-testid="send-button"]',
            'button[aria-label*="Send"]',
            'button:has(svg)'
          ];

          let sendButton = null;
          for (const selector of buttonSelectors) {
            const buttons = document.querySelectorAll(selector);
            for (const btn of buttons) {
              if (!btn.disabled && btn.offsetParent !== null) {
                sendButton = btn;
                break;
              }
            }
            if (sendButton) break;
          }

          // 发送消息
          if (sendButton && !sendButton.disabled) {
            console.log('[ChatGPT Inject] Clicking send button');
            sendButton.click();
            return { success: true };
          } else {
            // 尝试直接触发 Enter
            console.log('[ChatGPT Inject] Using Enter key to send');
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            inputElement.dispatchEvent(enterEvent);
            return { success: true };
          }
        })();
      `)

      console.log('[ChatGPTBot] Send result:', result)
      return result.success
    } catch (error) {
      console.error('[ChatGPTBot] Failed to send message:', error)
      return false
    }
  }

  // 获取历史消息
  async getHistory(): Promise<ChatGPTMessage[]> {
    try {
      const messages = await this.webContents.executeJavaScript(`
        (function() {
          const messages = [];

          // 尝试多种选择器查找对话
          const turnSelectors = [
            '[data-testid^="conversation-turn-"]',
            '[data-message-author-role]'
          ];

          let turns = [];
          for (const selector of turnSelectors) {
            turns = document.querySelectorAll(selector);
            if (turns.length > 0) break;
          }

          turns.forEach((turn, index) => {
            const role = turn.getAttribute('data-message-author-role') ||
                        (turn.querySelector('.font-bold')?.textContent?.includes('You') ? 'user' : 'assistant');

            const contentEl = turn.querySelector('.markdown') ||
                             turn.querySelector('.whitespace-pre-wrap') ||
                             turn.querySelector('[class*="prose"]');

            if (contentEl) {
              messages.push({
                id: 'msg_' + index,
                role: role,
                content: contentEl.textContent.trim(),
                timestamp: Date.now() - (turns.length - index) * 1000
              });
            }
          });

          return messages;
        })();
      `)

      return messages
    } catch (error) {
      console.error('[ChatGPTBot] Failed to get history:', error)
      return []
    }
  }

  // 检查是否准备好
  isPageReady(): boolean {
    return this.isReady
  }

  // 重新加载页面
  reload(): void {
    this.isReady = false
    this.webContents.reload()
    this.setupReadyCheck()
  }

  // 监听消息
  onMessage(listener: (message: ChatGPTMessage) => void): () => void {
    this.messageListeners.push(listener)
    return () => {
      const index = this.messageListeners.indexOf(listener)
      if (index > -1) {
        this.messageListeners.splice(index, 1)
      }
    }
  }

  // 通知监听器
  private notifyListeners(message: ChatGPTMessage): void {
    this.messageListeners.forEach((listener) => listener(message))
  }
}
