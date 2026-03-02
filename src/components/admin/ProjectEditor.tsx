import type { PortfolioProject } from '../../config/pocketbase'
import { useForm } from '@tanstack/react-form'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb, { clearCache, getImageUrl } from '../../config/pocketbase'
import { useUploadQueue } from '../../contexts/UploadQueueContext'
import ProjectPopupPreview from './ProjectPopupPreview'

interface ProjectEditorProps {
  project: PortfolioProject | null
  existingProjects: PortfolioProject[]
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

export default function ProjectEditor({
  project,
  existingProjects,
  onSave,
  onCancel,
  onShowToast,
}: ProjectEditorProps) {
  // Calculate order for new projects (max existing + 1)
  const calculatedOrder = project
    ? project.Order || 0
    : Math.max(0, ...existingProjects.map(p => p.Order || 0)) + 1

  const [images, setImages] = useState<ImageItem[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [newResponsibility, setNewResponsibility] = useState('')
  const imagesRef = useRef<ImageItem[]>(images)
  const { addToQueue } = useUploadQueue()

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
      order: calculatedOrder,
      responsibilities:
        project?.Responsibility_json || project?.Responsibility || [],
    } as ProjectFormValues,
    onSubmit: async ({ value }) => {
      setLoading(true)

      try {
        const metadata = {
          Title: value.title,
          Description: value.description,
          Order: value.order,
          Responsibility_json: value.responsibilities,
        }

        let savedProjectId: string

        if (project) {
          savedProjectId = project.id
          await pb.collection('Portfolio_Projects').update(project.id, metadata)

          const existingFilenames = project.Images || []
          const keptFilenames = images
            .filter(img => img.isExisting)
            .map(img => img.filename)
          const toDelete = existingFilenames.filter(f => !keptFilenames.includes(f))

          if (toDelete.length > 0) {
            await pb.collection('Portfolio_Projects').update(project.id, {
              'Images-': toDelete,
            })
          }
        }
        else {
          const created = await pb.collection('Portfolio_Projects').create(metadata)
          savedProjectId = created.id
        }

        const newFiles = images
          .filter(img => img.file)
          .map(img => img.file as File)

        if (newFiles.length > 0) {
          addToQueue(savedProjectId, value.title, newFiles)
          onShowToast('Project saved, uploading images...', 'success')
        }
        else {
          clearCache('Portfolio_Projects')
          onShowToast('Project saved', 'success')
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

        onShowToast(
          `Failed to save project: ${error?.message || 'Unknown error'}`,
          'error',
        )
      }
      finally {
        setLoading(false)
      }
    },
  })

  const handleAddResponsibility = () => {
    if (newResponsibility.trim()) {
      form.setFieldValue('responsibilities', [
        ...form.getFieldValue('responsibilities'),
        newResponsibility.trim()
          .toUpperCase(),
      ])
      setNewResponsibility('')
    }
  }

