/**
 * @fileoverview Mobile carousel component with native CSS scroll-snap.
 *
 * This component provides a touch-optimized horizontal image carousel for
 * mobile devices and tablets (<1024px). It uses native browser scroll-snap
 * for smooth, predictable slide transitions without JavaScript animations.
 *
 * @module components/MotionCarousel
 * @see {@link MotionCarouselDesktop} - Desktop variant with keyboard navigation
 */

import type { Settings } from '../config/pocketbase'
import type { ProjectImage } from '../types/project'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import { useCarouselBlurIntensity } from '../hooks/useCarouselBlurIntensity'
import { scrollToNextSection } from '../utils/scroll'
import {
  projectTitleClasses,
  projectTitleContainerClasses,
} from '../utils/sharedStyles'
import { createFontCssVars } from '../utils/typography'
import styles from './Carousel.module.css'
import ChevronDown from './icons/ChevronDown'

/* ==========================================================================
   Constants
   ========================================================================== */

const PROGRESS_BAR_WIDTH_PERCENT = 0.89
const PROGRESS_BAR_LEFT_PERCENT = 0.055

/* ==========================================================================
   Types
   ========================================================================== */

interface MotionCarouselProps {
  images: ProjectImage[]
  projectTitle: string
  settingsData?: Settings | null
  totalSlides: number
  showTopProgressBar?: boolean
  onShowPopup?: (title: string) => void
  isPopupVisible?: boolean
  isAboutPopupVisible?: boolean
  screenWidth?: number
}

