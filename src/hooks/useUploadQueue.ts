import { use } from 'react'
import { UploadQueueContext } from '../contexts/UploadQueueContextDef'

export function useUploadQueue() {
  const context = use(UploadQueueContext)
  if (!context) {
    throw new Error('useUploadQueue must be used within UploadQueueProvider')
  }
  return context
}
