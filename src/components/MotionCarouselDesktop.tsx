/**
 * @fileoverview Desktop carousel component with native CSS scroll-snap.
 *
 * This component provides a horizontal image carousel for desktop devices
 * (≥1024px). Unlike the mobile variant, slides are 50vw wide (showing two
 * slides at once) and keyboard navigation is enabled via arrow keys.
 *
 * @module components/MotionCarouselDesktop
 * @see {@link MotionCarousel} - Mobile variant with full-width slides
 * @see {@link useCarouselKeyboardNavigation} - Hook for keyboard controls
 *
 * @architecture
 * The desktop carousel uses half-width slides (50vw) centered in the viewport:
 * - Each slide shows the center portion of an image
 * - Users can see the edge of the next/previous slide
 * - The blur slide is full-width (100vw) for a dramatic transition
 *
 * @navigation
 * - ArrowRight: Next slide (or next section if on last image)
 * - ArrowLeft: Previous slide
 * - Click on blur slide: Scroll to next project section
 * - Click on project title: Open project popup
 */

import type { Settings } from '../config/pocketbase'
import type { ProjectImage } from '../types/project'
import { useEffect, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import { useCarouselKeyboardNavigation } from '../hooks/useCarouselKeyboardNavigation'
import { scrollToNextSection } from '../utils/scroll'
import {
  projectTitleClasses,
  projectTitleContainerClasses,
} from '../utils/sharedStyles'
import styles from './Carousel.module.css'
import ChevronDown from './icons/ChevronDown'
import ChevronRight from './icons/ChevronRight'

/**
 * Props for the MotionCarouselDesktop component.
 *
 * @interface MotionCarouselDesktopProps
 */
interface MotionCarouselDesktopProps {
  /**
   * Array of project images to display in the carousel.
   * Each image object contains a `src` property with the URL.
   */
  images: ProjectImage[]

  /**
   * The title of the project, displayed centered over the carousel.
   * Changes to "NEXT PROJECT" when on the blur slide.
   */
  projectTitle: string

  /**
   * Site settings from PocketBase, used for responsive font sizes.
   * Falls back to defaults if not provided.
   */
  settingsData?: Settings | null

  /**
   * Total number of slides including blur transition slide.
   * Typically: images.length + 1 (blur slide only, no transparent slide)
   */
  totalSlides: number

  /**
   * Callback fired when the project title is clicked.
   * Opens the project popup with details.
   */
  onShowPopup?: (title: string) => void

  /**
   * Whether the project popup is currently visible.
   * Hides the project title when true.
   */
  isPopupVisible?: boolean

  /**
   * Whether the about popup is currently visible.
   * Hides the project title when true.
   */
  isAboutPopupVisible?: boolean

  /**
   * Screen width for responsive progress bar positioning.
   * Uses viewport width fallback if not provided.
   */
  screenWidth?: number
}

/**
 * Desktop carousel component with native CSS scroll-snap.
 *
 * Renders a horizontal scrolling carousel with:
 * - Half-width slides (50vw) showing centered images
 * - Full-width blur slide for section transition
 * - Keyboard navigation (arrow keys)
 * - Centered project title overlay
 * - Progress bar and navigation chevron
 *
 * @param {MotionCarouselDesktopProps} props - Component props
 * @returns {JSX.Element} The rendered carousel
 *
 * @example
 * ```tsx
 * <MotionCarouselDesktop
 *   images={project.images}
 *   projectTitle={project.title}
 *   settingsData={settingsData}
 *   totalSlides={project.images.length + 1}
 *   onShowPopup={handleShowPopup}
 * />
 * ```
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
  // ============================================================================
  // REFS & STATE
  // ============================================================================

  /** Reference to the scrollable carousel container */
  const containerRef = useRef<HTMLDivElement>(null)

  /** Current scroll progress (0-1), used for progress bar */
  const [scrollProgress, setScrollProgress] = useState(0)

  /** Current slide index (0-based), used for UI state */
  const [currentSlide, setCurrentSlide] = useState(0)

  /** Whether the carousel is on the blur/transition slide */
  const [isOnBlurSlide, setIsOnBlurSlide] = useState(false)

  // ============================================================================
  // HOOKS & DERIVED VALUES
  // ============================================================================

  /**
   * Keyboard navigation hook for desktop.
   * Handles ArrowLeft/ArrowRight key presses to navigate slides.
   */
  useCarouselKeyboardNavigation({
    containerRef,
    currentSlide,
    totalSlides,
  })

  /** Responsive font sizes from site settings */
  const fontSizes = getResponsiveFontSizes(settingsData)

  /** Last image used for blur slide background */
  const lastImage = images[images.length - 1]

  /** CSS custom properties for responsive typography (desktop only) */
  const cssVars = {
    '--font-size-desktop': `${fontSizes.desktop}rem`,
    '--font-size-large-desktop': `${fontSizes.largeDesktop}rem`,
  } as React.CSSProperties

  // ============================================================================
  // SCROLL HANDLING
  // ============================================================================

  /**
   * Sets up scroll listener to track carousel position.
   *
   * Desktop slide detection differs from mobile:
   * - Slides are 50vw wide (half viewport)
   * - Uses scrollLeft / halfWidth to calculate index
   * - Blur slide is detected when at the very end (maxScroll - 5px tolerance)
   */
  useEffect(() => {
    if (!containerRef.current)
      return

    const handleScroll = () => {
      const carousel = containerRef.current
      if (!carousel)
        return

      // Calculate raw scroll progress
      const scrollLeft = carousel.scrollLeft
      const containerWidth = carousel.offsetWidth
      const maxScroll = carousel.scrollWidth - containerWidth
      const rawProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0
      setScrollProgress(rawProgress)

      // Desktop uses half-width slides (50vw)
      const halfWidth = containerWidth * 0.5

      // Check if at the very end (blur slide)
      // Use 5px tolerance to handle rounding errors
      if (scrollLeft >= maxScroll - 5) {
        setCurrentSlide(totalSlides - 1)
        setIsOnBlurSlide(true)
      }
      else {
        // Calculate slide index based on half-width positioning
        const slideIndex = Math.round(scrollLeft / halfWidth)
        const actualSlide = Math.min(slideIndex, images.length - 1)
        setCurrentSlide(actualSlide)
        setIsOnBlurSlide(false)
      }
    }

    const carousel = containerRef.current
    carousel.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => {
      carousel.removeEventListener('scroll', handleScroll)
    }
  }, [images.length, totalSlides])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Carousel Container - Scrollable with CSS scroll-snap */}
      <div
        ref={containerRef}
        className={styles.motionCarouselDesktop}
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        {/* Background layer for blur effect */}
        <div
          className={styles.motionCarouselDesktopBackground}
          style={{ backgroundImage: `url(${lastImage.src})` }}
        />

        {/* Slides Container */}
        <div className={styles.motionCarouselDesktopContainer}>
          {/* Image Slides - All images at 50vw width */}
          {images.map((image, idx) => (
            <div
              key={image.src}
              className={styles.motionCarouselDesktopSlide}
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={`Slide ${idx + 1}`}
            />
          ))}

          {/* Blur Slide - Full-width (100vw) transition to next section */}
          <div
            className={`${styles.motionCarouselDesktopSlide} ${styles.motionCarouselDesktopSlideBlur}`}
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
            style={{ cursor: 'pointer' }}
          >
            {/* Fixed blur overlay - desktop always shows full blur */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                zIndex: 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* Project Title - Centered overlay */}
      <div
        className={`absolute top-1/2 left-1/2 z-200 w-full text-center ${projectTitleContainerClasses}`}
        style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <h1
          className={`text-white ${projectTitleClasses} ${styles.motionProjectTitleDesktop}`}
          style={{
            ...cssVars,
            pointerEvents: 'auto',
            cursor: 'pointer',
            // Hide when popups are visible
            opacity: isPopupVisible || isAboutPopupVisible ? 0 : 1,
            visibility:
              isPopupVisible || isAboutPopupVisible ? 'hidden' : 'visible',
            transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
          }}
          onClick={() => {
            if (isOnBlurSlide) {
              // On blur slide: navigate to next section
              scrollToNextSection()
            }
            else {
              // On image slide: show project popup
              onShowPopup?.(projectTitle)
            }
          }}
        >
          {isOnBlurSlide ? 'NEXT PROJECT' : projectTitle}
        </h1>
      </div>

      {/* Bottom Progress Bar - Shows scroll progress */}
      {images.length > 1 && (
        <div
          className="absolute bottom-7 z-20"
          style={{
            width: screenWidth ? `${screenWidth * 0.8}px` : '80vw',
            left: screenWidth ? `${screenWidth * 0.1}px` : '10vw',
            willChange: 'transform',
          }}
        >
          <div
            style={{
              // Hide on first slide and blur slide
              opacity: currentSlide > 0 && !isOnBlurSlide ? 1 : 0,
              transform: !isOnBlurSlide
                ? 'translateY(0) translateZ(0)'
                : 'translateY(10px) translateZ(0)',
              transition:
                'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
              pointerEvents:
                currentSlide > 0 && !isOnBlurSlide ? 'auto' : 'none',
              width: '100%',
            }}
          >
            <div className="h-0.5 overflow-hidden rounded-full bg-gray-500/50 backdrop-blur-sm">
              <div
                className="h-full bg-gray-50"
                style={{
                  width: `${scrollProgress * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Down Chevron - Appears on blur slide */}
      {images.length > 1 && (
        <div
          className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2"
          style={{
            transform: 'translate(-50%, 0) translateZ(0)',
            willChange: 'transform',
          }}
        >
          <div
            style={{
              opacity: isOnBlurSlide ? 1 : 0,
              transform: isOnBlurSlide
                ? 'translateY(0) translateZ(0)'
                : 'translateY(-10px) translateZ(0)',
              transition:
                'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
              pointerEvents: isOnBlurSlide ? 'auto' : 'none',
              cursor: 'pointer',
            }}
            onClick={scrollToNextSection}
          >
            <ChevronDown
              width={28}
              height={28}
              color="white"
              className="drop-shadow-2xl transition-opacity duration-300 hover:opacity-70"
            />
          </div>
        </div>
      )}

      {/* Right Chevron - Navigate to next slide */}
      {images.length > 1 && currentSlide < images.length - 1 && (
        <button
          className="absolute top-1/2 right-6 z-250 -translate-y-1/2 cursor-pointer border-none bg-none transition-opacity duration-150 hover:opacity-70"
          style={{ opacity: 1 }}
          aria-label="Next slide"
          onClick={() => {
            const carousel = containerRef.current
            if (!carousel)
              return

            // Calculate exact scroll position for next slide
            const containerWidth = carousel.offsetWidth
            const halfWidth = containerWidth * 0.5
            const nextSlideIndex = currentSlide + 1
            const targetScroll = nextSlideIndex * halfWidth

            carousel.scrollTo({
              left: targetScroll,
              behavior: 'smooth',
            })
          }}
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
