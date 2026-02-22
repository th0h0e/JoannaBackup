import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('carousel utilities', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.removeChild(container)
  })

  describe('resetAllCarousels', () => {
    it('should reset all carousels with data-carousel attribute', async () => {
      const { resetAllCarousels } = await import('@/utils/carousel')

      const carousel = document.createElement('div')
      carousel.setAttribute('data-carousel', '')
      carousel.scrollLeft = 100
      container.appendChild(carousel)

      resetAllCarousels(100)
      vi.runAllTimers()

      expect(carousel.scrollLeft).toBe(0)
    })

    it('should use default delay of 100ms', async () => {
      const { resetAllCarousels } = await import('@/utils/carousel')

      const carousel = document.createElement('div')
      carousel.setAttribute('data-carousel', '')
      container.appendChild(carousel)

      const scrollLeftSpy = vi.spyOn(carousel, 'scrollLeft', 'set')

      resetAllCarousels()
      vi.advanceTimersByTime(50)

      expect(scrollLeftSpy).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)

      expect(scrollLeftSpy).toHaveBeenCalled()
    })

    it('should handle empty carousel list', async () => {
      const { resetAllCarousels } = await import('@/utils/carousel')

      expect(() => {
        resetAllCarousels(50)
        vi.runAllTimers()
      }).not.toThrow()
    })
  })

  describe('scrollToNextSection', () => {
    it('should scroll main container by viewport height', async () => {
      const { scrollToNextSection } = await import('@/utils/scroll')

      const main = document.createElement('main')
      const scrollBySpy = vi.fn()
      main.scrollBy = scrollBySpy
      container.appendChild(main)

      vi.stubGlobal('innerHeight', 800)

      scrollToNextSection()

      expect(scrollBySpy).toHaveBeenCalledWith({ top: 800, behavior: 'smooth' })
    })

    it('should handle missing main element', async () => {
      const { scrollToNextSection } = await import('@/utils/scroll')

      expect(() => scrollToNextSection()).not.toThrow()
    })
  })
})
