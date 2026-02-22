/**
 * @fileoverview Utility functions for carousel management.
 *
 * @module utils/carousel
 */

/** CSS selectors for carousel containers */
const CAROUSEL_SELECTORS = '.motion-carousel, .motion-carousel-desktop'

/**
 * Resets carousel scroll positions for all non-visible sections.
 *
 * When navigating between sections using the hamburger menu or scroll-snap,
 * this ensures that returning to a section starts at the first slide rather
 * than the last viewed position.
 *
 * @param currentSectionId - The ID of the currently visible section
 * @param projectsCount - Total number of projects to iterate through
 * @param delay - Delay before resetting (default: 300ms for animation completion)
 *
 * @example
 * ```tsx
 * resetInactiveCarousels('project-2', projectsData.length);
 * // Resets carousels for project-0, project-1, project-3, etc.
 * ```
 */
export function resetInactiveCarousels(
  currentSectionId: string,
  projectsCount: number,
  delay = 300,
) {
  setTimeout(() => {
    for (let index = 0; index < projectsCount; index++) {
      const sectionId = `project-${index}`

      if (sectionId === currentSectionId)
        continue

      const section = document.getElementById(sectionId)
      if (!section)
        continue

      const carousel = section.querySelector(CAROUSEL_SELECTORS) as HTMLElement
      if (!carousel)
        continue

      carousel.scrollLeft = 0
    }
  }, delay)
}

/**
 * Resets all carousels to their first slide.
 *
 * @param delay - Delay before resetting (default: 100ms)
 */
export function resetAllCarousels(delay = 100) {
  setTimeout(() => {
    const carousels = document.querySelectorAll('[data-carousel]')
    carousels.forEach((carousel) => {
      if (carousel instanceof HTMLElement) {
        carousel.scrollLeft = 0
      }
    })
  }, delay)
}
