/**
 * @fileoverview MotionCarouselEmbla - Horizontal image carousel component using Embla Carousel library.
 *
 * This module provides a fully-featured horizontal image carousel with two variants:
 *
 * **Mobile Variant (MotionCarouselEmbla):**
 * - Dynamic blur intensity animation on the blur slide (scales with scroll position)
 * - Top and bottom progress bars (top bar optional via showTopProgressBar)
 * - Full-screen slide display with centered title overlay
 * - Animated chevron indicator on blur slide
 *
 * **Desktop Variant (MotionCarouselDesktopEmbla):**
 * - Fixed blur effect on the blur slide (no intensity animation)
 * - Single bottom progress bar
 * - Right navigation arrow for next slide
 * - Larger chevron indicator for section transition
 *
 * **Architecture:**
 * The component follows a "core + wrapper" pattern:
 * - `CarouselCore` - Internal component containing all shared carousel logic
 * - `MotionCarouselEmbla` - Mobile-specific wrapper (exported)
 * - `MotionCarouselDesktopEmbla` - Desktop-specific wrapper (exported)
 * - `EmblaCarousel` - Unified entry point that selects variant based on props (default export)
 *
 * @module MotionCarouselEmbla
 * @see {@link https://www.embla-carousel.com/ Embla Carousel Documentation}
 */

import type { Settings } from '../config/pocketbase'
import type { ProjectImage } from '../types/project'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useMemo } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import { useKeyboardNavigation, useWheelGesturesNavigation } from '../hooks/useCarouselNavigation'
import { useEmblaCarouselLogic } from '../hooks/useEmblaCarouselLogic'
import { projectTitleClasses, projectTitleContainerClasses } from '../utils/sharedStyles'
import styles from './Carousel.module.css'
import ChevronDown from './icons/ChevronDown'
import ChevronRight from './icons/ChevronRight'

/**
 * Base props interface shared by all carousel variants.
 *
 * @interface BaseCarouselProps
 */
interface BaseCarouselProps {
  /**
   * Array of project images to display in the carousel.
   * Each image should have a `src` property and optional `alt` text.
   */
  images: ProjectImage[]

  /**
   * The title of the project, displayed as an overlay on the carousel.
   * Changes to "NEXT PROJECT" when on the blur slide.
   */
  projectTitle: string

  /**
   * Application settings containing responsive font size configurations.
   * Used to calculate CSS custom properties for typography scaling.
   */
  settingsData?: Settings | null

  /**
   * Total number of slides in the carousel (including the blur slide).
   * Used for progress calculation and navigation logic.
   */
  totalSlides: number

  /**
   * Callback fired when the project title is clicked (not on blur slide).
   * Receives the project title as an argument for popup identification.
   */
  onShowPopup?: (title: string) => void

  /**
   * Whether the project popup is currently visible.
   * When true, the title overlay is hidden to prevent interaction conflicts.
   */
  isPopupVisible?: boolean

  /**
   * Whether the "About" popup is currently visible.
   * When true, the title overlay is hidden to prevent interaction conflicts.
   */
  isAboutPopupVisible?: boolean

  /**
   * Current screen width in pixels.
   * Used for responsive progress bar sizing and positioning.
   */
  screenWidth?: number
}

/**
 * Props interface for the mobile carousel variant.
 *
 * Extends BaseCarouselProps with mobile-specific configuration options.
 *
 * @interface MobileCarouselProps
 * @extends {BaseCarouselProps}
 */
interface MobileCarouselProps extends BaseCarouselProps {
  /**
   * Whether to show the top progress bar.
   * The mobile variant supports both top and bottom progress bars.
   * Defaults to true.
   */
  showTopProgressBar?: boolean
}

/**
 * Props interface for the desktop carousel variant.
 *
 * Currently extends BaseCarouselProps without additional properties,
 * but defined separately for future extensibility and type safety.
 *
 * @interface DesktopCarouselProps
 * @extends {BaseCarouselProps}
 */
interface DesktopCarouselProps extends BaseCarouselProps { }

/**
 * Union type for the EmblaCarousel component props.
 *
 * Uses discriminated union pattern based on the `variant` property:
 * - When variant is 'desktop', uses DesktopCarouselProps
 * - When variant is 'mobile' (or undefined), uses MobileCarouselProps
 *
 * @typedef {(MobileCarouselProps & { variant?: 'mobile' }) | (DesktopCarouselProps & { variant: 'desktop' })} EmblaCarouselProps
 */
