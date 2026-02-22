/**
 * @fileoverview Custom hook for managing Embla Carousel state and scroll tracking.
 *
 * This hook provides centralized carousel state management for the MotionCarouselEmbla
 * component, handling scroll progress, current slide detection, and blur intensity
 * calculations for the transition effect on the last slide.
 *
 * @module hooks/useEmblaCarouselLogic
 * @see {@link ../components/MotionCarouselEmbla.tsx} - Primary consumer of this hook
 */

import type useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'

/** Type alias for the Embla Carousel API instance */
type EmblaApi = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>

/**
 * Configuration options for the useEmblaCarouselLogic hook.
 *
 * @interface UseEmblaCarouselLogicOptions
 */
export interface UseEmblaCarouselLogicOptions {
  /**
   * The Embla Carousel API instance returned from the useEmblaCarousel hook.
   * This is required for the hook to function and provides access to carousel
   * methods like scrollProgress() and selectedScrollSnap().
   */
  emblaApi: EmblaApi | undefined

  /**
   * Whether to enable blur intensity calculations for the last slide transition.
   * When enabled, calculates a blur value (0-1) based on scroll position.
   *
   * @default true
   *
   * @remarks
   * Set to false for carousels that don't use the blur transition effect.
   * When disabled, blurIntensity will be undefined in the return value.
   */
  enableBlurIntensity?: boolean
}

/**
 * Return type for the useEmblaCarouselLogic hook.
 *
 * @interface UseEmblaCarouselLogicReturn
 */
export interface UseEmblaCarouselLogicReturn {
  /**
   * Current scroll progress as a percentage (0-100).
   * Updated on every scroll event and slide selection.
   */
  scrollProgress: number

  /**
   * The zero-based index of the currently selected slide.
   * Updated when the user scrolls to or selects a new slide.
   */
  currentSlide: number

  /**
   * Whether the carousel is currently on the blur/transition slide.
   * This is the last slide in the carousel, used for section transitions.
   */
  isOnBlurSlide: boolean

  /**
   * Calculated blur intensity for the transition effect (0-1).
   * Returns undefined when enableBlurIntensity is false.
   *
   * @remarks
   * The blur intensity is calculated dynamically using scrollSnapList():
   * - On blur slide: intensity is 1 (maximum blur)
   * - Approaching blur slide: intensity increases from 0 to 1 based on
   *   progress between the second-to-last snap point and the final snap point
   * - This approach works regardless of the number of slides
   */
  blurIntensity: number | undefined

  /**
   * Handler function to manually trigger scroll state updates.
   * Called automatically on 'scroll' and 'select' events, but can
   * be called manually if needed for edge cases.
   */
  onScroll: () => void
}

/**
 * Custom hook for managing Embla Carousel scroll state and blur transitions.
 *
 * This hook tracks:
 * - Scroll progress percentage (0-100)
 * - Current slide index
 * - Whether the carousel is on the blur/transition slide
 * - Blur intensity for the transition effect
 *
 * @param {UseEmblaCarouselLogicOptions} options - Configuration options
 * @param {EmblaApi | undefined} options.emblaApi - The Embla Carousel API instance
 * @param {boolean} [options.enableBlurIntensity] - Whether to enable blur intensity calculations (default: true)
 * @returns {UseEmblaCarouselLogicReturn} Object containing scroll state and event handlers
 *
 * @example
 * ```tsx
 * const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
 *
 * const {
 *   scrollProgress,
 *   currentSlide,
 *   isOnBlurSlide,
 *   blurIntensity,
 * } = useEmblaCarouselLogic({ emblaApi, enableBlurIntensity: true });
 * ```
 *
 * @remarks
 * When to enable blur intensity:
 * - Enable for carousels that have a transition slide at the end
 * - Disable for carousels without the blur transition effect
 * - The blur creates a smooth visual transition between sections
 */
export function useEmblaCarouselLogic({
  emblaApi,
  enableBlurIntensity = true,
}: UseEmblaCarouselLogicOptions): UseEmblaCarouselLogicReturn {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isOnBlurSlide, setIsOnBlurSlide] = useState(false)
  const [blurIntensity, setBlurIntensity] = useState(0)

  /**
   * Handles scroll events and updates all carousel state.
   *
   * This callback:
   * 1. Gets the current scroll progress from Embla API
   * 2. Determines the selected slide index
   * 3. Checks if we're on the last (blur) slide
   * 4. Calculates blur intensity based on scroll position
   *
   * Note: State setters are called in response to Embla's external events,
   * not as derived state. This is a valid pattern for event handlers.
   */
  /* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
  const onScroll = useCallback(() => {
    if (!emblaApi)
      return

    const progress = emblaApi.scrollProgress()
    const selectedSnap = emblaApi.selectedScrollSnap()
    const scrollSnapList = emblaApi.scrollSnapList()
    const snapCount = scrollSnapList.length

    setScrollProgress(progress)
    setCurrentSlide(selectedSnap)

    const onBlur = selectedSnap === snapCount - 1
    setIsOnBlurSlide(onBlur)

    if (enableBlurIntensity && snapCount >= 2) {
      if (onBlur) {
        setBlurIntensity(1)
      }
      else {
        // Calculate blur progress dynamically based on actual snap positions
        // scrollSnapList() returns progress values (0-1) for each snap point
        // Example with 4 slides: [0, 0.25, 0.5, 0.75, 1]
        const blurSnapStart = scrollSnapList[snapCount - 2] // second-to-last snap
        const blurSnapEnd = scrollSnapList[snapCount - 1] // last snap (blur slide)
        const blurRange = blurSnapEnd - blurSnapStart

        // Calculate how far into the blur transition we are (0-1)
        const blurProgress
          = blurRange > 0
            ? Math.max(0, Math.min(1, (progress - blurSnapStart) / blurRange))
            : 0

        setBlurIntensity(blurProgress)
      }
    }
  }, [emblaApi, enableBlurIntensity])

  useEffect(() => {
    if (!emblaApi)
      return

    // Initialize state and set up event listeners
    onScroll()
    emblaApi.on('scroll', onScroll) // Continuous scroll updates
    emblaApi.on('select', onScroll) // Slide selection/snapping
    emblaApi.on('resize', onScroll) // Container or slide size changes

    return () => {
      emblaApi.off('scroll', onScroll)
      emblaApi.off('select', onScroll)
      emblaApi.off('resize', onScroll)
    }
  }, [emblaApi, onScroll])

  return {
    scrollProgress,
    currentSlide,
    isOnBlurSlide,
    blurIntensity: enableBlurIntensity ? blurIntensity : undefined,
    onScroll,
  }
}

export default useEmblaCarouselLogic
