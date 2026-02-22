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
  const [blurIntensity, setBlurIntensity] = useState(0)

  const { calculateBlur } = useCarouselBlurIntensity({
    slideSelector: `.${styles.motionCarouselSlide}`,
  })

  const fontSizes = getResponsiveFontSizes(settingsData)
  const lastImage = images[images.length - 1]

  const cssVars = {
    '--font-size-mobile': `${fontSizes.mobile}rem`,
    '--font-size-tablet': `${fontSizes.tablet}rem`,
    '--font-size-desktop': `${fontSizes.desktop}rem`,
    '--font-size-large-desktop': `${fontSizes.largeDesktop}rem`,
  } as React.CSSProperties

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

      const scrollPercentage = rawProgress
      const currentIndex = Math.round(scrollPercentage * (totalSlides - 1))
      const clampedIndex = Math.max(0, Math.min(currentIndex, totalSlides - 1))

      setCurrentSlide(clampedIndex)

      const isBlur = clampedIndex === totalSlides - 1
      setIsOnBlurSlide(isBlur)

      const intensity = calculateBlur(carousel)
      setBlurIntensity(intensity)
    }

    const carousel = containerRef.current
    carousel.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      carousel.removeEventListener('scroll', handleScroll)
    }
  }, [images.length, totalSlides, calculateBlur])

  return (
    <>
      <div
        ref={containerRef}
        className={styles.motionCarousel}
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        <div
          className={styles.motionCarouselBackground}
          style={{ backgroundImage: `url(${lastImage.src})` }}
        />

        <div className={styles.motionCarouselContainer}>
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

          <div
            className={`${styles.motionCarouselSlide} ${styles.motionCarouselSlideTransparent}`}
            role="group"
            aria-label={`Slide ${images.length}`}
            style={{ backgroundImage: `url(${lastImage.src})` }}
          />

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
                  background: `rgba(0, 0, 0, ${0.25 * blurIntensity ** 2})`,
                  backdropFilter: `blur(${8 * blurIntensity ** 2}px)`,
                  WebkitBackdropFilter: `blur(${8 * blurIntensity ** 2}px)`,
                  transition: 'none',
                }}
              >
                <div
                  className="pointer-events-auto absolute bottom-5 left-1/2 z-[100] cursor-pointer transition-opacity duration-300 hover:opacity-70"
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

      <div
        className={`absolute top-1/2 left-1/2 z-[200] w-full text-center ${projectTitleContainerClasses}`}
        style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <h1
          className={`text-white ${projectTitleClasses} ${styles.motionProjectTitle}`}
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
          className="absolute bottom-5 z-20"
          style={{
            width: screenWidth ? `${screenWidth * 0.89}px` : '89vw',
            left: screenWidth ? `${screenWidth * 0.055}px` : '5.5vw',
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
