/**
 * @file LogoBottom.tsx
 * @description Bottom logo component for the portfolio website navigation.
 *
 * This component renders the "Van Der Weg" portion of the split logo, positioned
 * at the bottom center of the viewport. It features animated positioning that
 * transitions from a centered hero position to its final fixed position
 * when the user scrolls away from the hero section.
 *
 * @architecture
 * The logo uses a fixed positioning strategy with Motion (Framer Motion) for
 * smooth animations. The component implements:
 *
 * 1. **Fixed Positioning** - Centered horizontally with `left: 50%` and
 *    `translateX(-50%)`, positioned at `calc(100lvh - 60px - 80px)` from the top
 *    (accounting for top margin and container height).
 *
 * 2. **Hero Animation** - When on the hero section, the logo starts at
 *    `68lvh` and animates to its final position over 1.2 seconds with an
 *    easeOut timing function.
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
 * Logo Proportion (Asset 11):
 * - Width: 100% of container (Asset 11 is the width baseline)
 * - Height: 83.33% of container (proportional to Asset 7's height)
 *
 * @see {@link LogoTop} - Companion top logo component
 * @see {@link AboutPopup} - Controls visibility when open
 * @author Joanna van der Wilt
 */

import { motion } from 'motion/react'
import Asset11Logo from '../assets/logo svg/Asset 11.svg'

/**
 * Props for the LogoBottom component.
 */
interface LogoBottomProps {
  onClick: () => void
  isHero: boolean
  showAboutPopup: boolean
  showPopup: boolean
  isMobile: boolean
}

/**
 * Bottom logo component that displays the "Van Der Weg" portion of the split logo.
 *
 * This component renders a fixed-position logo at the bottom center of the viewport
 * with animated transitions between hero and scrolled states. The logo uses
 * mix-blend-mode exclusion for visibility on all backgrounds and hides when
 * popups are active.
 *
 * @param {() => void} onClick - Callback function triggered when the logo is clicked,
 *   typically used to open the AboutPopup
 * @param {boolean} isHero - Whether the current section is the hero section;
 *   when true, the logo animates from its centered hero position
 * @param {boolean} showAboutPopup - Whether the AboutPopup is currently visible;
 *   when true, the logo fades out and becomes non-interactive
 * @param {boolean} showPopup - Whether the ProjectPopup is currently visible;
 *   when true on mobile, the logo fades out and becomes non-interactive
 * @param {boolean} isMobile - Whether the viewport is in mobile mode;
 *   affects container dimensions (160×60 mobile vs 200×80 desktop)
 *
 * @returns {JSX.Element} A Motion-animated fixed-position logo element
 */
export default function LogoBottom({
  onClick,
  isHero,
  showAboutPopup,
  showPopup,
  isMobile,
}: LogoBottomProps) {
  // Fixed container dimensions - exact same as LogoTop
  const containerWidth = isMobile ? '160px' : '200px'
  const containerHeight = isMobile ? '60px' : '80px'

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
        opacity: showAboutPopup || (showPopup && isMobile) ? 0 : 1,
        pointerEvents:
          showAboutPopup || (showPopup && isMobile) ? 'none' : 'auto',
        transition:
          'opacity 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out',
      }}
      initial={{ top: isHero ? '68lvh' : 'calc(100lvh - 60px - 80px)' }}
      animate={{ top: 'calc(100lvh - 60px - 80px)' }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onClick={onClick}
    >
      <img
        src={Asset11Logo}
        alt="Van Der Weg Logo Bottom"
        style={{
          filter: 'brightness(0) invert(1)',
          maxWidth: '100%', // Full width since Asset 11 is the width baseline
          maxHeight: '83.33%', // 83.33333333% - proportional to Asset 7's height
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </motion.div>
  )
}
