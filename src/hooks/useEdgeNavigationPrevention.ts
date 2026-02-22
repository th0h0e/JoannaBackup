/**
 * @fileoverview Hook for preventing iOS Safari edge navigation gestures.
 *
 * iOS Safari triggers back/forward navigation when swiping from the left edge
 * of the screen. This hook prevents that behavior when the touch occurs within
 * the edge zone but outside a carousel (which should handle horizontal swipes
 * independently).
 *
 * @module hooks/useEdgeNavigationPrevention
 */

import { useCallback } from 'react'
import { useEventListener } from 'usehooks-ts'

/** Distance from left edge to consider as "edge zone" in pixels */
const EDGE_ZONE_PX = 50

/**
 * Hook for preventing iOS Safari edge navigation gestures.
 *
 * @example
 * ```tsx
 * // Just call in your component
 * useEdgeNavigationPrevention();
 * ```
 */
export function useEdgeNavigationPrevention() {
  const preventEdgeNavigation = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    if (touch && touch.clientX < EDGE_ZONE_PX) {
      const carousel = (e.target as Element)?.closest('[data-carousel]')
      if (!carousel) {
        e.preventDefault()
      }
    }
  }, [])

  useEventListener('touchstart', preventEdgeNavigation, undefined, {
    passive: false,
  })
}
