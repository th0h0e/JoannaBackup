/**
 * @fileoverview Typography utilities for consistent font styling.
 *
 * @module utils/typography
 */

import type { CSSProperties } from 'react'

/** Font family used throughout the application */
export const FONT_FAMILY = 'EnduroWeb, sans-serif'

/** Letter spacing for improved readability */
export const LETTER_SPACING = '0.03em'

/** Responsive font size configuration */
export interface FontSizes {
  mobile: number
  tablet: number
  desktop: number
  largeDesktop: number
}

/** Default font sizes when settings are not available */
export const DEFAULT_FONT_SIZES: FontSizes = {
  mobile: 1.25,
  tablet: 1.875,
  desktop: 2.25,
  largeDesktop: 3,
}

/**
 * Creates CSS custom properties object for responsive font sizes.
 *
 * @param fontSizes - Font size configuration object
 * @returns CSSProperties with custom properties for use in CSS modules
 *
 * @example
 * ```tsx
 * const cssVars = createFontCssVars(fontSizes);
 * // { '--font-size-mobile': '1.25rem', ... }
 * ```
 */
export function createFontCssVars(fontSizes: FontSizes): CSSProperties {
  return {
    '--font-size-mobile': `${fontSizes.mobile}rem`,
    '--font-size-tablet': `${fontSizes.tablet}rem`,
    '--font-size-desktop': `${fontSizes.desktop}rem`,
    '--font-size-large-desktop': `${fontSizes.largeDesktop}rem`,
  } as CSSProperties
}

/**
 * Creates inline style object for responsive typography.
 *
 * @param fontSizes - Font size configuration object
 * @returns CSSProperties with font styling
 *
 * @example
 * ```tsx
 * const style = createTypographyStyle(fontSizes);
 * // { fontFamily: 'EnduroWeb, sans-serif', letterSpacing: '0.03em', ... }
 * ```
 */
export function createTypographyStyle(fontSizes: FontSizes): CSSProperties {
  return {
    fontFamily: FONT_FAMILY,
    letterSpacing: LETTER_SPACING,
    fontSize: `${fontSizes.mobile}rem`,
  }
}

/**
 * Generates CSS media queries for responsive font sizes.
 *
 * @param className - CSS class name to target
 * @param fontSizes - Font size configuration object
 * @returns CSS string with media queries
 *
 * @example
 * ```tsx
 * <style>{generateFontMediaQueries('.hero-title', fontSizes)}</style>
 * ```
 */
export function generateFontMediaQueries(
  className: string,
  fontSizes: FontSizes,
): string {
  return `
    ${className} {
      font-size: ${fontSizes.mobile}rem;
    }
    @media (min-width: 768px) {
      ${className} {
        font-size: ${fontSizes.tablet}rem;
      }
    }
    @media (min-width: 1024px) {
      ${className} {
        font-size: ${fontSizes.desktop}rem;
      }
    }
    @media (min-width: 1280px) {
      ${className} {
        font-size: ${fontSizes.largeDesktop}rem;
      }
    }
  `
}

/**
 * Popup content typography constants.
 * Used in ProjectPopup and AboutPopup for consistent styling.
 */
export const POPUP_TYPOGRAPHY = {
  fontFamily: FONT_FAMILY,
  letterSpacing: LETTER_SPACING,
  fontSize: '12px',
  lineHeight: 'tight',
  textTransform: 'uppercase' as const,
}

/**
 * Creates style object for popup text elements.
 *
 * @param isUppercase - Whether text should be uppercase (default: false)
 * @returns CSSProperties for popup text
 */
export function createPopupTextStyle(isUppercase = false): CSSProperties {
  return {
    fontFamily: FONT_FAMILY,
    letterSpacing: LETTER_SPACING,
    fontSize: '12px',
    lineHeight: 'tight',
    textTransform: isUppercase ? 'uppercase' : 'none',
  }
}
