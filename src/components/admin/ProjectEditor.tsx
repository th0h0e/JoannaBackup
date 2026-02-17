import type { PortfolioProject } from '../../config/pocketbase'
import { useForm } from '@tanstack/react-form'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb, { getImageUrl } from '../../config/pocketbase'
import ProjectPopupPreview from './ProjectPopupPreview'

interface ProjectEditorProps {
  project: PortfolioProject | null
  onSave: () => void
  onCancel: () => void
  onShowToast: (message: string, type: 'success' | 'error') => void
}

interface ImageItem {
  id: string
  file?: File
  url: string
  filename: string
  isExisting: boolean
}

interface ProjectFormValues {
  title: string
  description: string
  order: number
  responsibilities: string[]
}

const MIN_IMAGES = 3

export default function ProjectEditor({ project, onSave, onCancel, onShowToast }: ProjectEditorProps) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [newResponsibility, setNewResponsibility] = useState('')
  const imagesRef = useRef<ImageItem[]>(images)

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (project && project.Images) {
      const existingImages: ImageItem[] = project.Images.map((filename, index) => ({
        id: `existing-${index}`,
        url: getImageUrl(project, filename),
        filename,
        isExisting: true,
      }))
      setImages(existingImages)
    }
  }, [project])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (!img.isExisting && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url)
        }
      })
    }
  }, [])

  const form = useForm({
    defaultValues: {
      title: project?.Title || '',
      description: project?.Description || '',
      order: project?.Order || 0,
      responsibilities: project?.Responsibility_json || project?.Responsibility || [],
    } as ProjectFormValues,
    onSubmit: async ({ value }) => {
      setLoading(true)

      try {
        const formData = new FormData()
        formData.append('Title', value.title)
        formData.append('Description', value.description)
        formData.append('Order', value.order.toString())

        value.responsibilities.forEach((resp) => {
          formData.append('Responsibility_json', resp)
        })

        if (project && images.length > 0) {
          if (project.Images && project.Images.length > 0) {
            project.Images.forEach((filename) => {
              formData.append('Images-', filename)
            })
          }

          for (const img of images) {
            if (img.file) {
              formData.append('Images', img.file)
            }
            else if (img.isExisting) {
              try {
                const response = await fetch(img.url)
                const blob = await response.blob()
                const file = new File([blob], img.filename, { type: blob.type })
                formData.append('Images', file)
              }
              catch (error) {
                console.error('Error downloading existing image:', error)
                throw new Error(`Failed to download image: ${img.filename}`)
              }
            }
          }
        }
        else {
          images.forEach((img) => {
            if (img.file) {
              formData.append('Images', img.file)
            }
          })
        }

        if (project) {
          await pb.collection('Portfolio_Projects').update(project.id, formData)
        }
        else {
          await pb.collection('Portfolio_Projects').create(formData)
        }

        onSave()
      }
      catch (err: unknown) {
        console.error('Error saving project:', err)

        const error = err as { status?: number, message?: string }
        if (error?.status === 401 || error?.status === 403) {
          onShowToast('Your session has expired. Please login again.', 'error')
          pb.authStore.clear()
          window.location.href = '/admin'
          return
        }

        onShowToast(`Failed to save project: ${error?.message || 'Unknown error'}`, 'error')
      }
      finally {
        setLoading(false)
      }
    },
  })

  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      form.setFieldValue('responsibilities', [...form.getFieldValue('responsibilities'), newResponsibility.trim().toUpperCase()])
      setNewResponsibility('')
    }
  }

  const handleRemoveResponsibility = (index: number) => {
    const current = form.getFieldValue('responsibilities')
    form.setFieldValue('responsibilities', current.filter((_, i) => i !== index))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files)
      return

    const newImages: ImageItem[] = Array.from(files).map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      file,
      url: URL.createObjectURL(file),
      filename: file.name,
      isExisting: false,
    }))

    setImages([...images, ...newImages])
  }

  const handleFileDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(true)
  }

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
  }

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0)
      return

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))

    const newImages: ImageItem[] = imageFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      file,
      url: URL.createObjectURL(file),
      filename: file.name,
      isExisting: false,
    }))

    setImages([...images, ...newImages])
  }

  const handleDeleteImage = (image: ImageItem) => {
    if (image.isExisting) {
      setImagesToDelete([...imagesToDelete, image.filename])
    }

    setImages(images.filter(img => img.id !== image.id))

    if (!image.isExisting) {
      URL.revokeObjectURL(image.url)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === index)
      return

    const newImages = [...images]
    const draggedItem = newImages[draggedIndex]

    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedItem)

    setImages(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const canSave = images.length >= MIN_IMAGES

  return createPortal(
    <AnimatePresence>
      <>
        <motion.div
          className="fixed inset-0 bg-muted/70 backdrop-blur-md z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onCancel}
        />

        {project && !isMobile && (
          <div
            className="absolute top-1/2"
            style={{
              left: '25%',
              transform: 'translate(-50%, -50%)',
              zIndex: 45,
              pointerEvents: 'none',
            }}
          >
            <ProjectPopupPreview
              projectTitle={form.getFieldValue('title')}
              projectDescription={form.getFieldValue('description')}
              projectResponsibility={form.getFieldValue('responsibilities')}
            />
          </div>
        )}

        <motion.div
          className="fixed right-0 top-0 w-3/4 md:w-2/3 lg:w-1/2 bg-popover backdrop-blur-xl border-l border-border z-50 flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ fontFamily: 'EnduroWeb, sans-serif', height: '100lvh' }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex flex-col h-full"
          >
            <div className="flex-shrink-0 p-8 border-b border-border backdrop-blur-sm">
              <h2 className="text-xl font-medium text-foreground tracking-tight">
                {project ? 'Edit Project' : 'New Project'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">
                {project ? 'Update project details and images' : 'Create a new portfolio project'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div>
                <Label className="block text-xs mb-3 uppercase tracking-wider">
                  Images (Drag to reorder)
                </Label>

                <div
                  onDragEnter={handleFileDragEnter}
                  onDragLeave={handleFileDragLeave}
                  onDragOver={handleFileDragOver}
                  onDrop={handleFileDrop}
                  className={`relative border-2 border-dashed rounded-sm transition-all ${
                    isDraggingFile
                      ? 'border-ring/50 bg-accent/50'
                      : 'border-border bg-muted/30'
                  } ${images.length === 0 ? 'cursor-pointer hover:border-ring/50 hover:bg-muted/50' : ''}`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="image-upload"
                    style={{ pointerEvents: images.length > 0 ? 'none' : 'auto' }}
                  />

                  {images.length === 0 && (
                    <label htmlFor="image-upload" className="block py-12 px-6 text-center cursor-pointer">
                      <div className="flex flex-col items-center gap-3">
                        <svg
                          className={`w-12 h-12 transition-colors ${
                            isDraggingFile ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <div>
                          <p className={`text-sm font-medium transition-colors ${
                            isDraggingFile ? 'text-foreground' : 'text-card-foreground'
                          } uppercase tracking-wide`}
                          >
                            {isDraggingFile ? 'Drop images here' : 'Drag & drop images'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 tracking-wide">
                            or click to browse
                          </p>
                        </div>
                      </div>
                    </label>
                  )}

                  {images.length > 0 && (
                    <div className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {images.map((image, index) => (
                          <div
                            key={image.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={e => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`relative group cursor-move border rounded-sm overflow-hidden ${
                              draggedIndex === index ? 'border-ring opacity-50' : 'border-border'
                            } hover:border-ring/50 transition-all`}
                          >
                            <div className="aspect-square bg-muted">
                              <img
                                src={image.url}
                                alt={image.filename}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="absolute top-2 left-2 bg-popover/80 backdrop-blur-sm text-foreground px-2 py-1 rounded-sm text-xs font-medium">
                              {index + 1}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteImage(image)}
                              className="absolute top-2 right-2 bg-destructive/10 backdrop-blur-md text-destructive px-2.5 py-1 rounded-sm text-xs hover:bg-destructive/20 hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-all font-medium uppercase tracking-wide border border-destructive/20 hover:border-destructive/30"
                            >
                              Delete
                            </button>

                            <div className="absolute bottom-0 left-0 right-0 bg-popover/80 backdrop-blur-sm text-foreground px-2 py-1.5 text-xs truncate">
                              {image.filename}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border"></div>

              <form.Field name="title">
                {field => (
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs uppercase tracking-wider">
                      Project Title *
                    </Label>
                    <Input
                      id="title"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      required
                      placeholder="e.g., Maria Bodil for Nike"
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="description">
                {field => (
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs uppercase tracking-wider">
                      Description *
                    </Label>
                    <textarea
                      id="description"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      required
                      rows={6}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Project description..."
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="order">
                {field => (
                  <div className="space-y-2">
                    <Label htmlFor="order" className="text-xs uppercase tracking-wider">
                      Position in Portfolio *
                    </Label>
                    <Input
                      id="order"
                      type="number"
                      value={field.state.value}
                      onChange={e => field.handleChange(Number.parseInt(e.target.value))}
                      onBlur={field.handleBlur}
                      required
                      min="0"
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="responsibilities">
                {field => (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider">
                      Responsibilities
                    </Label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newResponsibility}
                        onChange={e => setNewResponsibility(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddResponsibility())}
                        placeholder="e.g., CREATIVE PRODUCTION"
                      />
                      <Button
                        type="button"
                        onClick={handleAddResponsibility}
                        variant="secondary"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {field.state.value.map((resp, idx) => (
                        <span
                          key={`${resp}-${idx}`}
                          className="inline-flex items-center gap-2 bg-muted border border-border text-foreground px-3 py-1.5 rounded-sm text-xs tracking-wide"
                        >
                          {resp}
                          <button
                            type="button"
                            onClick={() => handleRemoveResponsibility(idx)}
                            className="text-destructive hover:text-destructive/80 text-sm transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </form.Field>

            </div>

            <div className="flex-shrink-0 p-8 border-t border-border flex gap-3 backdrop-blur-sm">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSave || !canSubmit || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting || loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </motion.div>
      </>
    </AnimatePresence>,
    document.body,
  )
}
