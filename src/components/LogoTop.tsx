/**
 * @file LogoTop.tsx
 * @description Top logo component for the portfolio website navigation.
 *
 * This component renders the "Joanna" portion of the split logo, positioned
 * at the top center of the viewport. It features animated positioning that
 * transitions from a centered hero position to its final fixed position
 * when the user scrolls away from the hero section.
 *
 * @architecture
 * The logo uses a fixed positioning strategy with Motion (Framer Motion) for
 * smooth animations. The component implements:
 *
 * 1. **Fixed Positioning** - Centered horizontally with `left: 50%` and
 *    `translateX(-50%)`, positioned 60px from the top of the viewport.
 *
 * 2. **Hero Animation** - When on the hero section, the logo starts at
 *    `calc(50% - 18lvh)` and animates to its final position over 1.2 seconds
 *    with an easeOut timing function.
 *
 * 3. **Mix-Blend-Mode Exclusion** - Uses CSS `mix-blend-mode: exclusion` to
 *    ensure visibility across all background colors, inverting colors where
 *    the logo overlaps with content.
 *
 * 4. **Visibility Toggling** - Hides when AboutPopup is open or when
 *    ProjectPopup is visible on mobile devices.
 *
 * Responsive Container Dimensions:
 * - Mobile: 160px × 60px
 * - Desktop: 200px × 80px
 *
 * Logo Proportion (Asset 7):
 * - Width: 54.15% of container (proportional to Asset 11's width)
 * - Height: 100% of container (Asset 7 is the height baseline)
 *
 * @see {@link LogoBottom} - Companion bottom logo component
 * @see {@link AboutPopup} - Controls visibility when open
 * @author Joanna van der Wilt
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Libraries
import { motion } from 'motion/react'

// Assets
import Asset7Logo from '../assets/logo svg/Asset 7.svg'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LogoTopProps {
  onClick: () => void
  isHero: boolean
  showAboutPopup: boolean
  showPopup: boolean
  isMobile: boolean
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * Top logo component that displays the "Joanna" portion of the split logo.
 *
 * This component renders a fixed-position logo at the top center of the viewport
 * with animated transitions between hero and scrolled states. The logo uses
 * mix-blend-mode exclusion for visibility on all backgrounds and hides when
 * popups are active.
 *
 * @param {LogoTopProps} props - Component props
 * @param {() => void} props.onClick - Callback triggered when logo is clicked
 * @param {boolean} props.isHero - Whether current section is hero; triggers animation from hero position
 * @param {boolean} props.showAboutPopup - Whether AboutPopup is visible; hides logo when true
 * @param {boolean} props.showPopup - Whether ProjectPopup is visible; hides logo on mobile when true
 * @param {boolean} props.isMobile - Whether viewport is mobile; affects container dimensions
 * @returns {JSX.Element} A Motion-animated fixed-position logo element
 */
export default function LogoTop({
  onClick,
  isHero,
  showAboutPopup,
  showPopup,
  isMobile,
}: LogoTopProps) {
  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const containerWidth = isMobile ? '160px' : '200px'
  const containerHeight = isMobile ? '60px' : '80px'
  const isHidden = showAboutPopup || (showPopup && isMobile)

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      className="fixed flex cursor-pointer items-center justify-center"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        mixBlendMode: 'exclusion',
        width: containerWidth,
        height: containerHeight,
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? 'none' : 'auto',
        transition: 'opacity 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out',
      }}
      initial={{ top: isHero ? 'calc(50% - 18lvh)' : '60px' }}
      animate={{ top: '60px' }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onClick={onClick}
    >
      <img
        src={Asset7Logo}
        alt="Joanna Logo Top"
        style={{
          filter: 'brightness(0) invert(1)',
          maxWidth: '54.15%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </motion.div>
  )
}
