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
import BlurOverlay from './BlurOverlay'
import ChevronDown from './icons/ChevronDown'
import ChevronRight from './icons/ChevronRight'
import { Progress } from './ui/progress'

const PROGRESS_BAR_WIDTH_PERCENT = 0.8
const PROGRESS_BAR_LEFT_PERCENT = 0.1
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
      <div
        ref={containerRef}
        className="relative h-full w-full bg-cover bg-center bg-fixed bg-no-repeat overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth scrollbar-hide [will-change:scroll-position] [backface-visibility:hidden]"
        data-carousel
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        <div className="relative z-10 flex h-full w-full">
          {regularImages.map((image, idx) => (
            <div
              key={image.src}
              className="relative h-full w-[50vw] min-w-[50vw] flex-shrink-0 snap-center snap-always bg-cover bg-center bg-black [will-change:transform] [backface-visibility:hidden]"
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={`Slide ${idx + 1}`}
            />
          ))}

          <div
            className="relative h-full w-screen min-w-screen! flex-shrink-0 snap-center snap-always bg-transparent [will-change:transform]"
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
            className="relative h-full w-screen min-w-screen flex-shrink-0 snap-center snap-always bg-transparent cursor-pointer"
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
        <h1
          className={`text-white font-[EnduroWeb] tracking-[0.03em] text-3xl xl:text-4xl z-20 ${projectTitleClasses}`}
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
            <Progress
              value={scrollProgress * 100}
              className="h-0.5 rounded-full bg-gray-500/50 backdrop-blur-sm"
              indicatorClassName="bg-gray-50"
            />
          </div>
        </div>
      )}

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
