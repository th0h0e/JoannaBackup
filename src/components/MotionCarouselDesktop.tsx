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
 */

import type { Settings } from '../config/pocketbase'
import type { ProjectImage } from '../types/project'
import { useEffect, useMemo, useRef, useState } from 'react'
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

/* ==========================================================================
   Constants
   ========================================================================== */

const PROGRESS_BAR_WIDTH_PERCENT = 0.8
const PROGRESS_BAR_LEFT_PERCENT = 0.1
const BLUR_SLIDE_TOLERANCE_PX = 5

/* ==========================================================================
   Types
   ========================================================================== */

interface MotionCarouselDesktopProps {
  images: ProjectImage[]
  projectTitle: string
  settingsData?: Settings | null
  totalSlides: number
  onShowPopup?: (title: string) => void
  isPopupVisible?: boolean
  isAboutPopupVisible?: boolean
  screenWidth?: number
}

/* ==========================================================================
   Component
   ========================================================================== */

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
  /* --------------------------------------------------------------------------
     Refs & State
     -------------------------------------------------------------------------- */
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isOnBlurSlide, setIsOnBlurSlide] = useState(false)

  /* --------------------------------------------------------------------------
     Hooks
     -------------------------------------------------------------------------- */
  useCarouselKeyboardNavigation({
    containerRef,
    currentSlide,
    totalSlides,
  })

  const fontSizes = useMemo(
    () => getResponsiveFontSizes(settingsData),
    [settingsData],
  )

  const cssVars = useMemo(
    () => ({
      '--font-size-desktop': `${fontSizes.desktop}rem`,
      '--font-size-large-desktop': `${fontSizes.largeDesktop}rem`,
    }) as React.CSSProperties,
    [fontSizes],
  )

  const progressBarWidth = useMemo(
    () => screenWidth
      ? `${screenWidth * PROGRESS_BAR_WIDTH_PERCENT}px`
      : '80vw',
    [screenWidth],
  )

  const progressBarLeft = useMemo(
    () => screenWidth
      ? `${screenWidth * PROGRESS_BAR_LEFT_PERCENT}px`
      : '10vw',
    [screenWidth],
  )

  /* --------------------------------------------------------------------------
     Derived Values
     -------------------------------------------------------------------------- */
  const lastImage = images[images.length - 1]
  const isTitleVisible = !isPopupVisible && !isAboutPopupVisible
  const isProgressBarVisible = currentSlide > 0 && !isOnBlurSlide
  const showRightChevron = images.length > 1 && currentSlide < images.length - 1

  /* --------------------------------------------------------------------------
     Scroll Effect
     -------------------------------------------------------------------------- */
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

      // Desktop: slides are 50vw, detect based on half-width increments
      const halfWidth = containerWidth * 0.5

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

  /* --------------------------------------------------------------------------
     Event Handlers
     -------------------------------------------------------------------------- */
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
    if (!carousel) return

    const containerWidth = carousel.offsetWidth
    const halfWidth = containerWidth * 0.5
    const nextSlideIndex = currentSlide + 1
    const targetScroll = nextSlideIndex * halfWidth

    carousel.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })
  }

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */

  /**
   * LAYER STRUCTURE (from lowest to highest z-index)
   *
   * z-0   .motionCarouselDesktop (container)
   *       └─ background: lastImage (shows through transparent blur slide)
   *
   * z-5   .motionCarouselDesktopBackground
   *       └─ Duplicate of lastImage, acts as blur target for backdrop-filter
   *
   * z-10  .motionCarouselDesktopContainer (slides wrapper)
   *       └─ Contains all scrollable slides
   *
   * z-15  Individual slides (50vw wide, showing 2 at once):
   *       ├─ .motionCarouselDesktopSlide (visible images, ALL images)
   *       └─ .motionCarouselDesktopSlideBlur (100vw, transparent)
   *            └─ backdrop-filter: blur(12px) - blurs z-5 layer behind it
   *
   * z-20  Progress bar + Bottom ChevronDown (siblings to scroll container)
   *
   * z-200 Project title / "NEXT PROJECT" (sibling to scroll container)
   *
   * z-250 ChevronRight navigation hint (sibling to scroll container)
   *
   * DESKTOP vs MOBILE DIFFERENCES:
   * - Slide width: 50vw (shows 2 slides at once) vs 100vw (mobile)
   * - Images shown: ALL images vs all EXCEPT last (mobile)
   * - Transparent slide: NONE vs required on mobile
   * - Blur: FIXED 12px vs PROGRESSIVE 0→8px (mobile)
   * - ChevronDown: OUTSIDE blur slide (z-20) vs INSIDE (mobile, z-100)
   * - Keyboard: Arrow keys enabled vs touch-only (mobile)
   */

  return (
    <>
      {/* ========== SCROLL CONTAINER (z-0 to z-15) ========== */}

      <div
        ref={containerRef}
        className={styles.motionCarouselDesktop}
        data-carousel
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        {/* z-5: Background layer - blurred by backdrop-filter */}
        <div
          className={styles.motionCarouselDesktopBackground}
          style={{ backgroundImage: `url(${lastImage.src})` }}
        />

        {/* z-10: Slides container */}
        <div className={styles.motionCarouselDesktopContainer}>
          {/* z-15: Regular image slides (ALL images - desktop shows all) */}
          {images.map((image, idx) => (
            <div
              key={image.src}
              className={styles.motionCarouselDesktopSlide}
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={`Slide ${idx + 1}`}
            />
          ))}

          {/* z-15: Blur slide - transparent with backdrop-filter */}
          <div
            className={`${styles.motionCarouselDesktopSlide} ${styles.motionCarouselDesktopSlideBlur}`}
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
            style={{ cursor: 'pointer' }}
          >
            {/* Backdrop blur overlay - fixed 12px blur */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                zIndex: 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* ========== OVERLAYS (z-20 to z-250) ========== */}

      {/* z-200: Project Title */}
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
            opacity: isTitleVisible ? 1 : 0,
            visibility: isTitleVisible ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
          }}
          onClick={handleTitleClick}
        >
          {isOnBlurSlide ? 'NEXT PROJECT' : projectTitle}
        </h1>
      </div>

      {/* z-20: Bottom Progress Bar */}
      {images.length > 1 && (
        <div
          className="absolute bottom-7 z-20"
          style={{
            width: progressBarWidth,
            left: progressBarLeft,
            willChange: 'transform',
          }}
        >
          <div
            style={{
              opacity: isProgressBarVisible ? 1 : 0,
              transform: isProgressBarVisible
                ? 'translateY(0) translateZ(0)'
                : 'translateY(10px) translateZ(0)',
              transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
              pointerEvents: isProgressBarVisible ? 'auto' : 'none',
              width: '100%',
            }}
          >
            <div className="h-0.5 overflow-hidden rounded-full bg-gray-500/50 backdrop-blur-sm">
              <div
                className="h-full bg-gray-50"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* z-20: Bottom ChevronDown (outside blur slide - sibling) */}
      {images.length > 1 && (
        <div
          className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2"
          style={{ transform: 'translate(-50%, 0) translateZ(0)', willChange: 'transform' }}
        >
          <div
            style={{
              opacity: isOnBlurSlide ? 1 : 0,
              transform: isOnBlurSlide
                ? 'translateY(0) translateZ(0)'
                : 'translateY(-10px) translateZ(0)',
              transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
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

      {/* z-250: Right Chevron (desktop-only navigation hint) */}
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
