import type { Settings } from '../config/pocketbase'
import type { ProjectImage } from '../types/project'
import { useEffect, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import {
  projectTitleClasses,
  projectTitleContainerClasses,
} from '../utils/sharedStyles'
import ChevronDown from './icons/ChevronDown'

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
  const [blurIntensity, setBlurIntensity] = useState(0) // 0 to 1, how visible the blur slide is

  const fontSizes = getResponsiveFontSizes(settingsData)
  const lastImage = images[images.length - 1]

  /* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect -- Scroll handler updates state intentionally */
  useEffect(() => {
    if (!containerRef.current)
      return

    // Detect current slide and scroll progress using scroll position
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

      // Mobile/Tablet: Simple calculation
      const scrollPercentage = rawProgress
      const currentIndex = Math.round(scrollPercentage * (totalSlides - 1))
      const clampedIndex = Math.max(0, Math.min(currentIndex, totalSlides - 1))

      setCurrentSlide(clampedIndex)

      // Check if we're on the blur slide (last slide)
      const isBlur = clampedIndex === totalSlides - 1
      setIsOnBlurSlide(isBlur)

      // Calculate blur slide visibility (for progressive blur effect)
      // Find the blur slide element
      const slides = carousel.querySelectorAll('.motion-carousel__slide')
      const blurSlide = slides[slides.length - 1] as HTMLElement

      if (blurSlide) {
        const blurSlideRect = blurSlide.getBoundingClientRect()
        const carouselRect = carousel.getBoundingClientRect()

        // Calculate how centered the blur slide is
        // When blur slide is centered (scroll-snapped): 100%
        // When blur slide is just entering from right: 0%
        const blurSlideLeft = blurSlideRect.left - carouselRect.left
        const carouselWidth = carouselRect.width
        const slideWidth = blurSlideRect.width

        // Ideal centered position (where slide would be when scroll-snapped)
        const idealCenterPosition = (carouselWidth - slideWidth) / 2

        // Calculate distance from center
        const distanceFromCenter = Math.abs(blurSlideLeft - idealCenterPosition)

        // Maximum distance (when slide is just entering from the right)
        const maxDistance = carouselWidth - idealCenterPosition

        // Calculate progress: 0 when entering, 1 when centered
        let visibility = 0
        if (maxDistance > 0) {
          const rawProgress = 1 - distanceFromCenter / maxDistance

          // Add delay: blur only starts after slide is 50% scrolled in
          const delayThreshold = 0.5
          if (rawProgress > delayThreshold) {
            // Remap progress from [delayThreshold, 1] to [0, 1]
            visibility = (rawProgress - delayThreshold) / (1 - delayThreshold)
          }
          else {
            visibility = 0
          }

          visibility = Math.max(0, Math.min(1, visibility))
        }

        setBlurIntensity(visibility)
      }
    }

    const carousel = containerRef.current
    carousel.addEventListener('scroll', handleScroll, { passive: true })

    // Initial calculation
    handleScroll()

    return () => {
      carousel.removeEventListener('scroll', handleScroll)
    }
  }, [images.length, totalSlides])
  /* eslint-enable react-hooks-extra/no-direct-set-state-in-use-effect */

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
        .motion-carousel {
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
        }

        .motion-carousel::-webkit-scrollbar {
          display: none;
        }

        .motion-carousel__background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          z-index: 5;
        }

        .motion-carousel__container {
          position: relative;
          height: 100%;
          width: 100%;
          display: flex;
          z-index: 10;
        }

        .motion-carousel__slide {
          position: relative;
          height: 100%;
          width: 100%;
          flex-shrink: 0;
          min-width: 100%;
          scroll-snap-align: center;
          scroll-snap-stop: always;
        }

        .motion-carousel__slide--image {
          background-size: cover;
          background-position: center;
          background-color: black;
        }

        .motion-carousel__slide--transparent {
          background: transparent;
          z-index: 15;
          opacity: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .motion-carousel__slide--blur {
          background: transparent;
          z-index: 15;
        }

        .motion-carousel__slide--blur > .blur-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .motion-carousel__slide--blur > .blur-overlay > .black-blur-div {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          /* Blur is now controlled by inline styles based on scroll position */
        }

        .motion-project-title {
          font-size: ${fontSizes.mobile}rem;
        }

        @media (min-width: 768px) {
          .motion-project-title {
            font-size: ${fontSizes.tablet}rem;
          }
        }

        @media (min-width: 1024px) {
          .motion-project-title {
            font-size: ${fontSizes.desktop}rem;
          }
        }

        @media (min-width: 1280px) {
          .motion-project-title {
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

      {/* Scroll container - overlays are siblings, NOT inside this div */}
      <div
        ref={containerRef}
        className="motion-carousel"
        style={{ backgroundImage: `url(${lastImage.src})` }}
      >
        {/* Background image for blur effect */}
        <div
          className="motion-carousel__background"
          style={{ backgroundImage: `url(${lastImage.src})` }}
        />

        {/* Carousel slides container */}
        <div className="motion-carousel__container">
          {/* Regular image slides (all except last) */}
          {images.slice(0, -1)
            .map((image, idx) => (
              <div
                key={image.src}
                className="motion-carousel__slide motion-carousel__slide--image"
                style={{ backgroundImage: `url(${image.src})` }}
                role="group"
                aria-label={`Slide ${idx + 1}`}
              />
            ))}

          {/* Transparent slide (shows last image on desktop) */}
          <div
            className="motion-carousel__slide motion-carousel__slide--transparent"
            role="group"
            aria-label={`Slide ${images.length}`}
            style={{ backgroundImage: `url(${lastImage.src})` }}
          />

          {/* Blur slide (final slide with blur effect) */}
          <div
            className="motion-carousel__slide motion-carousel__slide--blur"
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
            style={{ cursor: 'pointer' }}
          >
            <div className="blur-overlay">
              <div
                className="black-blur-div"
                style={{
                  // Mobile/Tablet: Progressive blur based on scroll
                  background: `rgba(0, 0, 0, ${0.25 * blurIntensity ** 2})`,
                  backdropFilter: `blur(${8 * blurIntensity ** 2}px)`,
                  WebkitBackdropFilter: `blur(${8 * blurIntensity ** 2}px)`,
                  transition: 'none',
                }}
              >
                {/* Down Chevron */}
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

      {/* Project Title - sibling of scroll container, positions relative to section */}
      <div
        className={`absolute top-1/2 left-1/2 z-[200] w-full text-center ${projectTitleContainerClasses}`}
        style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <h1
          className={`text-white ${projectTitleClasses} motion-project-title`}
          style={{
            fontFamily: 'EnduroWeb, sans-serif',
            letterSpacing: '0.03em',
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

      {/* Progress Bar (Bottom) - sibling of scroll container, positions relative to section */}
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

      {/* Progress Bar (Top) - sibling of scroll container, positions relative to section */}
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
