/**
 * @file MotionCarousel.tsx
 * @description Mobile-optimized horizontal image carousel with native CSS scroll-snap.
 *
 * This component provides a touch-friendly carousel experience for mobile devices
 * (screens < 1024px). It implements horizontal scroll-snap navigation with full-viewport
 * slides, progress indicators, and a blur transition effect for navigating to the next
 * project section.
 *
 * @architecture
 * The carousel follows a native scroll-based architecture:
 *
 * 1. **Scroll Container** - Native horizontal scroll with CSS scroll-snap-type: x mandatory
 * 2. **Slide Layout** - Each slide occupies 100% viewport width (full-bleed images)
 * 3. **Progress Tracking** - Scroll event listeners update progress bar and current slide
 * 4. **Blur Transition** - Final slide displays blurred background with "NEXT PROJECT" prompt
 *
 * Key Differences from MotionCarouselDesktop:
 * - Full-width slides (100vw) vs half-width slides (50vw) on desktop
 * - Shows progress bar at both top and bottom (configurable)
 * - Uses useCarouselBlurIntensity hook for dynamic blur effects
 * - Touch-optimized scroll behavior for mobile devices
 *
 * @features
 * - Native CSS scroll-snap for smooth, browser-optimized scrolling
 * - Progress bar showing current position (0% to 100%)
 * - Blur slide transition effect for section navigation
 * - Title click handler: shows popup on image slides, navigates on blur slide
 * - Responsive font sizing via settings configuration
 * - Animated title with AnimatePresence for fade transitions
 *
 * @dependencies
 * - motion/react: AnimatePresence and motion for animations
 * - useCarouselBlurIntensity: Hook for calculating blur intensity based on scroll
 *
 * @see {@link MotionCarouselDesktop} Desktop variant with keyboard navigation
 * @author Joanna van der Wilt
 * @version 2.0.0
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type { Settings } from '../config/pocketbase'
import type { ProjectImage } from '../types/project'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import { useCarouselBlurIntensity } from '../hooks/useCarouselBlurIntensity'
import { scrollToNextSection } from '../utils/scroll'
import {
  projectTitleClasses,
  projectTitleContainerClasses,
} from '../utils/sharedStyles'
import { generateFontMediaQueries } from '../utils/typography'
import BlurOverlay from './BlurOverlay'
import ChevronDown from './icons/ChevronDown'
import { Progress } from './ui/progress'

// ============================================================================
// CONSTANTS
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for the MotionCarousel component.
 */
interface MotionCarouselProps {
  /** Array of project images to display in the carousel */
  images: ProjectImage[]
  /** Title of the current project, displayed centered on the carousel */
  projectTitle: string
  /** Application settings containing font size configurations */
  settingsData?: Settings | null
  /** Total number of slides including blur transition slides */
  totalSlides: number
  /** Whether to show the progress bar at the top of the carousel */
  showTopProgressBar?: boolean
  /** Callback fired when title is clicked (opens project popup) */
  onShowPopup?: (title: string) => void
  /** Whether the project popup is currently visible */
  isPopupVisible?: boolean
  /** Whether the about popup is currently visible */
  isAboutPopupVisible?: boolean
  /** Current screen width in pixels, used for progress bar positioning */
  screenWidth?: number
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * Mobile-optimized horizontal image carousel with native CSS scroll-snap.
 *
 * Renders a full-viewport horizontal carousel where each image occupies 100% of the
 * viewport width. The carousel uses native browser scroll-snap for smooth navigation
 * between slides, with progress indicators and a blur transition effect on the final
 * slide that allows users to navigate to the next project section.
 *
 * @param {MotionCarouselProps} props - Component props
 * @param {ProjectImage[]} props.images - Array of project images to display
 * @param {string} props.projectTitle - Title of the current project
 * @param {Settings | null} [props.settingsData] - Application settings for font sizing
 * @param {number} props.totalSlides - Total number of slides including blur slides
 * @param {boolean} [props.showTopProgressBar] - Whether to show top progress bar
 * @param {Function} [props.onShowPopup] - Callback when title is clicked to show popup
 * @param {boolean} [props.isPopupVisible] - Whether project popup is visible
 * @param {boolean} [props.isAboutPopupVisible] - Whether about popup is visible
 * @param {number} [props.screenWidth] - Current screen width for progress bar positioning
 * @returns {JSX.Element} The rendered carousel with progress bars and title overlay
 */
export default function MotionCarousel({
  images,
  projectTitle,
  settingsData = null,
  totalSlides,
  showTopProgressBar = true,
  onShowPopup,
  isPopupVisible = false,
  isAboutPopupVisible = false,
  screenWidth,
}: MotionCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isOnBlurSlide, setIsOnBlurSlide] = useState(false)

  const { calculateBlur } = useCarouselBlurIntensity({
    slideSelector: '.slide-mobile',
  })

  const fontSizes = useMemo(
    () => getResponsiveFontSizes(settingsData),
    [settingsData]
  )

  const lastImage = images[images.length - 1]
  const regularImages = images.slice(0, -1)
  const isTitleVisible = !isPopupVisible && !isAboutPopupVisible
  const isProgressBarVisible = currentSlide > 0 && currentSlide <= images.length
  const chevronSize =
    typeof screenWidth === 'number' && screenWidth >= 768 ? 28 : 24

