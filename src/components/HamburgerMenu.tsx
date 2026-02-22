import type { Settings } from '../config/pocketbase'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { resetAllCarousels } from '../utils/carousel'
import ProjectNavigation from './ProjectNavigation'

interface HamburgerMenuProps {
  projectTitles: string[]
  isPopupVisible?: boolean
  settingsData?: Settings | null
  isMobile?: boolean
}

export default function HamburgerMenu({
  projectTitles,
  isPopupVisible = false,
  settingsData = null,
  isMobile = false,
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    // Don't allow opening menu when popups are visible
    if (isPopupVisible)
      return
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Hamburger Button */}
      {!isPopupVisible && (
        <button
          onClick={toggleMenu}
          className="fixed top-[80px] right-5 z-[10000] cursor-pointer md:top-[89px] md:right-[40px]"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          <motion.div
            className="block md:h-[18px] md:w-[18px]"
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
                className="fixed inset-0 z-[9998] bg-white"
                style={{ height: '100lvh' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={closeMenu}
              />

              {/* Menu Content */}
              <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center"
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
                    onLinkClick={(index) => {
                      closeMenu()

                      setTimeout(() => {
                        window.location.hash = `#project-${index}`
                        resetAllCarousels(100)
                      }, 300)
                    }}
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
