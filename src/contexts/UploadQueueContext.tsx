import type { ReactNode } from 'react'
import { createContext, use, useCallback, useEffect, useRef, useState } from 'react'
import pb, { clearCache } from '../config/pocketbase'

export interface QueueItem {
  id: string
  projectId: string
  projectName: string
  file: File
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  error?: string
  retries: number
  resultFilename?: string
}

interface UploadQueueContextValue {
  items: QueueItem[]
  isProcessing: boolean
  addToQueue: (projectId: string, projectName: string, files: File[]) => void
  retryItem: (itemId: string) => void
  removeItem: (itemId: string) => void
  clearCompleted: () => void
  getProjectItems: (projectId: string) => QueueItem[]
}

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null)

const STORAGE_KEY = 'upload_queue_items'
const MAX_RETRIES = 3

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function loadFromStorage(): QueueItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored)
      return []

    const items = JSON.parse(stored)
    return items.filter((item: QueueItem) =>
      item.status === 'pending' || item.status === 'failed',
    )
  }
  catch {
    return []
  }
}

function saveToStorage(items: QueueItem[]): void {
  try {
    const toStore = items.filter(item =>
      item.status === 'pending' || item.status === 'failed',
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  }
  catch (error) {
    console.warn('Failed to save upload queue:', error)
  }
}

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QueueItem[]>(loadFromStorage)
  const [isProcessing, setIsProcessing] = useState(false)
  const processingRef = useRef(false)
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    saveToStorage(items)
  }, [items])

  const processQueue = useCallback(async () => {
    if (processingRef.current)
      return

    const pendingItems = itemsRef.current.filter(item => item.status === 'pending')
    if (pendingItems.length === 0)
      return

    processingRef.current = true
    setIsProcessing(true)

    for (const item of pendingItems) {
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'uploading' as const } : i,
      ))

      try {
        const result = await pb.collection('Portfolio_Projects').update(
          item.projectId,
          { 'Images+': item.file },
        )

        if (!result.Images || result.Images.length === 0) {
          throw new Error('No images in response')
        }

        setItems(prev => prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                status: 'completed' as const,
                resultFilename: result.Images[result.Images.length - 1],
              }
            : i,
        ))
      }
      catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed'

        setItems(prev => prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                status: 'failed' as const,
                error: errorMsg,
                retries: i.retries + 1,
              }
            : i,
        ))
      }
    }

    processingRef.current = false
    setIsProcessing(false)

    const remainingPending = itemsRef.current.filter(i => i.status === 'pending')
    if (remainingPending.length === 0) {
      const hasCompleted = itemsRef.current.some(i => i.status === 'completed')
      if (hasCompleted) {
        clearCache('Portfolio_Projects')
      }
    }
  }, [])

  useEffect(() => {
    const pendingCount = items.filter(i => i.status === 'pending').length
    if (pendingCount > 0 && !processingRef.current) {
      processQueue()
    }
  }, [items, processQueue])

  const addToQueue = useCallback((projectId: string, projectName: string, files: File[]) => {
    const newItems: QueueItem[] = files.map(file => ({
      id: generateId(),
      projectId,
      projectName,
      file,
      status: 'pending' as const,
      retries: 0,
    }))

    setItems(prev => [...prev, ...newItems])
  }, [])

  const retryItem = useCallback((itemId: string) => {
    setItems(prev => prev.map((item) => {
      if (item.id !== itemId)
        return item
      if (item.retries >= MAX_RETRIES)
        return item

      return {
        ...item,
        status: 'pending' as const,
        error: undefined,
      }
    }))
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  const clearCompleted = useCallback(() => {
    setItems(prev => prev.filter(item => item.status !== 'completed'))
  }, [])

  const getProjectItems = useCallback((projectId: string) => {
    return items.filter(item => item.projectId === projectId)
  }, [items])

  return (
    <UploadQueueContext value={{
      items,
      isProcessing,
      addToQueue,
      retryItem,
      removeItem,
      clearCompleted,
      getProjectItems,
    }}
    >
      {children}
    </UploadQueueContext>
  )
}

export function useUploadQueue() {
  const context = use(UploadQueueContext)
  if (!context) {
    throw new Error('useUploadQueue must be used within UploadQueueProvider')
  }
  return context
}
