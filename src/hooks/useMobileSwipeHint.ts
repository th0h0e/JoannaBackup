/**
 * @fileoverview Hook for showing mobile swipe hint animation on first visit.
 *
 * When a mobile user scrolls to the first project section for the first time,
 * this hook animates the carousel to show the second slide briefly, then
 * returns to the first slide. This teaches users that horizontal swiping is available.
 *
 * @module hooks/useMobileSwipeHint
 */

import { useEffect } from 'react'

interface UseMobileSwipeHintOptions {
  /** Whether the hint has already been shown */
  hasShownMobileHint: boolean
  /** Setter for hasShownMobileHint */
  setHasShownMobileHint: (value: boolean) => void
  /** Number of projects loaded (must be > 0 to run) */
  projectsCount: number
}

/**
 * Hook for showing mobile swipe hint animation on first visit.
 *
 * @param options - Configuration options
 * @param options.hasShownMobileHint - Whether the hint has already been shown
 * @param options.setHasShownMobileHint - Setter for hasShownMobileHint
 * @param options.projectsCount - Number of projects loaded
 *
 * @example
 * ```tsx
 * const [hasShownMobileHint, setHasShownMobileHint] = useState(false);
 *
 * useMobileSwipeHint({
 *   hasShownMobileHint,
 *   setHasShownMobileHint,
 *   projectsCount: projectsData.length,
 * });
 * ```
 */
export function useMobileSwipeHint({
  hasShownMobileHint,
  setHasShownMobileHint,
  projectsCount,
}: UseMobileSwipeHintOptions) {
  useEffect(() => {
    if (
      window.innerWidth >= 1024
      || hasShownMobileHint
      || projectsCount === 0
    ) {
      return
    }

    const timeoutIds: number[] = []
    let animationTriggered = false

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animationTriggered) {
            animationTriggered = true
            setHasShownMobileHint(true)
            observer.disconnect()

            // eslint-disable-next-line react-web-api/no-leaked-timeout
            const timeout1 = window.setTimeout(() => {
              const firstProjectSection = document.getElementById('project-0')
              const carousel = firstProjectSection?.querySelector('.motion-carousel') as HTMLDivElement

              if (!carousel)
                return

              const slides = carousel.querySelectorAll('.motion-carousel__slide')

              if (slides.length < 2)
                return

              const firstSlide = slides[0]
              const secondSlide = slides[1]

              secondSlide.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
              })

              // eslint-disable-next-line react-web-api/no-leaked-timeout
              const timeout2 = window.setTimeout(() => {
                // eslint-disable-next-line react-web-api/no-leaked-timeout
                const timeout3 = window.setTimeout(() => {
                  firstSlide.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                  })
                }, 300)
                timeoutIds.push(timeout3)
              }, 200)
              timeoutIds.push(timeout2)
            }, 1000)
            timeoutIds.push(timeout1)
          }
        })
      },
      {
        threshold: 0.5,
        rootMargin: '0px',
      },
    )

    const firstProjectSection = document.getElementById('project-0')
    if (firstProjectSection) {
      observer.observe(firstProjectSection)
    }

    return () => {
      timeoutIds.forEach(id => window.clearTimeout(id))
      observer.disconnect()
    }
  }, [hasShownMobileHint, projectsCount, setHasShownMobileHint])
}
