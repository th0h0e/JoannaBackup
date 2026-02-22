import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUploadQueue } from '../../contexts/UploadQueueContext'

export default function UploadQueueIndicator() {
  const { items, isProcessing, retryItem, removeItem, clearCompleted }
    = useUploadQueue()
  const [isExpanded, setIsExpanded] = useState(false)

  const pendingCount = items.filter(i => i.status === 'pending').length
  const uploadingCount = items.filter(i => i.status === 'uploading').length
  const completedCount = items.filter(i => i.status === 'completed').length
  const failedCount = items.filter(i => i.status === 'failed').length
  const totalActive = pendingCount + uploadingCount

  if (items.length === 0)
    return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-muted-foreground hover:text-foreground relative"
        aria-label="Upload queue"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        {totalActive > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium">
            {totalActive}
          </span>
        )}

        {failedCount > 0 && totalActive === 0 && (
          <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium">
            {failedCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-popover border-border absolute right-0 top-full z-50 mt-2 w-80 rounded-sm border shadow-lg"
          >
            <div className="border-border border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {isProcessing
                    ? `Uploading (${uploadingCount}/${pendingCount + uploadingCount})`
                    : 'Upload Queue'}
                </h3>
                {completedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCompleted}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {items.length === 0
                ? (
                    <div className="text-muted-foreground px-4 py-6 text-center text-sm">
                      No uploads in queue
                    </div>
                  )
                : (
                    <div className="divide-y divide-border">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <div className="flex-shrink-0">
                            {item.status === 'completed' && (
                              <svg
                                className="h-4 w-4 text-green-500"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {item.status === 'uploading' && (
                              <svg
                                className="text-primary h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                              </svg>
                            )}
                            {item.status === 'pending' && (
                              <div className="bg-muted h-4 w-4 rounded-full" />
                            )}
                            {item.status === 'failed' && (
                              <svg
                                className="h-4 w-4 text-destructive"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                              </svg>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{item.file.name}</p>
                            <p className="text-muted-foreground truncate text-xs">
                              {item.projectName}
                            </p>
                            {item.status === 'failed' && item.error && (
                              <p className="text-destructive mt-1 text-xs">
                                {item.error}
                              </p>
                            )}
                          </div>

                          {item.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => retryItem(item.id)}
                              className="h-7 px-2 text-xs"
                            >
                              Retry
                            </Button>
                          )}

                          {(item.status === 'completed'
                            || item.status === 'failed') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="h-7 px-2 text-xs opacity-50 hover:opacity-100"
                            >
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