/* ==========================================================================
   Component
   ========================================================================== */

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
  /* --------------------------------------------------------------------------
     Refs & State
     -------------------------------------------------------------------------- */
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isOnBlurSlide, setIsOnBlurSlide] = useState(false)
  const [blurIntensity, setBlurIntensity] = useState(0)

  /* --------------------------------------------------------------------------
     Hooks
     -------------------------------------------------------------------------- */
  const { calculateBlur } = useCarouselBlurIntensity({
    slideSelector: `.${styles.slideMobile}`,
  })

  const fontSizes = useMemo(
    () => getResponsiveFontSizes(settingsData),
    [settingsData],
  )

  const cssVars = useMemo(
    () => createFontCssVars(fontSizes),
    [fontSizes],
  )

  const progressBarWidth = useMemo(
    () => screenWidth
      ? `${screenWidth * PROGRESS_BAR_WIDTH_PERCENT}px`
      : '89vw',
    [screenWidth],
  )

  const progressBarLeft = useMemo(
    () => screenWidth
      ? `${screenWidth * PROGRESS_BAR_LEFT_PERCENT}px`
      : '5.5vw',
    [screenWidth],
  )

  /* --------------------------------------------------------------------------
     Derived Values
     -------------------------------------------------------------------------- */
  const lastImage = images[images.length - 1]
  const regularImages = images.slice(0, -1)
  const isTitleVisible = !isPopupVisible && !isAboutPopupVisible
  const isProgressBarVisible = currentSlide > 0 && currentSlide <= images.length
  const chevronSize = typeof screenWidth === 'number' && screenWidth >= 768 ? 28 : 24

  /* --------------------------------------------------------------------------
     Scroll Effect
     -------------------------------------------------------------------------- */
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
      const rawProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0

      setScrollProgress(rawProgress)

      const scrollPercentage = rawProgress
      const currentIndex = Math.round(scrollPercentage * (totalSlides - 1))
      const clampedIndex = Math.max(0, Math.min(currentIndex, totalSlides - 1))

      setCurrentSlide(clampedIndex)
      setIsOnBlurSlide(clampedIndex === totalSlides - 1)
      setBlurIntensity(calculateBlur(currentCarousel))
    }

    carousel.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => carousel.removeEventListener('scroll', handleScroll)
  }, [images.length, totalSlides, calculateBlur])

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

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */

  /**
   * LAYER STRUCTURE (from lowest to highest z-index)
   *
   * z-0   .carouselSectionMobile (container)
   *       └─ background: lastImage (shows through transparent slide and blur slide)
   *       └─ Acts as blur target for backdrop-filter
   *
   * z-5   .carouselSectionMobileBackground
   *       └─ Reserved for future use
   *
   * z-10  .slidesWrapperMobile (slides wrapper)
   *       └─ Contains all scrollable slides
   *
   * z-15  Individual slides:
   *       ├─ .regularSlideMobile (visible images, all EXCEPT last)
   *       ├─ .transparentSlideMobile (transparent, reveals z-0)
   *       │    └─ Nested div: lastImage with opacity: 0
   *       └─ .blurSlideMobile (transparent, contains blur overlay)
   *            └─ .blurOverlay > .blackBlurDiv
   *                 └─ backdrop-filter: blur() - blurs z-0 container background
   *
   * z-20  Progress bars (siblings to scroll container)
   *
   * z-100 ChevronDown (inside blur slide, appears on blur slide)
   *
   * z-200 Project title / "NEXT PROJECT" (sibling to scroll container)
   *
   * BLUR SLIDE MECHANISM:
   * The blur slide has a transparent background. When scrolled into view,
   * the .blackBlurDiv applies backdrop-filter: blur() which blurs content
   * BEHIND it (the z-0 container background). Mobile uses PROGRESSIVE blur
   * (0→8px) controlled by blurIntensity state.
   */

  return (
    <>
      {/* ========== SCROLL CONTAINER (z-0 to z-15) ========== */}

      <div
        ref={containerRef}
        className={styles.carouselSectionMobile}
        data-carousel
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        {/* z-10: Slides wrapper */}
        <div className={styles.slidesWrapperMobile}>
          {/* z-15: Regular slides (all EXCEPT last) */}
          {regularImages.map((image, idx) => (
            <div
              key={image.src}
              className={`${styles.slideMobile} ${styles.regularSlideMobile}`}
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={`Slide ${idx + 1}`}
            />
          ))}

          {/* z-15: Transparent slide (reveals z-0) */}
          <div
            className={`${styles.slideMobile} ${styles.transparentSlideMobile}`}
            role="group"
            aria-label={`Slide ${images.length}`}
          >
            {/* Nested div with lastImage, opacity: 0 */}
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

          {/* z-15: Blur slide - transparent with backdrop-filter */}
          <div
            className={`${styles.slideMobile} ${styles.blurSlideMobile}`}
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.blurOverlay}>
              <div
                className={styles.blackBlurDiv}
                style={{
                  background: `rgba(0, 0, 0, ${0.25 * blurIntensity ** 2})`,
                  backdropFilter: `blur(${8 * blurIntensity ** 2}px)`,
                  WebkitBackdropFilter: `blur(${8 * blurIntensity ** 2}px)`,
                  transition: 'none',
                }}
              >
                {/* z-100: ChevronDown inside blur slide */}
                <div
                  className="
                    pointer-events-auto absolute bottom-5 left-1/2 z-100
                    cursor-pointer transition-opacity duration-300 hover:opacity-70
                  "
                  style={{
                    opacity: blurIntensity ** 2,
                    transform: 'translateX(-50%) translateZ(0)',
                    willChange: 'transform, opacity',
                  }}
                >
                  <ChevronDown
                    width={chevronSize}
                    height={chevronSize}
                    color="white"
                    className="drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== OVERLAYS (z-20 to z-200) ========== */}

      {/* z-200: Project Title */}
      <div
        className={`absolute top-1/2 left-1/2 z-200 w-full text-center ${projectTitleContainerClasses}`}
        style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <h1
          className={`text-white ${projectTitleClasses} ${styles.projectTitleMobile}`}
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
        <ProgressBar
          position="bottom"
          width={progressBarWidth}
          left={progressBarLeft}
          progress={scrollProgress}
          visible={isProgressBarVisible}
        />
      )}

      {/* z-20: Top Progress Bar */}
      {showTopProgressBar && images.length > 1 && (
        <ProgressBar
          position="top"
          width={progressBarWidth}
          left={progressBarLeft}
          progress={scrollProgress}
          visible={isProgressBarVisible}
        />
      )}
    </>
  )
}

/* ==========================================================================
   Sub-components
   ========================================================================== */

interface ProgressBarProps {
  position: 'top' | 'bottom'
  width: string
  left: string
  progress: number
  visible: boolean
}

function ProgressBar({ position, width, left, progress, visible }: ProgressBarProps) {
  return (
    <div
      className={`absolute ${position === 'top' ? 'top-5' : 'bottom-5'} z-20`}
      style={{
        width,
        left,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateY(0)'
          : `translateY(${position === 'top' ? '-10px' : '10px'})`,
        transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="h-0.5 overflow-hidden rounded-full bg-gray-500/50 backdrop-blur-sm">
        <div
          className="h-full bg-gray-50"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
