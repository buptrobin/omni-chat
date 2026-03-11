import { app } from 'electron'
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater'
import { EventEmitter } from 'events'

/**
 * UpdateChecker 事件类型定义
 */
export interface UpdateCheckerEvents {
  'checking-for-update': () => void
  'update-available': (info: UpdateInfo) => void
  'update-not-available': (info: UpdateInfo) => void
  'download-progress': (progress: ProgressInfo) => void
  'update-downloaded': (info: UpdateInfo) => void
  'error': (error: Error) => void
}

/**
 * 更新状态枚举
 */
export enum UpdateState {
  Idle = 'idle',
  Checking = 'checking',
  Available = 'available',
  NotAvailable = 'not-available',
  Downloading = 'downloading',
  Downloaded = 'downloaded',
  Error = 'error'
}

/**
 * 更新检查器配置选项
 */
export interface UpdateCheckerOptions {
  /** 是否自动下载更新 */
  autoDownload?: boolean
  /** 是否允许预发布版本 */
  allowPrerelease?: boolean
  /** 检查间隔（毫秒） */
  checkInterval?: number
  /** 自定义更新服务器 URL */
  feedUrl?: string
}

/**
 * 更新检查器类
 * 封装 electron-updater 提供自动更新功能
 *
 * @example
 * const checker = new UpdateChecker()
 * checker.on('update-available', (info) => console.log('新版本可用:', info.version))
 * checker.checkForUpdates()
 */
export class UpdateChecker extends EventEmitter {
  private state: UpdateState = UpdateState.Idle
  private updateInfo: UpdateInfo | null = null
  private options: UpdateCheckerOptions
  private checkTimer: NodeJS.Timeout | null = null

  /**
   * 创建更新检查器实例
   * @param options 配置选项
   */
  constructor(options: UpdateCheckerOptions = {}) {
    super()
    this.options = {
      autoDownload: false,
      allowPrerelease: false,
      checkInterval: 0,
      ...options
    }

    this.setupAutoUpdater()
  }

  // 类型重载声明
  on<K extends keyof UpdateCheckerEvents>(event: K, listener: UpdateCheckerEvents[K]): this
  on(event: string | symbol, listener: (...args: any[]) => void): this
  on<K extends keyof UpdateCheckerEvents>(event: K, listener: UpdateCheckerEvents[K]): this {
    return super.on(event, listener)
  }

  emit<K extends keyof UpdateCheckerEvents>(event: K, ...args: Parameters<UpdateCheckerEvents[K]>): boolean
  emit(event: string | symbol, ...args: any[]): boolean
  emit<K extends keyof UpdateCheckerEvents>(event: K, ...args: Parameters<UpdateCheckerEvents[K]>): boolean {
    return super.emit(event, ...args)
  }

