/**
 * @file ProjectPopup.tsx
 * @description Modal dialog component for displaying project details.
 *
 * This component renders a centered popup modal with detailed information
 * about a specific project, including the project title, agency responsibilities,
 * and project description. It uses a fixed positioning strategy with a backdrop
 * overlay and scale animation for smooth entry/exit transitions.
 *
 * @architecture
 * The component follows a modal pattern with:
 *
 * 1. **Backdrop Layer** - Semi-transparent overlay (z-index: 40)
 * 2. **Content Layer** - Centered card with SVG background (z-index: 50)
 *
 * Content Structure:
 * - Project title (uppercase, 12px, centered)
 * - Agency responsibilities (uppercase, 12px, line-separated)
 * - Project description (normal case, 12px)
 *
 * Animation Behavior:
 * - Entry: Scale from 0.85 to 1.0 with opacity fade-in (0.3s easeOut)
 * - Exit: Scale from 1.0 to 0.85 with opacity fade-out (0.3s)
 * - Backdrop: Opacity transition from 0 to 1 (0.3s)
 *
 * Typography Settings:
 * - Font Family: EnduroWeb (via FONT_FAMILY constant)
 * - Letter Spacing: 0.03em (via LETTER_SPACING constant)
 * - Font Size: 12px across all text elements
 * - Section Margins: 18px between content sections
 *
 * Layout Dimensions:
 * - Width: 280px (fixed)
 * - Position: Fixed, centered (top: 50%, left: 50%, translate: -50%, -50%)
 * - Drop Shadow: 0 8px 20px rgba(0, 0, 0, 0.15)
 *
 * @dependencies
 * - motion/react: Animation library for AnimatePresence and motion components
 *
 * @see {@link AboutPopup} Similar component for about information
 * @author Joanna van der Wilt
 * @version 2.0.0
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Libraries
import { AnimatePresence, motion } from 'motion/react'

// Assets
import ProjectCardSVG from '../assets/Project Card/JVDW WEB LIGHT BOX copy.svg'

// Utils
import { FONT_FAMILY, LETTER_SPACING } from '../utils/typography'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ProjectPopupProps {
  isVisible: boolean
  onClose: () => void
  projectTitle: string
  projectDescription: string
  projectResponsibility: string[]
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * Modal dialog component for displaying project details.
 *
 * Renders a centered popup with a decorative SVG card background containing
 * project information including title, responsibilities, and description.
 * The modal features smooth scale animations for entry/exit and a backdrop overlay.
 *
 * @param {ProjectPopupProps} props - Component props
 * @param {boolean} props.isVisible - Controls the visibility of the popup modal
 * @param {() => void} props.onClose - Callback function invoked when the popup should close
 * @param {string} props.projectTitle - The title of the project to display
 * @param {string} props.projectDescription - The description text for the project
 * @param {string[]} props.projectResponsibility - Array of agency responsibilities
 * @returns {JSX.Element} The rendered project popup modal with AnimatePresence wrapper
 */
export default function ProjectPopup({
  isVisible,
  onClose,
  projectTitle,
  projectDescription,
  projectResponsibility,
}: ProjectPopupProps) {
  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className="fixed z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-popup-title"
            style={{
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%',
              width: '280px',
            }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="relative">
              <img
                src={ProjectCardSVG}
                alt="Project Card"
                className="h-auto w-full"
                style={{
                  width: '280px',
                  height: 'auto',
                  filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.15))',
                }}
              />

              <div className="absolute inset-0 flex flex-col justify-center px-4 py-8">
                <h2
                  id="project-popup-title"
                  className="text-center leading-tight text-black uppercase"
                  style={{
                    fontFamily: FONT_FAMILY,
                    letterSpacing: LETTER_SPACING,
                    fontSize: '12px',
                    marginBottom: '18px',
                  }}
                >
                  {projectTitle}
                </h2>
                <div
                  className="text-center leading-tight text-black uppercase"
                  style={{
                    fontFamily: FONT_FAMILY,
                    letterSpacing: LETTER_SPACING,
                    fontSize: '12px',
                    marginBottom: '18px',
                  }}
                >
                  {projectResponsibility.map((responsibility, index) => (
                    <span key={`${responsibility}-${index}`}>
                      {responsibility}
                      {index < projectResponsibility.length - 1 && <br />}
                    </span>
                  ))}
                </div>
                <p
                  className="text-center leading-tight text-black"
                  style={{
                    fontFamily: FONT_FAMILY,
                    letterSpacing: LETTER_SPACING,
                    fontSize: '12px',
                  }}
                >
                  {projectDescription}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
