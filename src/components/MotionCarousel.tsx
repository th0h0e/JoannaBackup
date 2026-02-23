import type { Settings } from '../config/pocketbase'
import type { ProjectImage } from '../types/project'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import { useCarouselBlurIntensity } from '../hooks/useCarouselBlurIntensity'
import { scrollToNextSection } from '../utils/scroll'
import {
  projectTitleClasses,
  projectTitleContainerClasses,
} from '../utils/sharedStyles'
import { createFontCssVars } from '../utils/typography'
import ChevronDown from './icons/ChevronDown'

const PROGRESS_BAR_WIDTH_PERCENT = 0.89
const PROGRESS_BAR_LEFT_PERCENT = 0.055

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

  const { calculateBlur } = useCarouselBlurIntensity({
    slideSelector: '.slide-mobile',
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

  const lastImage = images[images.length - 1]
  const regularImages = images.slice(0, -1)
  const isTitleVisible = !isPopupVisible && !isAboutPopupVisible
  const isProgressBarVisible = currentSlide > 0 && currentSlide <= images.length
  const chevronSize = typeof screenWidth === 'number' && screenWidth >= 768 ? 28 : 24

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
    }

    carousel.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => carousel.removeEventListener('scroll', handleScroll)
  }, [images.length, totalSlides, calculateBlur])

  const handleTitleClick = () => {
    if (isOnBlurSlide) {
      scrollToNextSection()
    }
    else {
      onShowPopup?.(projectTitle)
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth scrollbar-hide [will-change:scroll-position] [backface-visibility:hidden]"
        data-carousel
      >
        <div
          className="absolute inset-0 z-[1] bg-cover bg-center"
          style={{ backgroundImage: `url(${lastImage.src})` }}
        />
        <div className="relative flex h-full w-full">
          {regularImages.map((image, idx) => (
            <div
              key={image.src}
              className="slide-mobile relative h-full w-full flex-shrink-0 min-w-full snap-center snap-always bg-cover bg-center bg-black [will-change:transform] [backface-visibility:hidden]"
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={`Slide ${idx + 1}`}
            />
          ))}

          <div
            className="slide-mobile relative h-full w-full flex-shrink-0 min-w-full snap-center snap-always bg-transparent bg-cover bg-center z-15 opacity-0"
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
            className="slide-mobile relative h-full w-full flex-shrink-0 min-w-full snap-center snap-always bg-transparent z-15 cursor-pointer"
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isOnBlurSlide ? 1 : 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              />
            </div>
            <div
              className="pointer-events-auto absolute bottom-5 left-1/2 z-100 cursor-pointer transition-opacity duration-300 hover:opacity-70"
              style={{
                opacity: isOnBlurSlide ? 1 : 0,
                transform: 'translateX(-50%) translateZ(0)',
                willChange: 'transform, opacity',
                visibility: isOnBlurSlide ? 'visible' : 'hidden',
              }}
              onClick={scrollToNextSection}
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

      <div
        className={`absolute top-1/2 left-1/2 z-200 w-full text-center ${projectTitleContainerClasses}`}
        style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <h1
          className={`text-white font-[EnduroWeb] tracking-[0.03em] text-xl md:text-2xl lg:text-3xl xl:text-4xl ${projectTitleClasses}`}
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

      {images.length > 1 && (
        <ProgressBar
          position="bottom"
          width={progressBarWidth}
          left={progressBarLeft}
          progress={scrollProgress}
          visible={isProgressBarVisible}
        />
      )}

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
