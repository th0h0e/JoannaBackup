/**
 * @fileoverview Hook for hiding mobile browser address bar.
 *
 * On mobile devices, the browser address bar takes up valuable viewport space.
 * This hook programmatically scrolls the page slightly to trigger the browser's
 * "hide address bar" behavior.
 *
 * @module hooks/useHideAddressBar
 */

import { useEventListener } from 'usehooks-ts'

/**
 * Hook for hiding mobile browser address bar.
 *
 * This effect:
 * 1. Scrolls to position 1, then 0 after a delay (triggers hide)
 * 2. Re-runs on orientation change (device rotation)
 * 3. Re-runs on resize (for dynamic viewport changes)
 *
 * @example
 * ```tsx
 * // Just call in your component
 * useHideAddressBar();
 * ```
 */
export function useHideAddressBar() {
  useEventListener('orientationchange', () => {
    setTimeout(() => {
      window.scrollTo(0, 1)
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 0)
    }, 100)
  })

  useEventListener('resize', () => {
    setTimeout(() => {
      window.scrollTo(0, 1)
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 0)
    }, 100)
  })
}