type EmblaCarouselProps
  = | (MobileCarouselProps & { variant?: 'mobile' })
    | (DesktopCarouselProps & { variant: 'desktop' })

/**
 * Scrolls the main container to the next vertical section.
 *
 * This function finds the main scrollable container and scrolls it
 * by one viewport height, effectively navigating to the next project section.
 * Used when the user interacts with the blur slide or "NEXT PROJECT" title.
 *
 * @function scrollToNextSection
 * @returns {void}
 */
function scrollToNextSection() {
  const main = document.querySelector('main')
  if (main) {
    main.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
  }
}

/**
 * Internal props interface for the CarouselCore component.
 *
 * Combines all props needed for both mobile and desktop rendering,
 * with the `variant` property determining which rendering path to use.
 *
 * @interface CarouselCoreProps
 */
interface CarouselCoreProps {
  /** Array of project images to display */
  images: ProjectImage[]
  /** Project title displayed as overlay */
  projectTitle: string
  /** Application settings for font configuration */
  settingsData?: Settings | null
  /** Whether project popup is visible (hides title) */
  isPopupVisible: boolean
  /** Whether about popup is visible (hides title) */
  isAboutPopupVisible: boolean
  /** Current screen width for responsive sizing */
  screenWidth?: number
  /** Which variant to render: 'mobile' or 'desktop' */
  variant: 'mobile' | 'desktop'
  /** Whether to show top progress bar (mobile only, default: true) */
  showTopProgressBar?: boolean
  /** Callback for showing project popup */
  onShowPopup?: (title: string) => void
}

/**
 * Core carousel component containing all shared logic for mobile and desktop variants.
 *
 * This component is responsible for:
 * - Initializing the Embla carousel with appropriate configuration
 * - Managing blur slide state and intensity (mobile only)
 * - Rendering the appropriate UI based on the `variant` prop
 * - Handling title click behavior (popup vs section navigation)
 * - Managing progress bar visibility and positioning
 *
 * **Blur Slide Behavior:**
 * The carousel includes a "blur slide" as the final slide. This is a special
 * transparent slide that reveals a blurred version of the last project image
 * beneath it. When the user scrolls to this slide:
 * - The title changes to "NEXT PROJECT"
 * - A chevron indicator appears (animated on mobile)
 * - Clicking navigates to the next vertical section
 *
 * **Progress Bar Visibility:**
 * Progress bars are shown only when:
 * 1. There are multiple images (images.length > 1)
 * 2. Current slide is greater than 0 (not on first/cover slide)
 * 3. On desktop: Not on the blur slide (replaced by chevron)
 *
 * **CSS Custom Properties:**
 * Responsive font sizes are set via CSS custom properties to enable
 * responsive typography without className duplication:
 * - Mobile: --font-size-mobile, --font-size-tablet, --font-size-desktop, --font-size-large-desktop
 * - Desktop: --font-size-desktop, --font-size-large-desktop
 *
 * @function CarouselCore
 * @param {CarouselCoreProps} props - Component props
 * @returns {JSX.Element} The rendered carousel
 *
 * @example
 * ```tsx
 * // Mobile variant
 * <CarouselCore
 *   images={projectImages}
 *   projectTitle="My Project"
 *   variant="mobile"
 *   isPopupVisible={false}
 *   isAboutPopupVisible={false}
 * />
 *
 * // Desktop variant
 * <CarouselCore
 *   images={projectImages}
 *   projectTitle="My Project"
 *   variant="desktop"
 *   isPopupVisible={false}
 *   isAboutPopupVisible={false}
 * />
 * ```
 */
