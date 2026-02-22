/**
 * @fileoverview Mobile carousel component with native CSS scroll-snap.
 *
 * This component provides a touch-optimized horizontal image carousel for
 * mobile devices and tablets (<1024px). It uses native browser scroll-snap
 * for smooth, predictable slide transitions without JavaScript animations.
 *
 * @module components/MotionCarousel
 * @see {@link MotionCarouselDesktop} - Desktop variant with keyboard navigation
 * @see {@link useCarouselBlurIntensity} - Hook for blur transition calculation
 *
 * @architecture
 * The carousel consists of three slide types:
 * 1. Image slides (all except last image) - Full-width with background images
 * 2. Transparent slide - Shows last image underneath
 * 3. Blur slide - Progressive blur transition to next section
 *
 * The blur slide uses a progressive effect that increases as the slide
 * scrolls into view, creating a smooth visual transition between sections.
 *
 * @performance
 * - Uses CSS scroll-snap-type: mandatory for browser-native snapping
 * - Passive scroll listeners for better scroll performance
 * - CSS custom properties for responsive font sizes (no JS recalculation)
 */

import type { Settings } from '../config/pocketbase'
import type { ProjectImage } from '../types/project'
import { useEffect, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import { useCarouselBlurIntensity } from '../hooks/useCarouselBlurIntensity'
import { scrollToNextSection } from '../utils/scroll'
import {
  projectTitleClasses,
  projectTitleContainerClasses,
} from '../utils/sharedStyles'
import styles from './Carousel.module.css'
import ChevronDown from './icons/ChevronDown'

/* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */

/**
 * Props for the MotionCarousel component.
 *
 * @interface MotionCarouselProps
 */
interface MotionCarouselProps {
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
   * Total number of slides including blur transition slides.
   * Typically: images.length + 2 (transparent slide + blur slide)
   */
  totalSlides: number

  /**
   * Whether to show the progress bar at the top of the carousel.
   * Defaults to true. Can be disabled via site settings.
   */
  showTopProgressBar?: boolean

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
 * Mobile carousel component with native CSS scroll-snap.
 *
 * Renders a horizontal scrolling carousel with:
 * - Full-width image slides with background images
 * - Progressive blur transition to next section
 * - Centered project title overlay
 * - Progress bars (top and bottom)
 *
 * @param {MotionCarouselProps} props - Component props
 * @returns {JSX.Element} The rendered carousel
 *
 * @example
 * ```tsx
 * <MotionCarousel
 *   images={project.images}
 *   projectTitle={project.title}
 *   settingsData={settingsData}
 *   totalSlides={project.images.length + 2}
 *   onShowPopup={handleShowPopup}
 * />
 * ```
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

  /** Blur intensity (0-1), increases as blur slide scrolls into view */
  const [blurIntensity, setBlurIntensity] = useState(0)

  // ============================================================================
  // HOOKS & DERIVED VALUES
  // ============================================================================

  /**
   * Hook for calculating blur intensity based on scroll position.
   * Returns a calculateBlur function that measures the blur slide's
   * visibility relative to the carousel center.
   */
  const { calculateBlur } = useCarouselBlurIntensity({
    slideSelector: `.${styles.motionCarouselSlide}`,
  })

  /** Responsive font sizes from site settings */
  const fontSizes = getResponsiveFontSizes(settingsData)

  /** Last image used for blur slide background */
  const lastImage = images[images.length - 1]

  /** CSS custom properties for responsive typography */
  const cssVars = {
    '--font-size-mobile': `${fontSizes.mobile}rem`,
    '--font-size-tablet': `${fontSizes.tablet}rem`,
    '--font-size-desktop': `${fontSizes.desktop}rem`,
    '--font-size-large-desktop': `${fontSizes.largeDesktop}rem`,
  } as React.CSSProperties

  // ============================================================================
  // SCROLL HANDLING
  // ============================================================================

  /**
   * Sets up scroll listener to track carousel position.
   *
   * Calculates:
   * - scrollProgress: 0-1 progress through all slides
   * - currentSlide: Index of currently centered slide
   * - isOnBlurSlide: Whether on the last (blur) slide
   * - blurIntensity: How visible the blur effect should be
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

      // Determine current slide index
      const scrollPercentage = rawProgress
      const currentIndex = Math.round(scrollPercentage * (totalSlides - 1))
      const clampedIndex = Math.max(0, Math.min(currentIndex, totalSlides - 1))
      setCurrentSlide(clampedIndex)

      // Check if on blur slide (last slide)
      const isBlur = clampedIndex === totalSlides - 1
      setIsOnBlurSlide(isBlur)

      // Calculate blur intensity for transition effect
      const intensity = calculateBlur(carousel)
      setBlurIntensity(intensity)
    }

    const carousel = containerRef.current
    carousel.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => {
      carousel.removeEventListener('scroll', handleScroll)
    }
  }, [images.length, totalSlides, calculateBlur])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Carousel Container - Scrollable with CSS scroll-snap */}
      <div
        ref={containerRef}
        className={styles.motionCarousel}
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        {/* Background layer for blur effect */}
        <div
          className={styles.motionCarouselBackground}
          style={{ backgroundImage: `url(${lastImage.src})` }}
        />

        {/* Slides Container */}
        <div className={styles.motionCarouselContainer}>
          {/* Image Slides - All except the last image */}
          {images.slice(0, -1)
            .map((image, idx) => (
              <div
                key={image.src}
                className={`${styles.motionCarouselSlide} ${styles.motionCarouselSlideImage}`}
                style={{ backgroundImage: `url(${image.src})` }}
                role="group"
                aria-label={`Slide ${idx + 1}`}
              />
            ))}

          {/* Transparent Slide - Shows last image underneath */}
          <div
            className={`${styles.motionCarouselSlide} ${styles.motionCarouselSlideTransparent}`}
            role="group"
            aria-label={`Slide ${images.length}`}
            style={{ backgroundImage: `url(${lastImage.src})` }}
          />

          {/* Blur Slide - Progressive transition to next section */}
          <div
            className={`${styles.motionCarouselSlide} ${styles.motionCarouselSlideBlur}`}
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.blurOverlay}>
              <div
                className={styles.blackBlurDiv}
                style={{
                  // Blur intensity increases with scroll position
                  background: `rgba(0, 0, 0, ${0.25 * blurIntensity ** 2})`,
                  backdropFilter: `blur(${8 * blurIntensity ** 2}px)`,
                  WebkitBackdropFilter: `blur(${8 * blurIntensity ** 2}px)`,
                  transition: 'none',
                }}
              >
                {/* Down Chevron - Appears when blur slide is centered */}
                <div
                  className="pointer-events-auto absolute bottom-5 left-1/2 z-100 cursor-pointer transition-opacity duration-300 hover:opacity-70"
                  style={{
                    opacity: blurIntensity ** 2,
                    transform: 'translateX(-50%) translateZ(0)',
                    willChange: 'transform, opacity',
                  }}
                >
                  <ChevronDown
                    width={window.innerWidth >= 768 ? 28 : 24}
                    height={window.innerWidth >= 768 ? 28 : 24}
                    color="white"
                    className="drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Title - Centered overlay */}
      <div
        className={`absolute top-1/2 left-1/2 z-200 w-full text-center ${projectTitleContainerClasses}`}
        style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <h1
          className={`text-white ${projectTitleClasses} ${styles.motionProjectTitle}`}
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
          className="absolute bottom-5 z-20"
          style={{
            width: screenWidth ? `${screenWidth * 0.89}px` : '89vw',
            left: screenWidth ? `${screenWidth * 0.055}px` : '5.5vw',
            // Hide on first slide and blur slide
            opacity: currentSlide > 0 && currentSlide <= images.length ? 1 : 0,
            transform:
              currentSlide > 0 && currentSlide <= images.length
                ? 'translateY(0)'
                : 'translateY(10px)',
            transition:
              'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
            pointerEvents: currentSlide > 0 ? 'auto' : 'none',
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
      )}

      {/* Top Progress Bar - Optional, controlled by settings */}
      {showTopProgressBar && images.length > 1 && (
        <div
          className="absolute top-5 z-20"
          style={{
            width: screenWidth ? `${screenWidth * 0.89}px` : '89vw',
            left: screenWidth ? `${screenWidth * 0.055}px` : '5.5vw',
            opacity: currentSlide > 0 && currentSlide <= images.length ? 1 : 0,
            transform:
              currentSlide > 0 && currentSlide <= images.length
                ? 'translateY(0)'
                : 'translateY(-10px)',
            transition:
              'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
            pointerEvents: currentSlide > 0 ? 'auto' : 'none',
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
      )}
    </>
  )
}
