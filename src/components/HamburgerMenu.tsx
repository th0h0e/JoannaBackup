/**
 * @file HamburgerMenu.tsx
 * @description Full-screen overlay navigation menu for the portfolio website.
 *
 * This component provides a hamburger-style menu button that, when activated,
 * reveals a full-screen overlay containing the project navigation list. The menu
 * uses React portals to render outside the main container hierarchy, ensuring
 * proper z-index stacking and avoiding CSS containment issues.
 *
 * @architecture
 * The component implements:
 *
 * 1. **Portal Rendering** - Uses `createPortal` to render the overlay directly
 *    to `document.body`, bypassing any parent container constraints
 * 2. **Mix-Blend-Mode** - The hamburger button uses `mix-blend-mode: exclusion`
 *    when closed, making it visible on all backgrounds; switches to normal mode
 *    when open with a black background
 * 3. **Animation System** - Uses Motion (Framer Motion) for smooth open/close
 *    transitions with backdrop, content, and button animations
 *
 * Navigation Pattern:
 * - Uses anchor link navigation (`#project-{index}`) for section jumps
 * - Resets carousel positions after navigation via `resetAllCarousels()`
 * - Includes 300ms delay for smooth close animation before navigation
 *
 * @see {@link ProjectNavigation} - The navigation list component rendered inside
 * @see {@link resetAllCarousels} - Utility to reset carousel scroll positions
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Types
import type { Settings } from '../config/pocketbase'

// Libraries
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

// Utils
import { resetAllCarousels } from '../utils/carousel'

// Components
import ProjectNavigation from './ProjectNavigation'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HamburgerMenuProps {
  projectTitles: string[]
  isPopupVisible?: boolean
  settingsData?: Settings | null
  isMobile?: boolean
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * Full-screen overlay navigation menu component.
 *
 * Renders a fixed-position hamburger button that transforms into an X when clicked,
 * revealing a full-screen white overlay with the project navigation list. The menu
 * uses portal rendering to escape container constraints and mix-blend-mode for
 * visibility on varying backgrounds.
 *
 * @param {HamburgerMenuProps} props - Component props
 * @param {string[]} props.projectTitles - Array of project titles to display in the navigation list
 * @param {boolean} [props.isPopupVisible] - Whether a popup is currently visible; hides the hamburger button when true
 * @param {Settings | null} [props.settingsData] - Settings data from PocketBase for typography configuration
 * @param {boolean} [props.isMobile] - Whether the viewport is mobile; affects button sizing
 * @returns {JSX.Element} The hamburger button and portal-rendered overlay menu
 */
export default function HamburgerMenu({
  projectTitles,
  isPopupVisible = false,
  settingsData = null,
  isMobile = false,
}: HamburgerMenuProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isOpen, setIsOpen] = useState(false)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleMenu = () => {
    if (isPopupVisible)
      return
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const handleNavigation = (index: number) => {
    closeMenu()
    setTimeout(() => {
      window.location.hash = `#project-${index}`
      resetAllCarousels(100)
    }, 300)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Hamburger Button */}
      {!isPopupVisible && (
        <button
          onClick={toggleMenu}
          className="fixed top-20 right-5 z-10000 cursor-pointer md:top-22.25 md:right-10"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <motion.div
            className="block md:h-4.5 md:w-4.5"
            style={{
              mixBlendMode: isOpen ? 'normal' : 'exclusion',
            }}
            animate={{
              rotate: isOpen ? 45 : 0,
              backgroundColor: isOpen ? '#000000' : '#ffffff',
              width: isOpen ? '18px' : isMobile ? '17.32px' : '18px',
              height: isOpen ? '18px' : isMobile ? '17.32px' : '18px',
            }}
            transition={{ duration: 0.3 }}
            whileTap={{ scale: 0.8 }}
          />
        </button>
      )}

      {/* Menu Overlay */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 z-9998 bg-white"
                style={{ height: '100lvh' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={closeMenu}
              />

              {/* Menu Content */}
              <motion.div
                className="fixed inset-0 z-9999 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ height: '100lvh' }}
              >
                <div className="flex w-full items-center justify-center">
                  <ProjectNavigation
                    projectTitles={projectTitles}
                    settingsData={settingsData}
                    onLinkClick={handleNavigation}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
