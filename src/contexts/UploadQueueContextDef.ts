import type { UploadQueueContextValue } from './uploadQueueTypes'
import { createContext } from 'react'

export const UploadQueueContext = createContext<UploadQueueContextValue | null>(null)
