/**
 * @file ProjectNavigation.tsx
 * @description Reusable project navigation list component with staggered animations.
 *
 * This component renders a styled list of project titles as anchor links, designed
 * for use in both the HamburgerMenu overlay and the ProjectIndex section. It uses
 * Motion (Framer Motion) for staggered entrance animations and supports custom
 * click handlers for programmatic navigation.
 *
 * @architecture
 * The component implements:
 *
 * 1. **Anchor Link Navigation** - Uses `#project-{index}` href pattern for direct
 *    section navigation, enabling browser back/forward support and accessibility
 * 2. **Staggered Animation** - Projects appear sequentially with 70ms delay between
 *    each item, creating a cascading reveal effect
 * 3. **Responsive Typography** - Uses PocketBase settings for responsive font sizes
 *    across breakpoints via `generateFontMediaQueries()`
 *
 * Animation Configuration:
 * - `listVariants` - Container animation with staggered children (70ms delay, 150ms initial delay)
 * - `itemVariants` - Individual item animation fading in from 10px below
 *
 * @see {@link HamburgerMenu} - Uses this component for overlay navigation
 * @see {@link ProjectIndex} - Uses this component for final section navigation
 */

import type { Settings } from '../config/pocketbase'
import { motion } from 'motion/react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import {
  navigationContainerClasses,
  navigationLinkClasses,
  navigationListClasses,
} from '../utils/sharedStyles'
import { FONT_FAMILY, generateFontMediaQueries, LETTER_SPACING } from '../utils/typography'

interface ProjectNavigationProps {
  projectTitles: string[]
  onLinkClick?: (index: number) => void
  settingsData?: Settings | null
}

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
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

/**
 * Reusable project navigation list with staggered animations.
 *
 * Renders an animated list of project titles as anchor links. When `onLinkClick`
 * is provided, it intercepts the default anchor navigation and calls the handler
 * instead, allowing the parent component to manage navigation (e.g., closing a
 * menu before navigating). Without a handler, links use native anchor navigation.
 *
 * @param {ProjectNavigationProps} props - Component props
 * @param {string[]} props.projectTitles - Array of project titles to render as navigation links
 * @param {(index: number) => void} [props.onLinkClick] - Optional click handler; receives the project index; prevents default anchor navigation when provided
 * @param {Settings | null} [props.settingsData=null] - Settings data from PocketBase for responsive typography
 * @returns {JSX.Element} An animated navigation list of project links
 */
export default function ProjectNavigation({
  projectTitles,
  onLinkClick,
  settingsData = null,
}: ProjectNavigationProps) {
  const fontSizes = getResponsiveFontSizes(settingsData)

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
                onClick={(e) => {
                  if (onLinkClick) {
                    e.preventDefault()
                    onLinkClick(index)
                  }
                }}
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
