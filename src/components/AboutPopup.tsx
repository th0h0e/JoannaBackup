import type { About } from '../config/pocketbase'
import { AnimatePresence, motion } from 'motion/react'
import Asset7Logo from '../assets/logo svg/Asset 7.svg'
import Asset11Logo from '../assets/logo svg/Asset 11.svg'
import ProjectCardSVG from '../assets/Project Card/JVDW WEB LIGHT BOX copy.svg'

interface AboutPopupProps {
  isVisible: boolean
  onClose: () => void
  aboutData: About | null
}

export default function AboutPopup({
  isVisible,
  onClose,
  aboutData,
}: AboutPopupProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with blur effect for click-to-close */}
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

          {/* Popup */}
          <motion.div
            className="fixed z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-popup-title"
            style={{
              top: '50%',
              left: '50%',
              width: '280px',
              position: 'fixed',
              transform: 'translate(-50%, -50%) scale(var(--scale, 1))',
            }}
            initial={{ '--scale': 0.8, 'opacity': 0 } as any}
            animate={{ '--scale': 1, 'opacity': 1 } as any}
            exit={{ '--scale': 0.8, 'opacity': 0 } as any}
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

              {/* About Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between px-4 py-8">
                {/* Top Logo */}
                <div className="flex justify-center">
                  <img
                    src={Asset7Logo}
                    alt="Joanna Logo"
                    style={{
                      width: '4.5rem', // Increased from 4rem
                      height: 'auto',
                      filter: 'brightness(0)', // Makes it black, no blend mode
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-center">
                  <h2
                    id="about-popup-title"
                    className="text-center leading-tight text-black uppercase"
                    style={{
                      fontFamily: 'EnduroWeb, sans-serif',
                      letterSpacing: '0.03em',
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {aboutData?.Portfolio_Title || 'Story Driven Strategy'}
                  </h2>
                  <p
                    className="text-center leading-tight text-black"
                    style={{
                      fontFamily: 'EnduroWeb, sans-serif',
                      letterSpacing: '0.03em',
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
                      fontFamily: 'EnduroWeb, sans-serif',
                      letterSpacing: '0.03em',
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {aboutData?.Expertise_Title || 'Expertise'}
                  </h3>
                  <p
                    className="text-center leading-tight text-black"
                    style={{
                      fontFamily: 'EnduroWeb, sans-serif',
                      letterSpacing: '0.03em',
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
                      fontFamily: 'EnduroWeb, sans-serif',
                      letterSpacing: '0.03em',
                      fontSize: '12px',
                      marginBottom: '18px',
                    }}
                  >
                    {aboutData?.Selected_Clients_Title || 'Selected Clients'}
                  </h3>
                  <p
                    className="text-center leading-tight text-black"
                    style={{
                      fontFamily: 'EnduroWeb, sans-serif',
                      letterSpacing: '0.03em',
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
                      fontFamily: 'EnduroWeb, sans-serif',
                      letterSpacing: '0.03em',
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

                {/* Bottom Logo */}
                <div className="flex justify-center">
                  <img
                    src={Asset11Logo}
                    alt="Van Der Weg Logo"
                    style={{
                      width: '8rem', // Increased from 7rem
                      height: 'auto',
                      filter: 'brightness(0)', // Makes it black, no blend mode
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
