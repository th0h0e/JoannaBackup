import type { Settings } from '../config/pocketbase'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { getResponsiveFontSizes } from '../config/pocketbase'
import {
  projectTitleClasses,
  projectTitleContainerClasses,
} from '../utils/sharedStyles'
import { FONT_FAMILY, generateFontMediaQueries, LETTER_SPACING } from '../utils/typography'
import ChevronDown from './icons/ChevronDown'

interface HeroProps {
  heroImage: string
  heroTitle: string
  isAboutPopupVisible: boolean
  settingsData: Settings | null
}

export default function Hero({
  heroImage,
  heroTitle,
  isAboutPopupVisible,
  settingsData,
}: HeroProps) {
  const fontSizes = getResponsiveFontSizes(settingsData)
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    if (!hasTriggeredRef.current && !isAboutPopupVisible) {
      hasTriggeredRef.current = true
      setHasAnimatedIn(true)
    }
  }, [isAboutPopupVisible])

  return (
    <>
      <style>
        {generateFontMediaQueries('.hero-title', fontSizes)}
      </style>
      <section
        id="hero-section"
        className="relative flex w-full snap-center items-center justify-center overflow-hidden bg-white"
        style={{ height: '100lvh' }}
      >
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
          initial={{ scale: 0.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        <AnimatePresence>
          {!isAboutPopupVisible && (
            <motion.div
              className={`absolute top-1/2 left-1/2 z-10 w-full text-center ${projectTitleContainerClasses}`}
              style={{
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.15, delay: hasAnimatedIn ? 0 : 1.2 },
              }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <h1
                className={`text-white ${projectTitleClasses} hero-title`}
                style={{
                  fontFamily: FONT_FAMILY,
                  letterSpacing: LETTER_SPACING,
                }}
              >
                {heroTitle}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

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
