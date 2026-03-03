/**
 * @file ProjectNavigation.tsx
 * @description Reusable project navigation list component with entrance animations.
 *
 * This component renders a styled list of project titles as anchor links, designed
 * for use in both the HamburgerMenu overlay and the ProjectIndex section. It uses
 * Motion (Framer Motion) for entrance animations and supports custom
 * click handlers for programmatic navigation.
 *
 * @architecture
 * The component implements:
 *
 * 1. **Anchor Link Navigation** - Uses `#project-{index}` href pattern for direct
 *    section navigation, enabling browser back/forward support and accessibility
 * 2. **Entrance Animation** - All project titles appear simultaneously with a fade-in
 *    effect after a short delay (150ms)
 * 3. **Responsive Typography** - Uses PocketBase settings for responsive font sizes
 *    across breakpoints via `generateFontMediaQueries()`
 *
 * Animation Configuration:
 * - `listVariants` - Container animation with 150ms delay before children animate
 * - `itemVariants` - Individual item animation fading in from 10px below
 *
 * @see {@link HamburgerMenu} - Uses this component for overlay navigation
 * @see {@link ProjectIndex} - Uses this component for final section navigation
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Types
import type { Settings } from '../config/pocketbase'

// Libraries
import { motion } from 'motion/react'

// Config
import { getResponsiveFontSizes } from '../config/pocketbase'

// Utils
import {
  navigationContainerClasses,
  navigationLinkClasses,
  navigationListClasses,
} from '../utils/sharedStyles'
import { FONT_FAMILY, generateFontMediaQueries, LETTER_SPACING } from '../utils/typography'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ProjectNavigationProps {
  projectTitles: string[]
  onLinkClick?: (index: number) => void
  settingsData?: Settings | null
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      // No stagger - all items appear together after delay
      delayChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * Reusable project navigation list with entrance animations.
 *
 * Renders an animated list of project titles as anchor links. When `onLinkClick`
 * is provided, it intercepts the default anchor navigation and calls the handler
 * instead, allowing the parent component to manage navigation (e.g., closing a
 * menu before navigating). Without a handler, links use native anchor navigation.
 * All items appear simultaneously after a short delay.
 *
 * @param {ProjectNavigationProps} props - Component props
 * @param {string[]} props.projectTitles - Array of project titles to render as navigation links
 * @param {(index: number) => void} [props.onLinkClick] - Optional click handler; receives project index
 * @param {Settings | null} [props.settingsData] - Settings for responsive typography
 * @returns {JSX.Element} An animated navigation list of project links
 */
export default function ProjectNavigation({
  projectTitles,
  onLinkClick,
  settingsData = null,
}: ProjectNavigationProps) {
  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const fontSizes = getResponsiveFontSizes(settingsData)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    if (onLinkClick) {
      e.preventDefault()
      onLinkClick(index)
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <style>
        {generateFontMediaQueries('.project-navigation__link', fontSizes)}
      </style>
      <div className={navigationContainerClasses}>
        <motion.ul
          className={navigationListClasses}
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {projectTitles.map((title, index) => (
            <motion.li key={`${title}-${index}`} variants={itemVariants}>
              <a
                href={`#project-${index}`}
                className={`${navigationLinkClasses} project-navigation__link`}
                style={{
                  fontFamily: FONT_FAMILY,
                  letterSpacing: LETTER_SPACING,
                }}
                onClick={e => handleLinkClick(e, index)}
              >
                {title}
              </a>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </>
  )
}
