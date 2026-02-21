import type { Settings } from '../config/pocketbase'
import type { ProjectImage } from '../types/project'
import { useEffect, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import { projectTitleClasses, projectTitleContainerClasses } from '../utils/sharedStyles'
import ChevronDown from './icons/ChevronDown'
import ChevronRight from './icons/ChevronRight'

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

  const fontSizes = getResponsiveFontSizes(settingsData)
  const lastImage = images[images.length - 1]

  useEffect(() => {
    if (!containerRef.current)
      return

    const handleScroll = () => {
      const carousel = containerRef.current
      if (!carousel)
        return

      const scrollLeft = carousel.scrollLeft
      const containerWidth = carousel.offsetWidth

      // Calculate raw scroll progress (0 to 1)
      const maxScroll = carousel.scrollWidth - containerWidth
      const rawProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0
      setScrollProgress(rawProgress)

      // Desktop slide detection with center-aligned snapping
      // All regular slides are 50vw (half width)
      // Blur slide is 100vw (full width)
      const halfWidth = containerWidth * 0.5

      // Check if we're at the very end (blur slide)
      if (scrollLeft >= maxScroll - 5) {
        setCurrentSlide(totalSlides - 1)
        setIsOnBlurSlide(true)
      }
      else {
        // With center-aligned snapping, we need to round to nearest slide
        // Slide 0 centered at 25vw, Slide 1 centered at 75vw, etc.
        const slideIndex = Math.round(scrollLeft / halfWidth)

        // Cap at last regular image slide
        const actualSlide = Math.min(slideIndex, images.length - 1)
        setCurrentSlide(actualSlide)
        setIsOnBlurSlide(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard navigation when user is typing in an input
      const activeElement = document.activeElement
      const isTyping = activeElement instanceof HTMLInputElement
        || activeElement instanceof HTMLTextAreaElement
        || activeElement?.getAttribute('contenteditable') === 'true'

      if (isTyping)
        return

      const carousel = containerRef.current
      if (!carousel)
        return

      const containerWidth = carousel.offsetWidth
      const halfWidth = containerWidth * 0.5

      if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
        e.preventDefault()
        const nextSlideIndex = currentSlide + 1
        const targetScroll = nextSlideIndex * halfWidth
        carousel.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        })
      }
      else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        e.preventDefault()
        const prevSlideIndex = currentSlide - 1
        const targetScroll = prevSlideIndex * halfWidth
        carousel.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        })
      }
    }

    const carousel = containerRef.current
    carousel.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', handleKeyDown)

    // Initial calculation
    handleScroll()

    return () => {
      carousel.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [images.length, totalSlides, currentSlide])

  const scrollToNextSection = () => {
    const main = document.querySelector('main')
    if (main) {
      main.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
    }
  }

  return (
    <>
      <style>
        {`
        .motion-carousel-desktop {
          position: relative;
          height: 100%;
          width: 100%;
          background-size: cover;
          background-position: center;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
          /* Reset any inherited scroll snap alignment */
          scroll-snap-align: none;
        }

        .motion-carousel-desktop::-webkit-scrollbar {
          display: none;
        }

        .motion-carousel-desktop__background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          z-index: 5;
        }

        .motion-carousel-desktop__container {
          position: relative;
          height: 100%;
          width: 100%;
          display: flex;
          z-index: 10;
        }

        .motion-carousel-desktop__slide {
          position: relative;
          height: 100%;
          flex-shrink: 0;
          min-width: 50vw;
          width: 50vw;
          scroll-snap-align: center;
          scroll-snap-stop: always;
          background-size: cover;
          background-position: center;
          background-color: black;
        }

        .motion-carousel-desktop__slide--blur {
          min-width: 100vw !important;
          width: 100vw !important;
          background: transparent;
          z-index: 15;
        }

        .motion-project-title-desktop {
          font-size: ${fontSizes.desktop}rem;
        }

        @media (min-width: 1280px) {
          .motion-project-title-desktop {
            font-size: ${fontSizes.largeDesktop}rem;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}
      </style>

      <div
        ref={containerRef}
        className="motion-carousel-desktop"
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        {/* Background image for blur effect */}
        <div
          className="motion-carousel-desktop__background"
          style={{ backgroundImage: `url(${lastImage.src})` }}
        />

        {/* Carousel slides container */}
        <div className="motion-carousel-desktop__container">
          {/* Regular image slides (all images) */}
          {images.map((image, idx) => (
            <div
              key={image.src}
              className="motion-carousel-desktop__slide"
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={`Slide ${idx + 1}`}
            />
          ))}

          {/* Blur slide (final slide - always full blur on desktop) */}
          <div
            className="motion-carousel-desktop__slide motion-carousel-desktop__slide--blur"
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
            style={{ cursor: 'pointer' }}
          >
            <div style={{
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
        className={`absolute top-1/2 left-1/2 z-[200] text-center w-full ${projectTitleContainerClasses}`}
        style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <h1
          className={`text-white ${projectTitleClasses} motion-project-title-desktop`}
          style={{
            fontFamily: 'EnduroWeb, sans-serif',
            letterSpacing: '0.03em',
            pointerEvents: 'auto',
            cursor: 'pointer',
            opacity: isPopupVisible || isAboutPopupVisible ? 0 : 1,
            visibility: isPopupVisible || isAboutPopupVisible ? 'hidden' : 'visible',
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

      {/* Progress Bar - Desktop */}
      {images.length > 1 && (
        <div
          className="absolute bottom-7 z-20"
          style={{
            width: screenWidth ? `${screenWidth * 0.8}px` : '80vw',
            left: screenWidth ? `${screenWidth * 0.1}px` : '10vw',
            willChange: 'transform',
          }}
        >
          {/* Progress Bar - slides down when disappearing */}
          <div
            style={{
              opacity: currentSlide > 0 && !isOnBlurSlide ? 1 : 0,
              transform: !isOnBlurSlide ? 'translateY(0) translateZ(0)' : 'translateY(10px) translateZ(0)',
              transition: 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out',
              pointerEvents: currentSlide > 0 && !isOnBlurSlide ? 'auto' : 'none',
              width: '100%',
            }}
          >
            <div className="h-0.5 bg-gray-500/50 rounded-full overflow-hidden backdrop-blur-sm">
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

      {/* Chevron Down - Desktop */}
      {images.length > 1 && (
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
          style={{
            transform: 'translate(-50%, 0) translateZ(0)',
            willChange: 'transform',
          }}
        >
          {/* Chevron Down - slides down from above when appearing */}
          <div
            style={{
              opacity: isOnBlurSlide ? 1 : 0,
              transform: isOnBlurSlide ? 'translateY(0) translateZ(0)' : 'translateY(-10px) translateZ(0)',
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
              className="drop-shadow-2xl hover:opacity-70 transition-opacity duration-300"
            />
          </div>
        </div>
      )}

      {/* Right Chevron - Desktop */}
      {images.length > 1 && currentSlide < images.length - 1 && (
        <button
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer z-[250] transition-opacity duration-150 hover:opacity-70"
          style={{ opacity: 1 }}
          aria-label="Next slide"
          onClick={() => {
            const carousel = containerRef.current
            if (!carousel)
              return

            const containerWidth = carousel.offsetWidth
            const halfWidth = containerWidth * 0.5
            const nextSlideIndex = currentSlide + 1

            // Calculate exact scroll position for next slide (left-aligned)
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
            className="drop-shadow-2xl pointer-events-none"
          />
        </button>
      )}
    </>
  )
}
