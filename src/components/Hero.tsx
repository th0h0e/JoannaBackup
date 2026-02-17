import type { Settings } from '../config/pocketbase'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import { projectTitleClasses, projectTitleContainerClasses } from '../utils/sharedStyles'
import ChevronDown from './icons/ChevronDown'

interface HeroProps {
  heroImage: string
  heroTitle: string
  isAboutPopupVisible: boolean
  settingsData: Settings | null
}

export default function Hero({ heroImage, heroTitle, isAboutPopupVisible, settingsData }: HeroProps) {
  const fontSizes = getResponsiveFontSizes(settingsData)
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false)
  const hasTriggeredRef = useRef(false)

  // Track initial animation completion - setState is intentional for one-time animation trigger
  useEffect(() => {
    if (!hasTriggeredRef.current && !isAboutPopupVisible) {
      hasTriggeredRef.current = true
      setHasAnimatedIn(true) // eslint-disable-line react-hooks-extra/no-direct-set-state-in-use-effect
    }
  }, [isAboutPopupVisible])
  return (
    <>
      <style>
        {`
        .hero-title {
          font-size: ${fontSizes.mobile}rem;
        }
        @media (min-width: 768px) {
          .hero-title {
            font-size: ${fontSizes.tablet}rem;
          }
        }
        @media (min-width: 1024px) {
          .hero-title {
            font-size: ${fontSizes.desktop}rem;
          }
        }
        @media (min-width: 1280px) {
          .hero-title {
            font-size: ${fontSizes.largeDesktop}rem;
          }
        }
      `}
      </style>
      <section
        id="hero-section"
        className="relative w-full snap-center bg-white flex items-center justify-center overflow-hidden"
        style={{ height: '100lvh' }}
      >
        {/* Hero Background Image */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
          initial={{ scale: 0.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Hero Headline */}
        <AnimatePresence>
          {!isAboutPopupVisible && (
            <motion.div
              className={`absolute top-1/2 left-1/2 z-10 text-center w-full ${projectTitleContainerClasses}`}
              style={{
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.15, delay: hasAnimatedIn ? 0 : 1.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <h1
                className={`text-white ${projectTitleClasses} hero-title`}
                style={{
                  fontFamily: 'EnduroWeb, sans-serif',
                  letterSpacing: '0.03em',
                }}
              >
                {heroTitle}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Hint */}
        <div
          className="absolute bottom-8 z-10 text-white"
          style={{ left: '50%', marginLeft: '-12px', opacity: 1 }}
        >
          <ChevronDown
            width={28}
            height={28}
            color="white"
            className="drop-shadow-2xl"
          />
        </div>
      </section>
    </>
  )
}
