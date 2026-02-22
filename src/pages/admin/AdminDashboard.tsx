import type { Homepage, PortfolioProject } from '../../config/pocketbase'
import { motion, Reorder } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
import { Skeleton } from '@/components/ui/skeleton'
import ProjectEditor from '../../components/admin/ProjectEditor'
import SettingsSidebar from '../../components/admin/SettingsSidebar'
import pb, { getImageUrl } from '../../config/pocketbase'

export default function AdminDashboard() {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [heroImage, setHeroImage] = useState<string>('')
  const [heroImageMobile, setHeroImageMobile] = useState<string>('')
  const [heroTitle, setHeroTitle] = useState<string>('')
  const [homepageId, setHomepageId] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState<string>('')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    projectId: string
  } | null>(null)
  const heroFileInputRef = useRef<HTMLInputElement>(null)
  const heroMobileFileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!pb.authStore.isValid) {
      navigate('/admin')
    }
  }, [navigate])

  const fetchHeroImage = async () => {
    try {
      const homepage = await pb
        .collection('Homepage')
        .getFirstListItem<Homepage>('Is_Active = true', {
          requestKey: null,
        })
      if (homepage) {
        if (homepage.Hero_Image) {
          const imageUrl = getImageUrl(homepage, homepage.Hero_Image)
          setHeroImage(imageUrl)
        }
        if (homepage.Hero_Image_Mobile) {
          const imageUrlMobile = getImageUrl(
            homepage,
            homepage.Hero_Image_Mobile,
          )
          setHeroImageMobile(imageUrlMobile)
        }
        setHeroTitle(homepage.Hero_Title || '')
        setHomepageId(homepage.id)
      }
    }
    catch (err) {
      console.error('Error fetching hero image:', err)
    }
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await pb
        .collection('Portfolio_Projects')
        .getFullList<PortfolioProject>({
          sort: 'Order',
          requestKey: null,
        })
      setProjects(response)
      setError(null)
    }
    catch (err: unknown) {
      console.error('Error fetching projects:', err)

      const error = err as { status?: number }
      if (error?.status === 401 || error?.status === 403) {
        pb.authStore.clear()
        navigate('/admin')
        return
      }

      setError('Failed to load projects')
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchHeroImage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { velocity: { x: number }, offset: { x: number } },
  ) => {
    const swipeVelocityThreshold = 500
    const swipeOffsetThreshold = 50

    if (
      info.velocity.x < -swipeVelocityThreshold
      || info.offset.x < -swipeOffsetThreshold
    ) {
      setShowMobilePreview(true)
    }
    else if (
      info.velocity.x > swipeVelocityThreshold
      || info.offset.x > swipeOffsetThreshold
    ) {
      setShowMobilePreview(false)
    }
  }

  const handleHeroImageUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !homepageId)
      return

    try {
      const formData = new FormData()
      formData.append('Hero_Image', file)

      await pb.collection('Homepage')
        .update(homepageId, formData)

      await fetchHeroImage()
      toast.success('Hero image updated')
    }
    catch (err: unknown) {
      console.error('Error updating hero image:', err)
      const error = err as { message?: string }
      toast.error(`Failed to update hero image: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleHeroImageMobileUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !homepageId)
      return

    try {
      const formData = new FormData()
      formData.append('Hero_Image_Mobile', file)

      await pb.collection('Homepage')
        .update(homepageId, formData)

      await fetchHeroImage()
      toast.success('Mobile hero image updated')
    }
    catch (err: unknown) {
      console.error('Error updating mobile hero image:', err)
      const error = err as { message?: string }
      toast.error(`Failed to update mobile hero image: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleLogout = () => {
    pb.authStore.clear()
    navigate('/admin')
  }

  const handleTitleClick = () => {
    setTempTitle(heroTitle)
    setIsEditingTitle(true)
  }

  const handleTitleInput = (e: React.FormEvent<HTMLHeadingElement>) => {
    setTempTitle(e.currentTarget.textContent || '')
  }

  const handleTitleSave = async () => {
    if (!homepageId || tempTitle.trim() === heroTitle) {
      setIsEditingTitle(false)
      return
    }

    try {
      await pb.collection('Homepage')
        .update(homepageId, {
          Hero_Title: tempTitle.trim(),
        })

      setHeroTitle(tempTitle.trim())
      setIsEditingTitle(false)
      toast.success('Hero title updated')
    }
    catch (err: unknown) {
      console.error('Error updating hero title:', err)
      const error = err as { message?: string }
      toast.error(`Failed to update hero title: ${error?.message || 'Unknown error'}`)
      setIsEditingTitle(false)
    }
  }

  const handleTitleCancel = () => {
    setIsEditingTitle(false)
    setTempTitle('')
  }

  const handleDelete = (projectId: string) => {
    setDeleteConfirmation({ projectId })
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation)
      return

    try {
      await pb
        .collection('Portfolio_Projects')
        .delete(deleteConfirmation.projectId)
      setDeleteConfirmation(null)
      await fetchProjects()
      toast.success('Project deleted successfully')
    }
    catch (err: unknown) {
      console.error('Error deleting project:', err)

      const error = err as { status?: number, message?: string }
      if (error?.status === 401 || error?.status === 403) {
        pb.authStore.clear()
        navigate('/admin')
        return
      }

      toast.error(`Failed to delete project: ${error?.message || 'Unknown error'}`)
      setDeleteConfirmation(null)
    }
  }

  const handleSave = async () => {
    const isCreating = showNewProjectForm
    setEditingProject(null)
    setShowNewProjectForm(false)
    await fetchProjects()
    toast.success(isCreating
      ? 'Project created successfully'
      : 'Project updated successfully')
  }

  const handleReorder = async (newOrder: PortfolioProject[]) => {
    if (isReordering)
      return

    setProjects(newOrder)
    setIsReordering(true)

    try {
      const updatePromises = newOrder.map((project, index) => {
        const newOrderValue = index + 1
        return pb.collection('Portfolio_Projects')
          .update(
            project.id,
            {
              Order: newOrderValue,
            },
            {
              requestKey: null,
            },
          )
      })

      await Promise.all(updatePromises)
      toast.success('Projects reordered')
    }
    catch (err: unknown) {
      console.error('Error reordering projects:', err)

      await fetchProjects()

      const error = err as { message?: string }
      toast.error(`Failed to reorder projects: ${error?.message || 'Unknown error'}`)
    }
    finally {
      setIsReordering(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
          <Skeleton className="h-[680px] w-full" />
          <div className="space-y-3 pt-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="bg-background min-h-screen"
      style={{ fontFamily: 'EnduroWeb, sans-serif' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* Header */}
      <header className="border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <div>
            <h1 className="text-foreground text-xl font-medium tracking-tight">
              Portfolio
            </h1>
            <p className="text-muted-foreground mt-1 text-xs tracking-wide">
              {projects.length}
              {' '}
              {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <a href="/">View Portfolio</a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Settings"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path d="M16.5 10c0 .5-.1 1-.2 1.4l1.4.8c.2.1.2.4.1.6l-1.5 2.6c-.1.2-.4.3-.6.2l-1.4-.8c-.6.5-1.3.9-2 1.1l-.3 1.6c0 .2-.2.4-.5.4h-3c-.3 0-.5-.2-.5-.4l-.3-1.6c-.7-.2-1.4-.6-2-1.1l-1.4.8c-.2.1-.5 0-.6-.2l-1.5-2.6c-.1-.2 0-.5.1-.6l1.4-.8c-.1-.4-.2-.9-.2-1.4s.1-1 .2-1.4l-1.4-.8c-.2-.1-.2-.4-.1-.6l1.5-2.6c.1-.2.4-.3.6-.2l1.4.8c.6-.5 1.3-.9 2-1.1l.3-1.6c0-.2.2-.4.5-.4h3c.3 0 .5.2.5.4l.3 1.6c.7.2 1.4.6 2 1.1l1.4-.8c.2-.1.5 0 .6.2l1.5 2.6c.1.2 0 .5-.1.6l-1.4.8c.1.4.2.9.2 1.4z" />
              </svg>
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Hero Image Section */}
        {(heroImage || heroImageMobile) && (
          <div className="mb-12">
            {/* Drag Container */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="flex cursor-grab gap-6 active:cursor-grabbing"
            >
              {/* Desktop Preview */}
              <motion.div
                className="flex-shrink-0"
                animate={{
                  width: showMobilePreview ? '66.67%' : '100%',
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div
                  className="bg-card border-border group relative w-full overflow-hidden rounded-sm border"
                  style={{
                    height: '680px',
                    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <img
                    src={heroImage}
                    alt="Hero Desktop"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {/* Draggable Trigger Zones */}
                  <div className="absolute top-0 left-0 h-1/2 w-1/2 cursor-grab active:cursor-grabbing" />
                  <div className="absolute bottom-0 left-0 h-1/2 w-1/2 cursor-grab active:cursor-grabbing" />

                  {/* Hero Title Overlay */}
                  {heroTitle && (
                    <>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="px-6 text-center">
                          <h1
                            contentEditable={isEditingTitle}
                            suppressContentEditableWarning
                            onInput={handleTitleInput}
                            onClick={
                              !isEditingTitle ? handleTitleClick : undefined
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleTitleSave()
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault()
                                handleTitleCancel()
                              }
                            }}
                            className={`pointer-events-auto inline-block text-4xl leading-none text-white uppercase outline-none ${
                              isEditingTitle
                                ? 'cursor-text'
                                : 'cursor-pointer transition-opacity hover:opacity-80'
                            }`}
                            style={{
                              fontFamily: 'EnduroWeb, sans-serif',
                              letterSpacing: '0.03em',
                            }}
                            title={
                              !isEditingTitle ? 'Click to edit' : undefined
                            }
                          >
                            {heroTitle}
                          </h1>
                        </div>
                      </div>
                      {isEditingTitle && (
                        <div className="pointer-events-none absolute right-6 bottom-6 z-10 flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleTitleCancel}
                            className="border-white/30 bg-black/60 text-white hover:bg-black/80"
                            title="Cancel"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </Button>
                          <Button
                            size="icon"
                            onClick={handleTitleSave}
                            className="bg-white text-black hover:bg-neutral-100"
                            title="Save"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Update Button Overlay - Bottom Right Corner Only */}
                  {!isEditingTitle && (
                    <div className="group/update pointer-events-auto absolute right-0 bottom-0 p-6">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => heroFileInputRef.current?.click()}
                        className="border-border text-foreground bg-black/60 opacity-0 group-hover/update:opacity-100 hover:bg-black/80"
                        title="Update Desktop Hero"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          >
                          </rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Mobile Preview (9:16) */}
              <motion.div
                className="flex-shrink-0"
                initial={{ width: '0%', opacity: 0 }}
                animate={{
                  width: showMobilePreview ? 'calc(33.33% - 24px)' : '0%',
                  opacity: showMobilePreview ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  className="bg-card border-border group relative w-full overflow-hidden rounded-sm border"
                  style={{
                    height: '680px',
                    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <img
                    src={heroImageMobile}
                    alt="Hero Mobile"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {/* Draggable Trigger Zones */}
                  <div className="absolute top-0 left-0 h-1/2 w-1/2 cursor-grab active:cursor-grabbing" />
                  <div className="absolute bottom-0 left-0 h-1/2 w-1/2 cursor-grab active:cursor-grabbing" />

                  {/* Hero Title Overlay */}
                  {heroTitle && (
                    <>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="px-6 text-center">
                          <h1
                            contentEditable={isEditingTitle}
                            suppressContentEditableWarning
                            onInput={handleTitleInput}
                            onClick={
                              !isEditingTitle ? handleTitleClick : undefined
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleTitleSave()
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault()
                                handleTitleCancel()
                              }
                            }}
                            className={`pointer-events-auto inline-block text-xl leading-none text-white uppercase outline-none ${
                              isEditingTitle
                                ? 'cursor-text'
                                : 'cursor-pointer transition-opacity hover:opacity-80'
                            }`}
                            style={{
                              fontFamily: 'EnduroWeb, sans-serif',
                              letterSpacing: '0.03em',
                            }}
                            title={
                              !isEditingTitle ? 'Click to edit' : undefined
                            }
                          >
                            {heroTitle}
                          </h1>
                        </div>
                      </div>
                      {isEditingTitle && (
                        <div className="pointer-events-none absolute right-6 bottom-6 z-10 flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleTitleCancel}
                            className="h-9 w-9 border-white/30 bg-black/60 text-white hover:bg-black/80"
                            title="Cancel"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </Button>
                          <Button
                            size="icon"
                            onClick={handleTitleSave}
                            className="h-9 w-9 bg-white text-black hover:bg-neutral-100"
                            title="Save"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Update Button Overlay - Bottom Right Corner Only */}
                  {!isEditingTitle && (
                    <div className="group/update pointer-events-auto absolute right-0 bottom-0 p-6">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => heroMobileFileInputRef.current?.click()}
                        className="border-border text-foreground h-9 w-9 bg-black/60 opacity-0 group-hover/update:opacity-100 hover:bg-black/80"
                        title="Update Mobile Hero"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          >
                          </rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Hidden File Inputs */}
            <input
              ref={heroFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleHeroImageUpdate}
              className="hidden"
            />
            <input
              ref={heroMobileFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleHeroImageMobileUpdate}
              className="hidden"
            />
          </div>
        )}

        {/* Divider */}
        <div className="border-border mb-12 border-t"></div>

        {/* Projects List */}
        <Reorder.Group
          as="div"
          axis="y"
          values={projects}
          onReorder={handleReorder}
          className="flex flex-col gap-3"
        >
          {projects.map(project => (
            <Reorder.Item
              key={project.id}
              value={project}
              className="group cursor-grab overflow-hidden active:cursor-grabbing"
              style={{ position: 'relative' }}
              animate={{
                scale: 1,
                zIndex: 1,
                cursor: 'grab',
              }}
              whileDrag={{
                scale: 1.01,
                zIndex: 50,
                cursor: 'grabbing',
              }}
            >
              <Item
                variant="outline"
                className="hover:border-ring/50 items-stretch gap-0 p-0"
              >
                {/* Thumbnail */}
                <div className="border-border bg-muted relative min-h-32 w-1/3 shrink-0 overflow-hidden border-r">
                  {project.Images && project.Images.length > 0
                    ? (
                        <>
                          <img
                            src={getImageUrl(project, project.Images[0])}
                            alt={project.Title}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{
                              opacity: 1,
                              transition: { duration: 0.3, ease: 'easeIn' },
                            }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                          />
                        </>
                      )
                    : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">–</span>
                        </div>
                      )}
                  <div className="bg-popover/80 text-foreground absolute top-2 left-2 z-10 rounded-sm px-2 py-1 text-xs font-medium tracking-wide backdrop-blur-md">
                    {project.Images?.length || 0}
                    {' '}
                    {project.Images?.length === 1 ? 'image' : 'images'}
                  </div>
                </div>

                {/* Content */}
                <ItemContent className="self-center p-4">
                  <ItemTitle className="text-base">{project.Title}</ItemTitle>
                  <ItemDescription className="line-clamp-2">
                    {project.Description}
                  </ItemDescription>

                  {/* Responsibilities */}
                  {((project.Responsibility
                    && project.Responsibility.length > 0)
                  || (project.Responsibility_json
                    && project.Responsibility_json.length > 0)) && (
                    <div className="mt-2 mb-3 flex flex-wrap gap-2">
                      {(
                        project.Responsibility_json
                        || project.Responsibility
                        || []
                      ).map((resp, idx) => (
                        <span
                          key={`${resp}-${idx}`}
                          className="bg-muted border-border text-muted-foreground rounded-sm border px-2.5 py-1 text-xs font-medium tracking-wider uppercase"
                        >
                          {resp}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProject(project)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      Delete
                    </Button>
                  </div>
                </ItemContent>

                {/* Drag Handle */}
                <div className="text-muted-foreground group-hover:text-foreground border-border flex items-center border-l px-4 transition-colors duration-200">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>
              </Item>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {projects.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-sm tracking-wider uppercase">
              No projects yet
            </p>
            <p className="text-muted-foreground/60 mt-2 text-xs">
              Create your first project to get started
            </p>
          </div>
        )}

        {/* Create New Project Button */}
        <div className="mt-12">
          <Button onClick={() => setShowNewProjectForm(true)}>
            + New Project
          </Button>
        </div>
      </main>

      {/* Project Editor Overlay */}
      {(editingProject || showNewProjectForm) && (
        <ProjectEditor
          project={editingProject}
          onSave={handleSave}
          onCancel={() => {
            setEditingProject(null)
            setShowNewProjectForm(false)
          }}
          onShowToast={(message, type) => {
            if (type === 'success') {
              toast.success(message)
            }
            else {
              toast.error(message)
            }
          }}
        />
      )}

      {/* Settings Sidebar */}
      <SettingsSidebar
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onShowToast={(message, type) => {
          if (type === 'success') {
            toast.success(message)
          }
          else {
            toast.error(message)
          }
        }}
      />

      {/* Toast Notifications */}
      <Toaster position="bottom-right" />

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={!!deleteConfirmation}
        onOpenChange={() => setDeleteConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 text-destructive hover:text-destructive/80"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
