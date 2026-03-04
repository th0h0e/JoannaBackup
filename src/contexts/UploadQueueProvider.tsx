import type { ReactNode } from 'react'
import type { QueueItem } from './uploadQueueTypes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import pb, { incrementServerDataVersion } from '../config/pocketbase'
import { UploadQueueContext } from './UploadQueueContextDef'

const STORAGE_KEY = 'upload_queue_items'
const MAX_RETRIES = 3

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Load queue items from storage.
 * NOTE: File objects cannot be serialized, so we only load metadata.
 * Items without valid files are marked as 'lost' and should be re-selected.
 */
function loadFromStorage(): QueueItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored)
      return []

    // Clear stale data - files can't be restored from localStorage
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
  catch {
    return []
  }
}

/**
 * Save queue items to storage.
 * NOTE: We don't persist items with File objects since they can't be serialized.
 * The upload queue is session-only - users must re-select files after refresh.
 */
function saveToStorage(_items: QueueItem[]): void {
  // Clear any stale data - don't persist items with File objects
  // as they cannot be serialized and are useless without the actual file
  localStorage.removeItem(STORAGE_KEY)
}

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QueueItem[]>(loadFromStorage)
  const [isProcessing, setIsProcessing] = useState(false)
  const processingRef = useRef(false)
  const itemsRef = useRef(items)
  const completedProjectIdsRef = useRef<Set<string>>(new Set())

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
        await incrementServerDataVersion()
      }
    }
  }, [])

  useEffect(() => {
    const pendingCount = items.filter(i => i.status === 'pending').length
    if (pendingCount > 0 && !processingRef.current) {
      processQueue()
    }
  }, [items, processQueue])

  const verifyProjectImageCount = useCallback(async (projectId: string, projectName: string) => {
    try {
      const project = await pb.collection('Portfolio_Projects').getOne(projectId)
      const imageCount = project.Images?.length || 0
      if (imageCount < 3) {
        toast.warning(`Project "${projectName}" has only ${imageCount} images (minimum: 3)`)
      }
    }
    catch (err) {
      console.warn('Failed to verify project image count:', err)
    }
  }, [])

  // Track project upload completion and show toast notifications
  useEffect(() => {
    // Group items by project
    const projectGroups = items.reduce((acc, item) => {
      if (!acc[item.projectId]) {
        acc[item.projectId] = []
      }
      acc[item.projectId].push(item)
      return acc
    }, {} as Record<string, QueueItem[]>)

    // Check each project for completion
    for (const [projectId, projectItems] of Object.entries(projectGroups)) {
      const allDone = projectItems.every(
        i => i.status === 'completed' || i.status === 'failed',
      )

      // Skip if not all done or already notified
      if (!allDone || completedProjectIdsRef.current.has(projectId)) {
        continue
      }

      // Mark as notified
      completedProjectIdsRef.current.add(projectId)

      const projectName = projectItems[0].projectName
      const successCount = projectItems.filter(i => i.status === 'completed').length
      const failedCount = projectItems.filter(i => i.status === 'failed').length

      // Show appropriate toast
      if (failedCount === 0) {
        toast.success(`All ${successCount} images uploaded for "${projectName}"`)
      }
      else {
        toast.error(`${failedCount} image(s) failed to upload for "${projectName}"`)
      }

      // Verify minimum images after successful uploads
      if (successCount > 0) {
        verifyProjectImageCount(projectId, projectName)
      }
    }
  }, [items, verifyProjectImageCount])

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
