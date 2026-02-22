import { describe, expect, it } from 'vitest'
import {
  createFontCssVars,
  createPopupTextStyle,
  DEFAULT_FONT_SIZES,
  FONT_FAMILY,
  generateFontMediaQueries,
  LETTER_SPACING,
} from '@/utils/typography'

describe('typography utilities', () => {
  describe('constants', () => {
    it('should have correct font family', () => {
      expect(FONT_FAMILY).toBe('EnduroWeb, sans-serif')
    })

    it('should have correct letter spacing', () => {
      expect(LETTER_SPACING).toBe('0.03em')
    })

    it('should have default font sizes', () => {
      expect(DEFAULT_FONT_SIZES).toEqual({
        mobile: 1.25,
        tablet: 1.875,
        desktop: 2.25,
        largeDesktop: 3,
      })
    })
  })

  describe('createFontCssVars', () => {
    it('should return CSS custom properties with rem units', () => {
      const result = createFontCssVars({
        mobile: 1.25,
        tablet: 2,
        desktop: 2.5,
        largeDesktop: 3,
      })

      expect(result['--font-size-mobile']).toBe('1.25rem')
      expect(result['--font-size-tablet']).toBe('2rem')
      expect(result['--font-size-desktop']).toBe('2.5rem')
      expect(result['--font-size-large-desktop']).toBe('3rem')
    })

    it('should handle zero values', () => {
      const result = createFontCssVars({
        mobile: 0,
        tablet: 0,
        desktop: 0,
        largeDesktop: 0,
      })

      expect(result['--font-size-mobile']).toBe('0rem')
    })

    it('should handle decimal values', () => {
      const result = createFontCssVars({
        mobile: 1.125,
        tablet: 1.875,
        desktop: 2.25,
        largeDesktop: 3.5,
      })

      expect(result['--font-size-mobile']).toBe('1.125rem')
      expect(result['--font-size-large-desktop']).toBe('3.5rem')
    })
  })

  describe('generateFontMediaQueries', () => {
    it('should generate CSS with media queries', () => {
      const css = generateFontMediaQueries('.test-class', {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        largeDesktop: 4,
      })

      expect(css).toContain('.test-class')
      expect(css).toContain('font-size: 1rem')
      expect(css).toContain('@media (min-width: 768px)')
      expect(css).toContain('@media (min-width: 1024px)')
      expect(css).toContain('@media (min-width: 1280px)')
    })

    it('should include tablet font size in 768px media query', () => {
      const css = generateFontMediaQueries('.hero', {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        largeDesktop: 4,
      })

      const mediaQuery768 = css.match(/@media \(min-width: 768px\)[\s\S]*?\}/)
      expect(mediaQuery768?.[0]).toContain('font-size: 2rem')
    })

    it('should include desktop font size in 1024px media query', () => {
      const css = generateFontMediaQueries('.hero', {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        largeDesktop: 4,
      })

      const mediaQuery1024 = css.match(/@media \(min-width: 1024px\)[\s\S]*?\}/)
      expect(mediaQuery1024?.[0]).toContain('font-size: 3rem')
    })

    it('should include large desktop font size in 1280px media query', () => {
      const css = generateFontMediaQueries('.hero', {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        largeDesktop: 4,
      })

      const mediaQuery1280 = css.match(/@media \(min-width: 1280px\)[\s\S]*?\}/)
      expect(mediaQuery1280?.[0]).toContain('font-size: 4rem')
    })
  })

  describe('createPopupTextStyle', () => {
    it('should return style object with correct defaults', () => {
      const style = createPopupTextStyle()

      expect(style.fontFamily).toBe(FONT_FAMILY)
      expect(style.letterSpacing).toBe(LETTER_SPACING)
      expect(style.fontSize).toBe('12px')
      expect(style.textTransform).toBe('none')
    })

    it('should return uppercase text transform when isUppercase is true', () => {
      const style = createPopupTextStyle(true)

      expect(style.textTransform).toBe('uppercase')
    })

    it('should return none text transform when isUppercase is false', () => {
      const style = createPopupTextStyle(false)

      expect(style.textTransform).toBe('none')
    })
  })
})
