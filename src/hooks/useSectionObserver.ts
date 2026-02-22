/**
 * @fileoverview Custom hook for tracking visible sections during scroll navigation.
 *
 * This hook uses IntersectionObserver to track which section is currently visible
 * in the viewport, enabling the App.tsx to:
 * - Update logo positioning based on current section
 * - Track section index for UI state (hamburger menu, etc.)
 * - Reset inactive carousels to their first slide
 *
 * The hook observes all scroll-snap sections in order:
 * 1. Hero section (#hero-section) - index 0
 * 2. Project sections (#project-0, #project-1, etc.) - index 1 to N
 * 3. Project index section (#project-index) - index N+1
 *
 * @module hooks/useSectionObserver
 * @see {@link ../App.tsx} - Primary consumer of this hook
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Configuration options for the useSectionObserver hook.
 *
 * @interface UseSectionObserverOptions
 */
interface UseSectionObserverOptions {
  /**
   * Array of project data used to determine the number of project sections.
   * Only the title property is required for section counting.
   */
  projectsData: { title: string }[]

  /**
   * Optional callback invoked when the active section changes.
   * Used to reset inactive carousels to their first slide.
   *
   * @param currentSectionId - The ID of the newly active section
   *
   * @example
   * ```tsx
   * const resetInactiveCarousels = (currentSectionId: string) => {
   *   // Reset all carousels except the current one
   *   carouselRefs.current.forEach((ref, id) => {
   *     if (id !== currentSectionId && ref?.scrollTo) {
   *       ref.scrollTo(0);
   *     }
   *   });
   * };
   * ```
   */
  resetInactiveCarousels?: (currentSectionId: string) => void
}

/**
 * Return type for the useSectionObserver hook.
 *
 * @interface UseSectionObserverReturn
 */
interface UseSectionObserverReturn {
  /**
   * The zero-based index of the currently visible section.
   *
   * Index mapping:
   * - 0: Hero section
   * - 1 to N: Project sections (N = projectsData.length)
   * - N+1: Project index section
   */
  currentSectionIndex: number

  /**
   * Ref to be attached to the main scrolling container.
   * This ref is used as the IntersectionObserver root, making
   * the observer work relative to the scroll container rather
   * than the viewport.
   */
  mainContainerRef: React.RefObject<HTMLElement | null>
}

/**
 * Custom hook for tracking the currently visible scroll-snap section.
 *
 * This hook implements section tracking using IntersectionObserver with:
 * - 50% visibility threshold (section must be >50% visible)
 * - Root element set to the main scroll container
 * - Automatic section index calculation from DOM element IDs
 *
 * **Section ID Pattern:**
 * - Hero: 'hero-section'
 * - Projects: 'project-{index}' (0-based)
 * - Index: 'project-index'
 *
 * **Index Calculation:**
 * - Hero section → index 0
 * - Project sections → index = parsed ID number + 1
 * - Project index → index = projectsData.length + 1
 *
 * @param {UseSectionObserverOptions} options - Configuration options
 * @param {{ title: string }[]} options.projectsData - Array of project data for section counting
 * @param {(currentSectionId: string) => void} [options.resetInactiveCarousels] - Callback to reset carousels
 * @returns {UseSectionObserverReturn} Object containing current section index and container ref
 *
 * @example
 * ```tsx
 * const { currentSectionIndex, mainContainerRef } = useSectionObserver({
 *   projectsData,
 *   resetInactiveCarousels: (sectionId) => {
 *     // Reset carousels logic
 *   },
 * });
 *
 * return (
 *   <main ref={mainContainerRef} className="snap-y snap-mandatory">
 *     <section id="hero-section">...</section>
 *     {projectsData.map((_, i) => (
 *       <section id={`project-${i}`}>...</section>
 *     ))}
 *     <section id="project-index">...</section>
 *   </main>
 * );
 * ```
 *
 * @remarks
 * The IntersectionObserver is configured with:
 * - threshold: 0.5 - Section must be at least 50% visible
 * - root: mainContainerRef.current - Uses the scroll container as root
 *
 * This ensures accurate tracking with CSS scroll-snap behavior where
 * sections snap to fill most of the container when selected.
 */
export function useSectionObserver({
  projectsData,
  resetInactiveCarousels,
}: UseSectionObserverOptions): UseSectionObserverReturn {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const mainContainerRef = useRef<HTMLElement | null>(null)

  /**
   * Handles section visibility changes and updates state.
   *
   * This callback:
   * 1. Parses the section ID to determine the section type
   * 2. Calculates the numeric index based on section type
   * 3. Updates currentSectionIndex state
   * 4. Calls resetInactiveCarousels if provided
   *
   * @param sectionId - The DOM element ID of the visible section
   */
  const handleSectionChange = useCallback(
    (sectionId: string) => {
      let index: number | undefined

      if (sectionId === 'hero-section') {
        index = 0
      }
      else if (sectionId.startsWith('project-')) {
        index = Number.parseInt(sectionId.replace('project-', '')) + 1
      }
      else if (sectionId === 'project-index') {
        index = projectsData.length + 1
      }

      if (index !== undefined) {
        setCurrentSectionIndex(index)

        if (resetInactiveCarousels) {
          resetInactiveCarousels(sectionId)
        }
      }
    },
    [projectsData.length, resetInactiveCarousels],
  )

  /**
   * Sets up the IntersectionObserver for all sections.
   *
   * Configuration:
   * - Observes hero section, all project sections, and project index
   * - Uses 50% threshold for accurate scroll-snap detection
   * - Uses mainContainerRef as root for container-relative observation
   *
   * Cleanup:
   * - Disconnects observer on unmount
   * - Re-observes all sections when projectsData or handleSectionChange changes
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const sectionId = entry.target.id
            handleSectionChange(sectionId)
          }
        })
      },
      {
        threshold: 0.5,
        root: mainContainerRef.current,
      },
    )

    const heroSection = document.getElementById('hero-section')
    if (heroSection)
      observer.observe(heroSection)

    projectsData.forEach((_, index) => {
      const section = document.getElementById(`project-${index}`)
      if (section)
        observer.observe(section)
    })

    const indexSection = document.getElementById('project-index')
    if (indexSection)
      observer.observe(indexSection)

    return () => observer.disconnect()
  }, [projectsData, handleSectionChange])

  return {
    currentSectionIndex,
    mainContainerRef,
  }
}
