import { AnimatePresence, motion } from 'motion/react'
import ProjectCardSVG from '../assets/Project Card/JVDW WEB LIGHT BOX copy.svg'

interface ProjectPopupProps {
  isVisible: boolean
  onClose: () => void
  projectTitle: string
  projectDescription: string
  projectResponsibility: string[]
}

export default function ProjectPopup({ isVisible, onClose, projectTitle, projectDescription, projectResponsibility }: ProjectPopupProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Invisible Backdrop for click-to-close */}
          <motion.div
            className="fixed inset-0 z-40"
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
            aria-labelledby="project-popup-title"
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
                alt="Project Card"
                className="w-full h-auto"
                style={{
                  width: '280px',
                  height: 'auto',
                  filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.15))',
                }}
              />

              {/* Project Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-center px-4 py-8">
                <h2
                  id="project-popup-title"
                  className="text-black uppercase text-center leading-tight"
                  style={{
                    fontFamily: 'EnduroWeb, sans-serif',
                    letterSpacing: '0.03em',
                    fontSize: '12px',
                    marginBottom: '18px',
                  }}
                >
                  {projectTitle}
                </h2>
                <div
                  className="text-black uppercase text-center leading-tight"
                  style={{
                    fontFamily: 'EnduroWeb, sans-serif',
                    letterSpacing: '0.03em',
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
                  className="text-black text-center leading-tight"
                  style={{
                    fontFamily: 'EnduroWeb, sans-serif',
                    letterSpacing: '0.03em',
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
