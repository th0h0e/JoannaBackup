/**
 * @file Hero.tsx
 * @description Desktop hero section component for Joanna's Portfolio Website.
 *
 * This component renders the full-screen hero section displayed on desktop viewports
 * (≥1024px). It features an animated background image that scales from 30% to 100%
 * on initial load, creating a dramatic entrance effect.
 *
 * @features
 * - **Scale Animation**: Background image animates from 30% to 100% scale over 1.2s
 * - **Title Display**: Centered hero title with fade-in animation after scale completes
 * - **Scroll Hint**: Animated chevron at bottom indicating scroll direction
 * - **Responsive Typography**: Font sizes adapt based on CMS settings
 * - **Popup Awareness**: Title hides when AboutPopup is visible
 *
 * @architecture
 * Uses motion/react (Framer Motion) for:
 * - Background image scale animation
 * - Title fade-in with delayed start
 * - Continuous chevron bounce animation
 *
 * @see {@link HeroMobile} Mobile variant without animated scroll hint
 * @see {@link App} Parent component that handles responsive switching
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type { Settings } from '../config/pocketbase'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import {
  projectTitleClasses,
  projectTitleContainerClasses,
} from '../utils/sharedStyles'
import {
  FONT_FAMILY,
  generateFontMediaQueries,
  LETTER_SPACING,
} from '../utils/typography'
import ChevronDown from './icons/ChevronDown'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HeroProps {
  heroImage: string
  heroTitle: string
  isAboutPopupVisible: boolean
  settingsData: Settings | null
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * Desktop hero section component with animated background and title.
 *
 * Renders a full-screen hero section with a scale-animated background image,
 * centered title text, and an animated scroll hint chevron. The component
 * is designed for desktop viewports and uses motion/react for smooth animations.
 *
 * @param {HeroProps} props - Component props
 * @param {string} props.heroImage - URL of the hero background image
 * @param {string} props.heroTitle - Title text displayed centered on the hero section
 * @param {boolean} props.isAboutPopupVisible - Whether the About popup is currently visible;
 *   when true, the hero title is hidden via AnimatePresence exit animation
 * @param {Settings | null} props.settingsData - CMS settings containing responsive font sizes
 *   and other configuration options
 *
 * @returns {JSX.Element} The rendered hero section with animated elements
 */
export default function Hero({
  heroImage,
  heroTitle,
  isAboutPopupVisible,
  settingsData,
}: HeroProps) {
  const fontSizes = getResponsiveFontSizes(settingsData)
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    if (!hasTriggeredRef.current && !isAboutPopupVisible) {
      hasTriggeredRef.current = true
      setHasAnimatedIn(true)
    }
  }, [isAboutPopupVisible])

  return (
    <>
      <style>{generateFontMediaQueries('.hero-title', fontSizes)}</style>
      <section
        id="hero-section"
        className="relative flex w-full snap-center items-center justify-center overflow-hidden bg-white"
        style={{ height: '100lvh' }}
      >
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
          initial={{ scale: 0.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        <AnimatePresence>
          {!isAboutPopupVisible && (
            <motion.div
              className={`absolute top-1/2 left-1/2 z-10 w-full text-center ${projectTitleContainerClasses}`}
              style={{
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.15, delay: hasAnimatedIn ? 0 : 1.2 },
              }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <h1
                className={`text-white ${projectTitleClasses} hero-title`}
                style={{
                  fontFamily: FONT_FAMILY,
                  letterSpacing: LETTER_SPACING,
                }}
              >
                {heroTitle}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute bottom-8 z-10 text-white"
          style={{ left: '50%', marginLeft: '-12px' }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 0.3, delay: 1.3 },
          }}
        >
          <ChevronDown
            width={28}
            height={28}
            color="white"
            className="drop-shadow-2xl"
          />
        </motion.div>
      </section>
    </>
  )
}
