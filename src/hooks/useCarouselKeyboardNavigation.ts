import type { RefObject } from 'react'
import { useEffect } from 'react'

interface UseCarouselKeyboardNavigationOptions {
  containerRef: RefObject<HTMLDivElement | null>
  currentSlide: number
  totalSlides: number
}

export function useCarouselKeyboardNavigation({
  containerRef,
  currentSlide,
  totalSlides,
}: UseCarouselKeyboardNavigationOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping
        = activeElement instanceof HTMLInputElement
          || activeElement instanceof HTMLTextAreaElement
          || activeElement?.getAttribute('contenteditable') === 'true'

      if (isTyping)
        return

      const carousel = containerRef.current
      if (!carousel)
        return

      const containerWidth = carousel.offsetWidth
      const halfWidth = containerWidth * 0.5

      if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
        e.preventDefault()
        const nextSlideIndex = currentSlide + 1
        const targetScroll = nextSlideIndex * halfWidth
        carousel.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        })
      }
      else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        e.preventDefault()
        const prevSlideIndex = currentSlide - 1
        const targetScroll = prevSlideIndex * halfWidth
        carousel.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, currentSlide, totalSlides])
}
