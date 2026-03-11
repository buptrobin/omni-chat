import { WebContents } from 'electron'

export interface GeminiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export class GeminiBot {
  private webContents: WebContents
  private isReady: boolean = false
  private messageListeners: ((message: GeminiMessage) => void)[] = []

  constructor(webContents: WebContents) {
    this.webContents = webContents
    this.setupReadyCheck()
  }

  private setupReadyCheck(): void {
    const checkInterval = setInterval(async () => {
      try {
        const isLoaded = await this.webContents.executeJavaScript(`
          !!document.querySelector('rich-textarea .ql-editor') ||
          !!document.querySelector('[contenteditable="true"]')
        `)

        if (isLoaded && !this.isReady) {
          this.isReady = true
          console.log('[GeminiBot] Page is ready')
          this.setupMessageObserver()
          clearInterval(checkInterval)
        }
      } catch (error) {
        console.log('[GeminiBot] Page not ready yet')
      }
    }, 2000)
  }

  private setupMessageObserver(): void {
    const script = `
      (function() {
        if (window.__geminiObserver) return;
        window.__geminiObserver = true;
        console.log('[Gemini] Observer installed');
      })();
    `
    this.webContents.executeJavaScript(script).catch(console.error)
  }

  async sendMessage(text: string): Promise<boolean> {
    if (!this.isReady) return false
    try {
      const result = await this.webContents.executeJavaScript(`
        (async function() {
          const input = document.querySelector('rich-textarea .ql-editor') ||
                       document.querySelector('[contenteditable="true"]');
          if (!input) return { success: false };
          
          input.focus();
          input.textContent = '${text.replace(/'/g, "\\'")}';
          input.dispatchEvent(new InputEvent('input', { bubbles: true }));
          
          // Try to find and click send button
          const sendBtn = document.querySelector('button[aria-label*="Send"]');
          if (sendBtn) {
            sendBtn.click();
            return { success: true };
          }
          
          // Fallback to Enter key
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          return { success: true };
        })()
      `)
      return result.success
    } catch (error) {
      console.error('[GeminiBot] Send failed:', error)
      return false
    }
  }

  isPageReady(): boolean {
    return this.isReady
  }

  onMessage(listener: (message: GeminiMessage) => void): () => void {
    this.messageListeners.push(listener)
    return () => {
      const idx = this.messageListeners.indexOf(listener)
      if (idx > -1) this.messageListeners.splice(idx, 1)
    }
  }
}
