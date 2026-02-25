/**
 * @file AboutPopup.tsx
 * @description Modal dialog component for displaying "About" information.
 *
 * This component renders a centered popup modal with information about the
 * portfolio owner, including their story, expertise, and client list. It uses
 * a fixed positioning strategy with a backdrop overlay and scale animation
 * for smooth entry/exit transitions.
 *
 * @architecture
 * The component follows a modal pattern with:
 *
 * 1. **Backdrop Layer** - Semi-transparent overlay with blur effect (z-index: 40)
 * 2. **Content Layer** - Centered card with SVG background (z-index: 50)
 *
 * Content Structure:
 * - Logo assets at top (Asset 7) and bottom (Asset 11)
 * - Portfolio title (uppercase, centered)
 * - About description paragraph
 * - Expertise section (title + description)
 * - Selected Clients section (title + comma-separated client list)
 * - Contact button (mailto link)
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
 * - About type: PocketBase data type for about content
 *
 * @see {@link ProjectPopup} Similar component for project details
 * @author Joanna van der Wilt
 * @version 2.0.0
 */

import type { About } from '../config/pocketbase'
import { AnimatePresence, motion } from 'motion/react'
import Asset7Logo from '../assets/logo svg/Asset 7.svg'
import Asset11Logo from '../assets/logo svg/Asset 11.svg'
import ProjectCardSVG from '../assets/Project Card/JVDW WEB LIGHT BOX copy.svg'
import { FONT_FAMILY, LETTER_SPACING } from '../utils/typography'

/**
 * Props for the AboutPopup component.
 */
interface AboutPopupProps {
  /** Controls the visibility of the popup modal */
  isVisible: boolean
  /** Callback function invoked when the popup should close (backdrop click) */
  onClose: () => void
  /** About data from PocketBase CMS containing portfolio info, expertise, and clients */
  aboutData: About | null
}

/**
 * Modal dialog component for displaying "About" information.
 *
 * Renders a centered popup with a decorative SVG card background containing
 * the portfolio owner's story, expertise, and client list. The modal features
 * smooth scale animations for entry/exit and a blurred backdrop overlay.
 *
 * @param {AboutPopupProps} props - Component props
 * @param {boolean} props.isVisible - Controls the visibility of the popup modal
 * @param {() => void} props.onClose - Callback function invoked when the popup should close
 * @param {About | null} props.aboutData - About data from PocketBase CMS
 * @returns {JSX.Element} The rendered about popup modal with AnimatePresence wrapper
 */
export default function AboutPopup({
  isVisible,
  onClose,
  aboutData,
}: AboutPopupProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-popup-title"
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
                alt="About Card"
                className="h-auto w-full"
                style={{
                  width: '280px',
                  height: 'auto',
                  filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.15))',
                }}
              />

              <div className="absolute inset-0 flex flex-col justify-between px-4 py-8">
                <div className="flex justify-center">
                  <img
                    src={Asset7Logo}
                    alt="Joanna Logo"
                    style={{
                      width: '4.5rem',
                      height: 'auto',
                      filter: 'brightness(0)',
                    }}
                  />
                </div>

                <div className="flex flex-1 flex-col justify-center">
                  <h2
                    id="about-popup-title"
                    className="text-center leading-tight text-black uppercase"
                    style={{
                      fontFamily: FONT_FAMILY,
                      letterSpacing: LETTER_SPACING,
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {aboutData?.Portfolio_Title || 'Story Driven Strategy'}
                  </h2>
                  <p
                    className="text-center leading-tight text-black"
                    style={{
                      fontFamily: FONT_FAMILY,
                      letterSpacing: LETTER_SPACING,
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {aboutData?.About_Description
                      || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean mattis ipsum vel nulla blandit, eu porta ligula mattis. Phasellus mattis rutrum elit, sed cursus risus tempus quis. Mauris sed ante et lectus consectetur aliquet. Sed in orci a metus aliquam porttitor.'}
                  </p>

                  <h3
                    className="text-center leading-tight text-black uppercase"
                    style={{
                      fontFamily: FONT_FAMILY,
                      letterSpacing: LETTER_SPACING,
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {aboutData?.Expertise_Title || 'Expertise'}
                  </h3>
                  <p
                    className="text-center leading-tight text-black"
                    style={{
                      fontFamily: FONT_FAMILY,
                      letterSpacing: LETTER_SPACING,
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {aboutData?.Expertise_Description
                      || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean mattis ipsum vel nulla blandit.'}
                  </p>

                  <h3
                    className="text-center leading-tight text-black uppercase"
                    style={{
                      fontFamily: FONT_FAMILY,
                      letterSpacing: LETTER_SPACING,
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {aboutData?.Selected_Clients_Title || 'Selected Clients'}
                  </h3>
                  <p
                    className="text-center leading-tight text-black"
                    style={{
                      fontFamily: FONT_FAMILY,
                      letterSpacing: LETTER_SPACING,
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {(
                      aboutData?.Client_List_Json || aboutData?.Client_List
                    )?.join(', ')
                    || 'Ipsum, Dolor, Sit Amet, Consectetur, Adipiscing, Aenean, Mattis, Blandit.'}
                  </p>

                  <button
                    className="cursor-pointer text-center leading-tight text-black transition-opacity duration-300 hover:opacity-70"
                    style={{
                      fontFamily: FONT_FAMILY,
                      letterSpacing: LETTER_SPACING,
                      fontSize: '12px',
                      textDecoration: 'underline',
                      background: 'none',
                      border: 'none',
                      width: '100%',
                    }}
                    onClick={() => {
                      const email
                        = aboutData?.Contact_Email || 'hello@joannavanderwerf.com'
                      window.location.href = `mailto:${email}`
                    }}
                  >
                    {aboutData?.Contact_Message || 'Get in touch'}
                  </button>
                </div>

                <div className="flex justify-center">
                  <img
                    src={Asset11Logo}
                    alt="Van Der Weg Logo"
                    style={{
                      width: '8rem',
                      height: 'auto',
                      filter: 'brightness(0)',
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
