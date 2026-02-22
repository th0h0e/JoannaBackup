import { useCallback } from 'react'

interface UseCarouselBlurIntensityOptions {
  slideSelector: string
  delayThreshold?: number
}

interface UseCarouselBlurIntensityReturn {
  calculateBlur: (carousel: HTMLElement) => number
}

export function useCarouselBlurIntensity({
  slideSelector,
  delayThreshold = 0.5,
}: UseCarouselBlurIntensityOptions): UseCarouselBlurIntensityReturn {
  const calculateBlur = useCallback((carousel: HTMLElement): number => {
    const slides = carousel.querySelectorAll(slideSelector)
    const blurSlide = slides[slides.length - 1] as HTMLElement

    if (!blurSlide)
      return 0

    const blurSlideRect = blurSlide.getBoundingClientRect()
    const carouselRect = carousel.getBoundingClientRect()

    const blurSlideLeft = blurSlideRect.left - carouselRect.left
    const carouselWidth = carouselRect.width
    const slideWidth = blurSlideRect.width

    const idealCenterPosition = (carouselWidth - slideWidth) / 2
    const distanceFromCenter = Math.abs(blurSlideLeft - idealCenterPosition)
    const maxDistance = carouselWidth - idealCenterPosition

    if (maxDistance <= 0)
      return 0

    const rawProgress = 1 - distanceFromCenter / maxDistance

    if (rawProgress <= delayThreshold)
      return 0

    const visibility = (rawProgress - delayThreshold) / (1 - delayThreshold)
    return Math.max(0, Math.min(1, visibility))
  }, [slideSelector, delayThreshold])

  return { calculateBlur }
}