  useEffect(() => {
    const carousel = containerRef.current
    if (!carousel) return

    const handleScroll = () => {
      const currentCarousel = containerRef.current
      if (!currentCarousel) return

      const scrollLeft = currentCarousel.scrollLeft
      const containerWidth = currentCarousel.offsetWidth
      const maxScroll = currentCarousel.scrollWidth - containerWidth
      const rawProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0

      setScrollProgress(rawProgress)

      const scrollPercentage = rawProgress
      const currentIndex = Math.round(scrollPercentage * (totalSlides - 1))
      const clampedIndex = Math.max(0, Math.min(currentIndex, totalSlides - 1))

      setCurrentSlide(clampedIndex)
      setIsOnBlurSlide(clampedIndex === totalSlides - 1)
    }

    carousel.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => carousel.removeEventListener('scroll', handleScroll)
  }, [images.length, totalSlides, calculateBlur])

  const handleTitleClick = () => {
    if (isOnBlurSlide) {
      scrollToNextSection()
    } else {
      onShowPopup?.(projectTitle)
    }
  }

  return (
    <>
      <style>{generateFontMediaQueries('.carousel-title-mobile', fontSizes)}</style>
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth scrollbar-hide will-change-scroll backface-hidden"
        data-carousel
      >
        <div
          className="absolute inset-0 z-1 bg-cover bg-center"
          style={{ backgroundImage: `url(${lastImage.src})` }}
        />
        <div className="relative flex h-full w-full">
          {regularImages.map((image, idx) => (
            <div
              key={image.src}
              className="slide-mobile relative h-full w-full shrink-0 min-w-full snap-center snap-always bg-cover bg-center bg-black will-change-transform backface-hidden"
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={`Slide ${idx + 1}`}
            />
          ))}

          <div
            className="slide-mobile relative h-full w-full shrink-0 min-w-full snap-center snap-always bg-transparent bg-cover bg-center z-15 opacity-0"
            role="group"
            aria-label={`Slide ${images.length}`}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${lastImage.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0,
              }}
            />
          </div>

          <div
            className="slide-mobile relative h-full w-full shrink-0 min-w-full snap-center snap-always bg-transparent z-15 cursor-pointer"
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
          >
            <BlurOverlay visible={isOnBlurSlide} />
            <AnimatePresence>
              {isOnBlurSlide && (
                <motion.div
                  key="chevron-mobile"
                  className="pointer-events-auto absolute bottom-5 left-1/2 z-100 cursor-pointer hover:opacity-70"
                  style={{ x: '-50%' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  onClick={scrollToNextSection}
                >
                  <ChevronDown
                    width={chevronSize}
                    height={chevronSize}
                    color="white"
                    className="drop-shadow-2xl"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div
        className={`absolute top-1/2 left-1/2 z-200 w-full text-center ${projectTitleContainerClasses}`}
        style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <AnimatePresence>
          {isTitleVisible && (
            <motion.h1
              key="carousel-title"
              className={`text-white font-[EnduroWeb] tracking-[0.03em] carousel-title-mobile ${projectTitleClasses}`}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onClick={handleTitleClick}
            >
              {isOnBlurSlide ? 'NEXT PROJECT' : projectTitle}
            </motion.h1>
          )}
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <ProgressBar
          position="bottom"
          progress={scrollProgress}
          visible={isProgressBarVisible}
        />
      )}

      {showTopProgressBar && images.length > 1 && (
        <ProgressBar
          position="top"
          progress={scrollProgress}
          visible={isProgressBarVisible}
        />
      )}
    </>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Props for the ProgressBar sub-component.
 */
interface ProgressBarProps {
  /** Position of the progress bar - 'top' or 'bottom' of the carousel */
  position: 'top' | 'bottom'
  /** Current scroll progress as a decimal from 0 to 1 */
  progress: number
  /** Whether the progress bar should be visible */
  visible: boolean
}

/**
 * Animated progress bar indicating current scroll position in the carousel.
 *
 * Displays a horizontal progress bar at either the top or bottom of the carousel
 * that visually indicates how far the user has scrolled through the images.
 * The bar animates in/out based on visibility state using Framer Motion.
 *
 * Uses w-screen + flex justify-center for reliable centering, matching the
 * pattern used by the chevron (which sits inside a viewport-width slide).
 *
 * @param {ProgressBarProps} props - Component props
 * @param {'top' | 'bottom'} props.position - Position of the progress bar
 * @param {number} props.progress - Current progress (0 to 1)
 * @param {boolean} props.visible - Whether the bar is visible
 * @returns {JSX.Element} The rendered progress bar
 */
function ProgressBar({ position, progress, visible }: ProgressBarProps) {
  return (
    <motion.div
      className={`absolute left-0 w-screen px-5 ${position === 'top' ? 'top-5' : 'bottom-5'} z-20`}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : position === 'top' ? -10 : 10,
      }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <Progress
        value={progress * 100}
        className="h-0.5 w-full rounded-full bg-gray-500/50 backdrop-blur-sm"
        indicatorClassName="bg-gray-50"
      />
    </motion.div>
  )
}