function CarouselCore({
  images,
  projectTitle,
  settingsData,
  isPopupVisible,
  isAboutPopupVisible,
  screenWidth,
  variant,
  showTopProgressBar = true,
  onShowPopup,
}: CarouselCoreProps) {
  const isMobile = variant === 'mobile'

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: false,
    containScroll: 'trimSnaps',
    duration: 45,
    dragThreshold: 5,
    skipSnaps: false,
    inViewThreshold: 0,
  })

  const { scrollProgress, currentSlide, isOnBlurSlide, blurIntensity } = useEmblaCarouselLogic({
    emblaApi,
    enableBlurIntensity: isMobile,
  })

  useKeyboardNavigation(emblaApi)
  useWheelGesturesNavigation(emblaApi)

  const fontSizes = getResponsiveFontSizes(settingsData ?? null)
  const lastImage = images[images.length - 1]

  const cssVars = useMemo(() => {
    if (isMobile) {
      return {
        '--font-size-mobile': `${fontSizes.mobile}rem`,
        '--font-size-tablet': `${fontSizes.tablet}rem`,
        '--font-size-desktop': `${fontSizes.desktop}rem`,
        '--font-size-large-desktop': `${fontSizes.largeDesktop}rem`,
      } as React.CSSProperties
    }
    return {
      '--font-size-desktop': `${fontSizes.desktop}rem`,
      '--font-size-large-desktop': `${fontSizes.largeDesktop}rem`,
    } as React.CSSProperties
  }, [fontSizes, isMobile])

  const handleTitleClick = useCallback(() => {
    if (isOnBlurSlide) {
      scrollToNextSection()
    }
    else {
      onShowPopup?.(projectTitle)
    }
  }, [isOnBlurSlide, onShowPopup, projectTitle])

  const handleNextClick = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  const titleOpacity = isPopupVisible || isAboutPopupVisible ? 0 : 1
  const titleVisibility = isPopupVisible || isAboutPopupVisible ? 'hidden' : 'visible'
  const titleText = isOnBlurSlide ? 'NEXT PROJECT' : projectTitle

  if (isMobile) {
    return (
      <div className={styles.emblaMobile} style={cssVars}>
        <div
          className={styles.emblaMobileBackground}
          style={{ backgroundImage: lastImage ? `url(${lastImage.src})` : undefined }}
        />

        <div className={styles.emblaMobileViewport} ref={emblaRef}>
          <div className={styles.emblaMobileContainer}>
            {images.map((image, idx) => (
              <div
                key={image.src + idx}
                className={styles.emblaMobileSlide}
                style={{ backgroundImage: `url(${image.src})` }}
                role="group"
                aria-label={image.alt || `Slide ${idx + 1}`}
              />
            ))}

            <div
              className={`${styles.emblaMobileSlide} ${styles.emblaMobileSlideBlur}`}
              role="group"
              aria-label="Next section"
              onClick={scrollToNextSection}
            >
              <div
                className={styles.emblaMobileBlurOverlay}
                style={{
                  background: `rgba(0, 0, 0, ${0.25 * (blurIntensity ?? 0) ** 2})`,
                  backdropFilter: `blur(${8 * (blurIntensity ?? 0) ** 2}px)`,
                  WebkitBackdropFilter: `blur(${8 * (blurIntensity ?? 0) ** 2}px)`,
                }}
              >
                <div
                  className="absolute bottom-5 left-1/2 z-[100] cursor-pointer hover:opacity-70 transition-opacity duration-300 pointer-events-auto"
                  style={{
                    opacity: (blurIntensity ?? 0) ** 2,
                    transform: 'translateX(-50%) translateZ(0)',
                    willChange: 'transform, opacity',
                  }}
                  onClick={scrollToNextSection}
                >
                  <ChevronDown width={24} height={24} color="white" className="drop-shadow-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`absolute top-1/2 left-1/2 z-[200] text-center w-full ${projectTitleContainerClasses}`}
          style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
        >
          <h1
            className={`text-white ${projectTitleClasses} ${styles.emblaMobileTitle} ${styles.emblaProjectTitleMobile}`}
            style={{
              pointerEvents: 'auto',
              opacity: titleOpacity,
              visibility: titleVisibility,
            }}
            onClick={handleTitleClick}
          >
            {titleText}
          </h1>
        </div>

        {images.length > 1 && (
          <div
            className={`absolute bottom-5 z-20 ${styles.emblaMobileProgress}`}
            style={{
              width: screenWidth ? `${screenWidth * 0.89}px` : '89vw',
              left: screenWidth ? `${screenWidth * 0.055}px` : '5.5vw',
              opacity: currentSlide > 0 && currentSlide <= images.length ? 1 : 0,
              transform: currentSlide > 0 && currentSlide <= images.length ? 'translateY(0)' : 'translateY(10px)',
              pointerEvents: currentSlide > 0 ? 'auto' : 'none',
            }}
          >
            <div className="h-0.5 bg-gray-500/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gray-50"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        {showTopProgressBar && images.length > 1 && (
          <div
            className={`absolute top-5 z-20 ${styles.emblaMobileProgress}`}
            style={{
              width: screenWidth ? `${screenWidth * 0.89}px` : '89vw',
              left: screenWidth ? `${screenWidth * 0.055}px` : '5.5vw',
              opacity: currentSlide > 0 && currentSlide <= images.length ? 1 : 0,
              transform: currentSlide > 0 && currentSlide <= images.length ? 'translateY(0)' : 'translateY(-10px)',
              pointerEvents: currentSlide > 0 ? 'auto' : 'none',
            }}
          >
            <div className="h-0.5 bg-gray-500/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gray-50"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.emblaDesktop} style={cssVars}>
      <div
        className={styles.emblaDesktopBackground}
        style={{ backgroundImage: lastImage ? `url(${lastImage.src})` : undefined }}
      />

      <div className={styles.emblaDesktopViewport} ref={emblaRef}>
        <div className={styles.emblaDesktopContainer}>
          {images.map((image, idx) => (
            <div
              key={image.src + idx}
              className={styles.emblaDesktopSlide}
              style={{ backgroundImage: `url(${image.src})` }}
              role="group"
              aria-label={image.alt || `Slide ${idx + 1}`}
            />
          ))}

          <div
            className={`${styles.emblaDesktopSlide} ${styles.emblaDesktopSlideBlur}`}
            role="group"
            aria-label="Next section"
            onClick={scrollToNextSection}
          >
            <div
              className={styles.emblaDesktopBlurOverlay}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />
          </div>
        </div>
      </div>

      <div
        className={`absolute top-1/2 left-1/2 z-[200] text-center w-full ${projectTitleContainerClasses}`}
        style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      >
        <h1
          className={`text-white ${projectTitleClasses} ${styles.emblaDesktopTitle} ${styles.emblaProjectTitleDesktop}`}
          style={{
            pointerEvents: 'auto',
            opacity: titleOpacity,
            visibility: titleVisibility,
          }}
          onClick={handleTitleClick}
        >
          {titleText}
        </h1>
      </div>

      {images.length > 1 && (
        <div
          className="absolute bottom-7 left-1/2 z-20"
          style={{ transform: 'translate(-50%, 0) translateZ(0)', willChange: 'transform' }}
        >
          <div
            className={styles.emblaDesktopProgress}
            style={{
              opacity: currentSlide > 0 && !isOnBlurSlide ? 1 : 0,
              transform: !isOnBlurSlide ? 'translateY(0) translateZ(0)' : 'translateY(10px) translateZ(0)',
              pointerEvents: currentSlide > 0 && !isOnBlurSlide ? 'auto' : 'none',
              width: screenWidth ? `${screenWidth * 0.8}px` : '80vw',
            }}
          >
            <div className="h-0.5 bg-gray-500/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gray-50"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {images.length > 1 && (
        <div
          className="absolute bottom-10 left-1/2 z-20"
          style={{ transform: 'translate(-50%, 0) translateZ(0)', willChange: 'transform' }}
        >
          <div
            className={styles.emblaDesktopProgress}
            style={{
              opacity: isOnBlurSlide ? 1 : 0,
              transform: isOnBlurSlide ? 'translateY(0) translateZ(0)' : 'translateY(-10px) translateZ(0)',
              pointerEvents: isOnBlurSlide ? 'auto' : 'none',
              cursor: 'pointer',
            }}
            onClick={scrollToNextSection}
          >
            <ChevronDown width={28} height={28} color="white" className="drop-shadow-2xl" />
          </div>
        </div>
      )}

      {images.length > 1 && currentSlide < images.length - 1 && !isOnBlurSlide && (
        <button
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer z-[250] transition-opacity duration-150 hover:opacity-70"
          aria-label="Next slide"
          onClick={handleNextClick}
        >
          <ChevronRight width={28} height={28} color="white" className="drop-shadow-2xl pointer-events-none" />
        </button>
      )}
    </div>
  )
}

/**
 * Mobile carousel component with animated blur transitions and dual progress bars.
 *
 * This component wraps CarouselCore with the 'mobile' variant, providing:
 * - Dynamic blur intensity that scales with scroll position
 * - Top progress bar (optional, controlled by showTopProgressBar)
 * - Bottom progress bar
 * - Animated chevron indicator on blur slide
 *
 * **Key Differences from Desktop:**
 * - Uses blur intensity animation (0-1 scale) for smooth blur transitions
 * - Has both top and bottom progress indicators
 * - Smaller chevron icon (24px vs 28px)
 * - Progress bars positioned relative to screen edges
 *
 * @function MotionCarouselEmbla
 * @param {MobileCarouselProps} props - Mobile carousel props
 * @returns {JSX.Element} The rendered mobile carousel
 *
 * @example
 * ```tsx
 * <MotionCarouselEmbla
 *   images={projectImages}
 *   projectTitle="My Project"
 *   settingsData={settings}
 *   totalSlides={5}
 *   showTopProgressBar={true}
 *   onShowPopup={handleShowPopup}
 *   isPopupVisible={false}
 *   isAboutPopupVisible={false}
 *   screenWidth={window.innerWidth}
 * />
 * ```
 */
export function MotionCarouselEmbla({
  images,
  projectTitle,
  settingsData = null,
  totalSlides: _totalSlides,
  showTopProgressBar = true,
  onShowPopup,
  isPopupVisible = false,
  isAboutPopupVisible = false,
  screenWidth,
}: MobileCarouselProps) {
  return (
    <CarouselCore
      images={images}
      projectTitle={projectTitle}
      settingsData={settingsData}
      isPopupVisible={isPopupVisible}
      isAboutPopupVisible={isAboutPopupVisible}
      screenWidth={screenWidth}
      variant="mobile"
      showTopProgressBar={showTopProgressBar}
      onShowPopup={onShowPopup}
    />
  )
}

/**
 * Desktop carousel component with fixed blur effect and navigation arrow.
 *
 * This component wraps CarouselCore with the 'desktop' variant, providing:
 * - Fixed blur effect on the blur slide (no intensity animation)
 * - Single centered bottom progress bar
 * - Right-side navigation arrow for next slide
 * - Larger chevron indicator for section transition
 *
 * **Key Differences from Mobile:**
 * - No blur intensity animation (fixed at blur(12px))
 * - Only bottom progress bar
 * - Right navigation arrow (ChevronRight)
 * - Larger chevron icon (28px vs 24px)
 * - Progress bar centered and wider (80vw vs 89vw)
 *
 * @function MotionCarouselDesktopEmbla
 * @param {DesktopCarouselProps} props - Desktop carousel props
 * @returns {JSX.Element} The rendered desktop carousel
 *
 * @example
 * ```tsx
 * <MotionCarouselDesktopEmbla
 *   images={projectImages}
 *   projectTitle="My Project"
 *   settingsData={settings}
 *   totalSlides={5}
 *   onShowPopup={handleShowPopup}
 *   isPopupVisible={false}
 *   isAboutPopupVisible={false}
 *   screenWidth={window.innerWidth}
 * />
 * ```
 */
export function MotionCarouselDesktopEmbla({
  images,
  projectTitle,
  settingsData = null,
  totalSlides: _totalSlides,
  onShowPopup,
  isPopupVisible = false,
  isAboutPopupVisible = false,
  screenWidth,
}: DesktopCarouselProps) {
  return (
    <CarouselCore
      images={images}
      projectTitle={projectTitle}
      settingsData={settingsData}
      isPopupVisible={isPopupVisible}
      isAboutPopupVisible={isAboutPopupVisible}
      screenWidth={screenWidth}
      variant="desktop"
      onShowPopup={onShowPopup}
    />
  )
}

/**
 * Unified carousel component that selects the appropriate variant based on props.
 *
 * This is the recommended entry point for using the carousel. It automatically
 * selects between mobile and desktop variants based on the `variant` prop.
 *
 * **Variant Selection:**
 * - `variant="desktop"`: Uses MotionCarouselDesktopEmbla
 * - `variant="mobile"` or undefined: Uses MotionCarouselEmbla
 *
 * @function EmblaCarousel
 * @param {EmblaCarouselProps} props - Carousel props with variant discriminator
 * @returns {JSX.Element} The appropriate carousel variant
 *
 * @example
 * ```tsx
 * // Auto-select mobile (default)
 * <EmblaCarousel
 *   images={projectImages}
 *   projectTitle="My Project"
 *   totalSlides={5}
 * />
 *
 * // Explicitly select desktop
 * <EmblaCarousel
 *   variant="desktop"
 *   images={projectImages}
 *   projectTitle="My Project"
 *   totalSlides={5}
 * />
 * ```
 */
export function EmblaCarousel({
  variant = 'mobile',
  ...props
}: EmblaCarouselProps) {
  if (variant === 'desktop') {
    return <MotionCarouselDesktopEmbla {...(props as DesktopCarouselProps)} />
  }
  return <MotionCarouselEmbla {...(props as MobileCarouselProps)} />
}

export default EmblaCarousel
