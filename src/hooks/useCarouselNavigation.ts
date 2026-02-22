/**
 * @fileoverview Navigation hooks for Embla Carousel components.
 *
 * This module provides hooks for keyboard and wheel/trackpad navigation
 * within carousels. The wheel navigation uses the wheel-gestures library
 * for accurate gesture detection and maps gestures to scrollNext/scrollPrev.
 *
 * @module hooks/useCarouselNavigation
 * @see {@link ../components/MotionCarouselEmbla.tsx} - Primary consumer of these hooks
 * @see {@link https://github.com/xiel/wheel-gestures wheel-gestures library}
 */

import type useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useRef } from 'react'
import { useEventListener } from 'usehooks-ts'
import { WheelGestures } from 'wheel-gestures'

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
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
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
    },
    [emblaApi],
  )

  useEventListener('keydown', handleKeyDown)
}

/**
 * Custom hook for wheel/trackpad navigation within the carousel.
 *
 * Uses the wheel-gestures library for accurate gesture detection and maps
 * horizontal swipe gestures to scrollNext/scrollPrev calls. This provides
 * clean, predictable navigation without the bounce effect of physics-based
 * drag handling.
 *
 * **Behavior:**
 * - Horizontal swipe right: Previous slide
 * - Horizontal swipe left: Next slide
 * - One slide per gesture (no momentum multi-slide scrolling)
 * - Respects carousel boundaries
 * - Uses Embla's 'settle' event for accurate animation completion detection
 * - Safety timeout (800ms) as fallback for edge cases
 *
 * @function useWheelGesturesNavigation
 * @param {EmblaApi | undefined} emblaApi - The Embla carousel API instance
 * @returns {void}
 *
 * @example
 * ```tsx
 * const [emblaRef, emblaApi] = useEmblaCarousel()
 * useWheelGesturesNavigation(emblaApi) // Enable trackpad navigation
 * ```
 */
export function useWheelGesturesNavigation(emblaApi: EmblaApi | undefined) {
  const isSettling = useRef(false)
  const wheelGesturesRef = useRef<ReturnType<typeof WheelGestures> | null>(null)
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!emblaApi)
      return

    const containerNode = emblaApi.containerNode()
    if (!containerNode)
      return

    const wheelGestures = WheelGestures({
      preventWheelAction: 'x',
    })

    wheelGesturesRef.current = wheelGestures
    wheelGestures.observe(containerNode)

    const clearSafetyTimeout = () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
        safetyTimeoutRef.current = null
      }
    }

    const handleSettle = () => {
      isSettling.current = false
      clearSafetyTimeout()
    }

    const startSettling = () => {
      isSettling.current = true
      clearSafetyTimeout()
      safetyTimeoutRef.current = setTimeout(() => {
        isSettling.current = false
      }, 800)
    }

    emblaApi.on('settle', handleSettle)

    wheelGestures.on('wheel', (state) => {
      if (isSettling.current)
        return

      const [deltaX] = state.axisDelta

      if (Math.abs(deltaX) < 10)
        return

      const canScrollNext = emblaApi.canScrollNext()
      const canScrollPrev = emblaApi.canScrollPrev()

      const direction = deltaX < 0 ? 'next' : 'prev'

      if (direction === 'next' && canScrollNext) {
        emblaApi.scrollNext()
        startSettling()
      }
      else if (direction === 'prev' && canScrollPrev) {
        emblaApi.scrollPrev()
        startSettling()
      }
    })

    return () => {
      clearSafetyTimeout()
      emblaApi.off('settle', handleSettle)
      wheelGestures.disconnect()
      wheelGesturesRef.current = null
    }
  }, [emblaApi])
}
