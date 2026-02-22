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

/** Progress bar width as percentage of viewport */
const PROGRESS_BAR_WIDTH_PERCENT = 0.8
/** Progress bar left position as percentage of viewport */
const PROGRESS_BAR_LEFT_PERCENT = 0.1
/** Tolerance for blur slide detection in pixels */
const BLUR_SLIDE_TOLERANCE_PX = 5

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

  const cssVars = useMemo(
    () => ({
      '--font-size-desktop': `${fontSizes.desktop}rem`,
      '--font-size-large-desktop': `${fontSizes.largeDesktop}rem`,
    }) as React.CSSProperties,
    [fontSizes],
  )

  const progressBarWidth = useMemo(
    () => screenWidth ? `${screenWidth * PROGRESS_BAR_WIDTH_PERCENT}px` : '80vw',
    [screenWidth],
  )

  const progressBarLeft = useMemo(
    () => screenWidth ? `${screenWidth * PROGRESS_BAR_LEFT_PERCENT}px` : '10vw',
    [screenWidth],
  )

  useEffect(() => {
    if (!containerRef.current)
      return

    const handleScroll = () => {
      const carousel = containerRef.current
      if (!carousel)
        return

      const scrollLeft = carousel.scrollLeft
      const containerWidth = carousel.offsetWidth
      const maxScroll = carousel.scrollWidth - containerWidth
      const rawProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0
      setScrollProgress(rawProgress)

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

    const carousel = containerRef.current
    carousel.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      carousel.removeEventListener('scroll', handleScroll)
    }
  }, [images.length, totalSlides])

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
      <div
        ref={containerRef}
        className={styles.motionCarouselDesktop}
        data-carousel
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        <div
          className={styles.motionCarouselDesktopBackground}
          style={{ backgroundImage: `url(${lastImage.src})` }}
        />

        <div className={styles.motionCarouselDesktopContainer}>
          {images.map((image, idx) => (
            <div
              key={image.src}
              className={styles.motionCarouselDesktopSlide}
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={`Slide ${idx + 1}`}
            />
          ))}

          <div
            className={`${styles.motionCarouselDesktopSlide} ${styles.motionCarouselDesktopSlideBlur}`}
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
            style={{ cursor: 'pointer' }}
          >
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
            opacity: isPopupVisible || isAboutPopupVisible ? 0 : 1,
            visibility:
              isPopupVisible || isAboutPopupVisible ? 'hidden' : 'visible',
            transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
          }}
          onClick={() => {
            if (isOnBlurSlide) {
              scrollToNextSection()
            }
            else {
              onShowPopup?.(projectTitle)
            }
          }}
        >
          {isOnBlurSlide ? 'NEXT PROJECT' : projectTitle}
        </h1>
      </div>

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

      {images.length > 1 && currentSlide < images.length - 1 && (
        <button
          className="absolute top-1/2 right-6 z-250 -translate-y-1/2 cursor-pointer border-none bg-none transition-opacity duration-150 hover:opacity-70"
          style={{ opacity: 1 }}
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