  const handleRemoveResponsibility = (index: number) => {
    const current = form.getFieldValue('responsibilities')
    form.setFieldValue(
      'responsibilities',
      current.filter((_, i) => i !== index),
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files)
      return

    const newImages: ImageItem[] = Array.from(files)
      .map((file, index) => ({
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

    const imageFiles = Array.from(files)
      .filter(file =>
        file.type.startsWith('image/'))

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
          className="bg-muted/70 fixed inset-0 z-40 backdrop-blur-md"
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
          className="bg-popover border-border fixed top-0 right-0 z-50 flex w-3/4 flex-col border-l backdrop-blur-xl md:w-2/3 lg:w-1/2"
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
            className="flex h-full flex-col"
          >
            <div className="border-border flex-shrink-0 border-b p-8 backdrop-blur-sm">
              <h2 className="text-foreground text-xl font-medium tracking-tight">
                {project ? 'Edit Project' : 'New Project'}
              </h2>
              <p className="text-muted-foreground mt-1 text-xs tracking-wide uppercase">
                {project
                  ? 'Update project details and images'
                  : 'Create a new portfolio project'}
              </p>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto p-8">
              <div>
                <Label className="mb-3 block text-xs tracking-wider uppercase">
                  Images (Drag to reorder)
                </Label>

                <div
                  onDragEnter={handleFileDragEnter}
                  onDragLeave={handleFileDragLeave}
                  onDragOver={handleFileDragOver}
                  onDrop={handleFileDrop}
                  className={`relative rounded-sm border-2 border-dashed transition-all ${
                    isDraggingFile
                      ? 'border-ring/50 bg-accent/50'
                      : 'border-border bg-muted/30'
                  } ${images.length === 0 ? 'hover:border-ring/50 hover:bg-muted/50 cursor-pointer' : ''}`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    id="image-upload"
                    style={{
                      pointerEvents: images.length > 0 ? 'none' : 'auto',
                    }}
                  />

                  {images.length === 0 && (
                    <label
                      htmlFor="image-upload"
                      className="block cursor-pointer px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <svg
                          className={`h-12 w-12 transition-colors ${
                            isDraggingFile
                              ? 'text-foreground'
                              : 'text-muted-foreground'
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
                          <p
                            className={`text-sm font-medium transition-colors ${
                              isDraggingFile
                                ? 'text-foreground'
                                : 'text-card-foreground'
                            } tracking-wide uppercase`}
                          >
                            {isDraggingFile
                              ? 'Drop images here'
                              : 'Drag & drop images'}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs tracking-wide">
                            or click to browse
                          </p>
                        </div>
                      </div>
                    </label>
                  )}

                  {images.length > 0 && (
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {images.map((image, index) => (
                          <div
                            key={image.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={e => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`group relative cursor-move overflow-hidden rounded-sm border ${
                              draggedIndex === index
                                ? 'border-ring opacity-50'
                                : 'border-border'
                            } hover:border-ring/50 transition-all`}
                          >
                            <div className="bg-muted aspect-square">
                              <img
                                src={image.url}
                                alt={image.filename}
                                className="h-full w-full object-cover"
                              />
                            </div>

                            <div className="bg-popover/80 text-foreground absolute top-2 left-2 rounded-sm px-2 py-1 text-xs font-medium backdrop-blur-sm">
                              {index + 1}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteImage(image)}
                              className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive/80 border-destructive/20 hover:border-destructive/30 absolute top-2 right-2 rounded-sm border px-2.5 py-1 text-xs font-medium tracking-wide uppercase opacity-0 backdrop-blur-md transition-all group-hover:opacity-100"
                            >
                              Delete
                            </button>

                            <div className="bg-popover/80 text-foreground absolute right-0 bottom-0 left-0 truncate px-2 py-1.5 text-xs backdrop-blur-sm">
                              {image.filename}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-border border-t"></div>

              <form.Field name="title">
                {field => (
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className="text-xs tracking-wider uppercase"
                    >
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
                    <Label
                      htmlFor="description"
                      className="text-xs tracking-wider uppercase"
                    >
                      Description *
                    </Label>
                    <textarea
                      id="description"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      required
                      rows={6}
                      className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full resize-none rounded-md border bg-transparent px-4 py-3 text-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Project description..."
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="responsibilities">
                {field => (
                  <div className="space-y-2">
                    <Label className="text-xs tracking-wider uppercase">
                      Responsibilities
                    </Label>
                    <div className="mb-3 flex gap-2">
                      <Input
                        value={newResponsibility}
                        onChange={e => setNewResponsibility(e.target.value)}
                        onKeyPress={e =>
                          e.key === 'Enter'
                          && (e.preventDefault(), handleAddResponsibility())}
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
                          className="bg-muted border-border text-foreground inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs tracking-wide"
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

            <div className="border-border flex flex-shrink-0 gap-3 border-t p-8 backdrop-blur-sm">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <form.Subscribe
                selector={state => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSave || !canSubmit || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting || loading
                      ? 'Saving...'
                      : project
                        ? 'Update Project'
                        : 'Create Project'}
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
