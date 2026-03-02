/**
 * @file MotionCarouselDesktop.tsx
 * @description Desktop-optimized horizontal image carousel with native CSS scroll-snap.
 *
 * This component provides a desktop-optimized carousel experience for larger screens
 * (screens >= 1024px). It implements horizontal scroll-snap navigation with half-viewport
 * slides, progress indicators, keyboard navigation, and a blur transition effect for
 * navigating to the next project section.
 *
 * @architecture
 * The carousel follows a native scroll-based architecture:
 *
 * 1. **Scroll Container** - Native horizontal scroll with CSS scroll-snap-type: x mandatory
 * 2. **Slide Layout** - Each slide occupies 50% viewport width (half-bleed images)
 * 3. **Progress Tracking** - Scroll event listeners update progress bar and current slide
 * 4. **Blur Transition** - Final slide displays blurred background with "NEXT PROJECT" prompt
 *
 * Key Differences from MotionCarousel (mobile):
 * - Half-width slides (50vw) for side-by-side viewing vs full-width (100vw) on mobile
 * - Single progress bar at bottom only
 * - Keyboard navigation support via useCarouselKeyboardNavigation hook
 * - Right chevron button for explicit next-slide navigation
 * - Fixed background image behind all slides for visual continuity
 *
 * @features
 * - Native CSS scroll-snap for smooth, browser-optimized scrolling
 * - Half-viewport slide width for desktop viewing experience
 * - Progress bar showing current position (0% to 100%)
 * - Blur slide transition effect for section navigation
 * - Title click handler: shows popup on image slides, navigates on blur slide
 * - Keyboard navigation (arrow keys) for accessibility
 * - Right chevron button for explicit slide advancement
 * - Responsive font sizing via settings configuration
 * - Animated title with AnimatePresence for fade transitions
 *
 * @dependencies
 * - motion/react: AnimatePresence and motion for animations
 * - useCarouselKeyboardNavigation: Hook for keyboard-based carousel navigation
 *
 * @see {@link MotionCarousel} Mobile variant with touch-optimized interactions
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
import { useCarouselKeyboardNavigation } from '../hooks/useCarouselKeyboardNavigation'
import { scrollToNextSection } from '../utils/scroll'
import {
  projectTitleClasses,
  projectTitleContainerClasses,
} from '../utils/sharedStyles'
import { generateFontMediaQueries } from '../utils/typography'
import BlurOverlay from './BlurOverlay'
import ChevronDown from './icons/ChevronDown'
import ChevronRight from './icons/ChevronRight'
import { Progress } from './ui/progress'

// ============================================================================
// CONSTANTS
// ============================================================================

const BLUR_SLIDE_TOLERANCE_PX = 5

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for the MotionCarouselDesktop component.
 */
interface MotionCarouselDesktopProps {
  /** Array of project images to display in the carousel */
  images: ProjectImage[]
  /** Title of the current project, displayed centered on the carousel */
  projectTitle: string
  /** Application settings containing font size configurations */
  settingsData?: Settings | null
  /** Total number of slides including blur transition slides */
  totalSlides: number
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
 * Desktop-optimized horizontal image carousel with native CSS scroll-snap.
 *
 * Renders a horizontal carousel where each image occupies 50% of the viewport width,
 * allowing users to see partial adjacent images. The carousel uses native browser
 * scroll-snap for smooth navigation between slides, with progress indicators,
 * keyboard navigation support, and a blur transition effect on the final slide
 * that allows users to navigate to the next project section.
 *
 * @param {MotionCarouselDesktopProps} props - Component props
 * @param {ProjectImage[]} props.images - Array of project images to display
 * @param {string} props.projectTitle - Title of the current project
 * @param {Settings | null} [props.settingsData] - Application settings for font sizing
 * @param {number} props.totalSlides - Total number of slides including blur slides
 * @param {Function} [props.onShowPopup] - Callback when title is clicked to show popup
 * @param {boolean} [props.isPopupVisible] - Whether project popup is visible
 * @param {boolean} [props.isAboutPopupVisible] - Whether about popup is visible
 * @param {number} [props.screenWidth] - Current screen width for progress bar positioning
 * @returns {JSX.Element} The rendered carousel with progress bar, title overlay, and navigation
 */
export default function MotionCarouselDesktop({
  images,
  projectTitle,
  settingsData = null,
  totalSlides,
  onShowPopup,
  isPopupVisible = false,
  isAboutPopupVisible = false,
  screenWidth,
}: MotionCarouselDesktopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isOnBlurSlide, setIsOnBlurSlide] = useState(false)

  useCarouselKeyboardNavigation({
    containerRef,
    currentSlide,
    totalSlides,
  })

  const fontSizes = useMemo(
    () => getResponsiveFontSizes(settingsData),
    [settingsData],
  )

