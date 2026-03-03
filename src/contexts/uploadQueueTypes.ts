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

export interface UploadQueueContextValue {
  items: QueueItem[]
  isProcessing: boolean
  addToQueue: (projectId: string, projectName: string, files: File[]) => void
  retryItem: (itemId: string) => void
  removeItem: (itemId: string) => void
  clearCompleted: () => void
  getProjectItems: (projectId: string) => QueueItem[]
}