  /**
   * 配置 autoUpdater
   */
  private setupAutoUpdater(): void {
    // 设置自动下载
    autoUpdater.autoDownload = this.options.autoDownload ?? false
    autoUpdater.allowPrerelease = this.options.allowPrerelease ?? false

    // 配置自定义更新服务器（如果有）
    if (this.options.feedUrl) {
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: this.options.feedUrl
      })
    }

    // 注册事件监听器
    autoUpdater.on('checking-for-update', () => {
      this.state = UpdateState.Checking
      this.emit('checking-for-update')
      console.log('[UpdateChecker] 正在检查更新...')
    })

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.state = UpdateState.Available
      this.updateInfo = info
      this.emit('update-available', info)
      console.log('[UpdateChecker] 发现新版本:', info.version)
    })

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      this.state = UpdateState.NotAvailable
      this.emit('update-not-available', info)
      console.log('[UpdateChecker] 当前已是最新版本:', info.version)
    })

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.state = UpdateState.Downloading
      this.emit('download-progress', progress)
      console.log(`[UpdateChecker] 下载进度: ${Math.round(progress.percent)}%`)
    })

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.state = UpdateState.Downloaded
      this.updateInfo = info
      this.emit('update-downloaded', info)
      console.log('[UpdateChecker] 更新已下载:', info.version)
    })

    autoUpdater.on('error', (error: Error) => {
      this.state = UpdateState.Error
      this.emit('error', error)
      console.error('[UpdateChecker] 更新错误:', error.message)
    })
  }

  /**
   * 检查是否有新版本
   * @returns Promise<UpdateInfo | null> 如果有更新返回更新信息，否则返回 null
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      const result = await autoUpdater.checkForUpdates()
      return result?.updateInfo ?? null
    } catch (error) {
      this.emit('error', error as Error)
      console.error('[UpdateChecker] 检查更新失败:', error)
      return null
    }
  }

  /**
   * 下载更新
   * @returns Promise<void>
   */
  async downloadUpdate(): Promise<void> {
    if (this.state !== UpdateState.Available && this.state !== UpdateState.Idle) {
      throw new Error(`无法下载更新: 当前状态为 ${this.state}`)
    }

    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      this.emit('error', error as Error)
      console.error('[UpdateChecker] 下载更新失败:', error)
      throw error
    }
  }

  /**
   * 安装更新（退出应用并安装）
   * @param isSilent 是否静默安装（Windows 有效）
   */
  installUpdate(isSilent: boolean = false): void {
    if (this.state !== UpdateState.Downloaded) {
      throw new Error('没有已下载的更新可供安装')
    }

    console.log('[UpdateChecker] 正在退出并安装更新...')
    autoUpdater.quitAndInstall(isSilent)
  }

  /**
   * 获取当前应用版本
   * @returns string 当前版本号
   */
  getCurrentVersion(): string {
    return app.getVersion()
  }

  /**
   * 获取当前更新状态
   * @returns UpdateState
   */
  getState(): UpdateState {
    return this.state
  }

  /**
   * 获取可用的更新信息
   * @returns UpdateInfo | null
   */
  getUpdateInfo(): UpdateInfo | null {
    return this.updateInfo
  }

  /**
   * 检查是否有可用的更新
   * @returns boolean
   */
  isUpdateAvailable(): boolean {
    return this.state === UpdateState.Available
  }

  /**
   * 检查更新是否已下载
   * @returns boolean
   */
  isUpdateDownloaded(): boolean {
    return this.state === UpdateState.Downloaded
  }

  /**
   * 启动定期检查
   * @param intervalMs 检查间隔（毫秒），默认 1 小时
   */
  startPeriodicCheck(intervalMs: number = 3600000): void {
    this.stopPeriodicCheck()

    const interval = intervalMs || this.options.checkInterval || 3600000

    console.log(`[UpdateChecker] 启动定期检查，间隔: ${interval}ms`)

    // 立即执行一次检查
    this.checkForUpdates()

    // 设置定时器
    this.checkTimer = setInterval(() => {
      this.checkForUpdates()
    }, interval)
  }

  /**
   * 停止定期检查
   */
  stopPeriodicCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
      console.log('[UpdateChecker] 停止定期检查')
    }
  }

  /**
   * 销毁更新检查器
   * 清理定时器和事件监听器
   */
  destroy(): void {
    this.stopPeriodicCheck()
    this.removeAllListeners()

    // 移除 autoUpdater 事件监听器
    autoUpdater.removeAllListeners('checking-for-update')
    autoUpdater.removeAllListeners('update-available')
    autoUpdater.removeAllListeners('update-not-available')
    autoUpdater.removeAllListeners('download-progress')
    autoUpdater.removeAllListeners('update-downloaded')
    autoUpdater.removeAllListeners('error')

    console.log('[UpdateChecker] 已销毁')
  }
}

/**
 * 创建更新检查器实例的工厂函数
 * @param options 配置选项
 * @returns UpdateChecker 实例
 */
export function createUpdateChecker(options?: UpdateCheckerOptions): UpdateChecker {
  return new UpdateChecker(options)
}

export default UpdateChecker
