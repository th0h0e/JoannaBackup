export interface PreloadProgress {
  loadedSections: number
  totalSections: number
  loadedImages: number
  totalImages: number
  currentBatch: number
  totalBatches: number
  isReady: boolean
}

export interface PreloadConfig {
  imagesBySection: string[][]
  batchSize: number
  onProgress?: (progress: PreloadProgress) => void
  onSectionReady?: (sectionIndex: number) => void
  onReady?: () => void
}

type PreloadEventType = 'progress' | 'sectionReady' | 'ready'
type PreloadEventCallback = (data: unknown) => void

class ImagePreloader {
  private loadedUrls: Set<string> = new Set()
  private pendingUrls: Set<string> = new Set()
  private eventListeners: Map<PreloadEventType, Set<PreloadEventCallback>> = new Map()
  private aborted: boolean = false

  preloadImage(url: string): Promise<void> {
    if (this.loadedUrls.has(url) || this.pendingUrls.has(url)) {
      return Promise.resolve()
    }

    this.pendingUrls.add(url)

    return new Promise((resolve) => {
      const img = new Image()

      img.onload = () => {
        this.loadedUrls.add(url)
        this.pendingUrls.delete(url)
        resolve()
      }

      img.onerror = () => {
        this.pendingUrls.delete(url)
        console.warn(`Failed to preload image: ${url}`)
        resolve()
      }

      img.src = url
    })
  }

  preloadBatch(urls: string[]): Promise<void[]> {
    return Promise.all(urls.map(url => this.preloadImage(url)))
  }

  async preloadSections(config: PreloadConfig): Promise<void> {
    const { imagesBySection, batchSize, onProgress, onSectionReady, onReady } = config
    const totalSections = imagesBySection.length
    const totalImages = imagesBySection.reduce((sum, section) => sum + section.length, 0)
    const totalBatches = Math.ceil(totalSections / batchSize)
    let loadedImages = 0
    let loadedSections = 0

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      if (this.aborted)
        break

      const startSection = batchIndex * batchSize
      const endSection = Math.min(startSection + batchSize, totalSections)

      for (let sectionIndex = startSection; sectionIndex < endSection; sectionIndex++) {
        if (this.aborted)
          break

        const sectionImages = imagesBySection[sectionIndex]
        await this.preloadBatch(sectionImages)

        loadedImages += sectionImages.length
        loadedSections++

        onSectionReady?.(sectionIndex)
        this.emit('sectionReady', sectionIndex)

        onProgress?.({
          loadedSections,
          totalSections,
          loadedImages,
          totalImages,
          currentBatch: batchIndex + 1,
          totalBatches,
          isReady: loadedSections >= Math.min(batchSize, totalSections),
        })

        this.emit('progress', {
          loadedSections,
          totalSections,
          loadedImages,
          totalImages,
          currentBatch: batchIndex + 1,
          totalBatches,
          isReady: loadedSections >= Math.min(batchSize, totalSections),
        })
      }
    }

    onReady?.()
    this.emit('ready', undefined)
  }

  isLoaded(url: string): boolean {
    return this.loadedUrls.has(url)
  }

  abort(): void {
    this.aborted = true
  }

  reset(): void {
    this.aborted = false
    this.pendingUrls.clear()
  }

  on(event: PreloadEventType, callback: PreloadEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)

    return () => {
      this.eventListeners.get(event)?.delete(callback)
    }
  }

  private emit(event: PreloadEventType, data: unknown): void {
    const callbacks = this.eventListeners.get(event)
    callbacks?.forEach(cb => cb(data))
  }
}

export const imagePreloader = new ImagePreloader()