  const lastImage = images[images.length - 1]
  const regularImages = images.slice(0, -1)
  const isTitleVisible = !isPopupVisible && !isAboutPopupVisible
  const isProgressBarVisible = currentSlide > 0 && !isOnBlurSlide
  const showRightChevron = images.length > 1 && currentSlide < images.length - 1

  useEffect(() => {
    const carousel = containerRef.current
    if (!carousel)
      return

    const handleScroll = () => {
      const currentCarousel = containerRef.current
      if (!currentCarousel)
        return

      const scrollLeft = currentCarousel.scrollLeft
      const containerWidth = currentCarousel.offsetWidth
      const maxScroll = currentCarousel.scrollWidth - containerWidth
      const halfWidth = containerWidth * 0.5
      const transparentSnapPosition = (images.length - 1) * halfWidth

      const rawProgress = transparentSnapPosition > 0
        ? Math.min(scrollLeft / transparentSnapPosition, 1)
        : 0
      setScrollProgress(rawProgress)

      if (scrollLeft >= maxScroll - BLUR_SLIDE_TOLERANCE_PX) {
        setCurrentSlide(totalSlides - 1)
        setIsOnBlurSlide(true)
      }
      else {
        const slideIndex = Math.round(scrollLeft / halfWidth)
        const actualSlide = Math.min(slideIndex, images.length - 1)
        setCurrentSlide(actualSlide)
        setIsOnBlurSlide(false)
      }
    }

    carousel.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => carousel.removeEventListener('scroll', handleScroll)
  }, [images.length, totalSlides])

  const handleTitleClick = () => {
    if (isOnBlurSlide) {
      scrollToNextSection()
    }
    else {
      onShowPopup?.(projectTitle)
    }
  }

  const handleNextSlide = () => {
    const carousel = containerRef.current
    if (!carousel)
      return

    const containerWidth = carousel.offsetWidth
    const halfWidth = containerWidth * 0.5
    const nextSlideIndex = currentSlide + 1
    const targetScroll = nextSlideIndex * halfWidth

    carousel.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })
  }

  return (
    <>
      <style>{generateFontMediaQueries('.carousel-title-desktop', fontSizes)}</style>
      <div
        ref={containerRef}
        className="relative h-full w-full bg-cover bg-center bg-fixed bg-no-repeat overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth scrollbar-hide will-change-scroll backface-hidden"
        data-carousel
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        <div className="relative z-10 flex h-full w-full">
          {regularImages.map((image, idx) => (
            <div
              key={image.src}
              className="relative h-full w-[50vw] min-w-[50vw] shrink-0 snap-center snap-always bg-cover bg-center bg-black will-change-transform backface-hidden"
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={`Slide ${idx + 1}`}
            />
          ))}

          <div
            className="relative h-full w-screen min-w-screen! shrink-0 snap-center snap-always bg-transparent will-change-transform"
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
                opacity: 0.0001,
              }}
            />
          </div>

          <div
            className="relative h-full w-screen min-w-screen shrink-0 snap-center snap-always bg-transparent cursor-pointer"
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
          >
            <BlurOverlay visible={isOnBlurSlide} />
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
              key="carousel-title-desktop"
              className={`text-white font-[EnduroWeb] tracking-[0.03em] z-20 carousel-title-desktop ${projectTitleClasses}`}
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
        <motion.div
          className="absolute bottom-7 left-0 w-screen px-[10%] z-20"
          animate={{
            opacity: isProgressBarVisible ? 1 : 0,
            y: isProgressBarVisible ? 0 : 10,
          }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          style={{ pointerEvents: isProgressBarVisible ? 'auto' : 'none' }}
        >
          <Progress
            value={scrollProgress * 100}
            className="h-0.5 w-full rounded-full bg-gray-500/50 backdrop-blur-sm"
            indicatorClassName="bg-gray-50"
          />
        </motion.div>
      )}

      {images.length > 1 && (
        <AnimatePresence>
          {isOnBlurSlide && (
            <motion.div
              key="chevron-desktop"
              className="absolute bottom-10 left-1/2 z-20 cursor-pointer hover:opacity-70"
              style={{ x: '-50%' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              onClick={scrollToNextSection}
            >
              <ChevronDown
                width={28}
                height={28}
                color="white"
                className="drop-shadow-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {showRightChevron && (
        <button
          className="absolute top-1/2 right-6 z-250 -translate-y-1/2 cursor-pointer border-none bg-none transition-opacity duration-150 hover:opacity-70"
          aria-label="Next slide"
          onClick={handleNextSlide}
        >
          <ChevronRight
            width={28}
            height={28}
            color="white"
            className="pointer-events-none drop-shadow-2xl"
          />
        </button>
      )}
    </>
  )
}
