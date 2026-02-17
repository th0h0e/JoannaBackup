import { motion } from 'motion/react'
import Asset11Logo from '../assets/logo svg/Asset 11.svg'

interface LogoBottomProps {
  onClick: () => void
  isHero: boolean
  showAboutPopup: boolean
  showPopup: boolean
  isMobile: boolean
}

export default function LogoBottom({ onClick, isHero, showAboutPopup, showPopup, isMobile }: LogoBottomProps) {
  // Fixed container dimensions - exact same as LogoTop
  const containerWidth = isMobile ? '160px' : '200px'
  const containerHeight = isMobile ? '60px' : '80px'

  return (
    <motion.div
      className="fixed cursor-pointer flex items-center justify-center"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        mixBlendMode: 'exclusion',
        width: containerWidth,
        height: containerHeight,
        opacity: showAboutPopup || (showPopup && isMobile) ? 0 : 1,
        pointerEvents: showAboutPopup || (showPopup && isMobile) ? 'none' : 'auto',
        transition: 'opacity 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out',
      }}
      initial={{ top: isHero ? '68lvh' : 'calc(100lvh - 60px - 80px)' }}
      animate={{ top: 'calc(100lvh - 60px - 80px)' }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onClick={onClick}
    >
      <img
        src={Asset11Logo}
        alt="Van Der Weg Logo Bottom"
        style={{
          filter: 'brightness(0) invert(1)',
          maxWidth: '100%', // Full width since Asset 11 is the width baseline
          maxHeight: '83.33%', // 83.33333333% - proportional to Asset 7's height
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </motion.div>
  )
}
