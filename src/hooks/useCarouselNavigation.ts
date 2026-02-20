/**
 * @fileoverview Navigation hook for Embla Carousel components.
 *
 * This module provides a hook for keyboard navigation within carousels.
 * Wheel/trackpad navigation is handled by the embla-carousel-wheel-gestures plugin.
 *
 * @module hooks/useCarouselNavigation
 * @see {@link ../components/MotionCarouselEmbla.tsx} - Primary consumer of this hook
 * @see {@link https://github.com/xiel/embla-carousel-wheel-gestures Wheel Gestures Plugin}
 */

import type useEmblaCarousel from 'embla-carousel-react'
import { useCallback } from 'react'
import { useEventListener } from 'usehooks-ts'

/** Type alias for the Embla Carousel API instance */
type EmblaApi = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>

/**
 * Custom hook for keyboard navigation within the carousel.
 *
 * Listens for left/right arrow key presses and navigates the carousel accordingly.
 * This hook is always active (no conditional enabling) - it simply returns early
 * if emblaApi is undefined (carousel not yet initialized).
 *
 * **Key Bindings:**
 * - ArrowRight: Scrolls to next slide
 * - ArrowLeft: Scrolls to previous slide
 *
 * Both key events are preventDefault()'d to avoid page scrolling.
 *
 * @function useKeyboardNavigation
 * @param {EmblaApi | undefined} emblaApi - The Embla carousel API instance
 * @returns {void}
 *
 * @example
 * ```tsx
 * const [emblaRef, emblaApi] = useEmblaCarousel()
 * useKeyboardNavigation(emblaApi) // Enable arrow key navigation
 * ```
 */
export function useKeyboardNavigation(emblaApi: EmblaApi | undefined) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!emblaApi)
      return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      emblaApi.scrollNext()
    }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      emblaApi.scrollPrev()
    }
  }, [emblaApi])

  useEventListener('keydown', handleKeyDown)
}
