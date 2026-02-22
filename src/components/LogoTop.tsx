import { motion } from 'motion/react'
import Asset7Logo from '../assets/logo svg/Asset 7.svg'

interface LogoTopProps {
  onClick: () => void
  isHero: boolean
  showAboutPopup: boolean
  showPopup: boolean
  isMobile: boolean
}

export default function LogoTop({
  onClick,
  isHero,
  showAboutPopup,
  showPopup,
  isMobile,
}: LogoTopProps) {
  // Fixed container dimensions - same for both logos
  const containerWidth = isMobile ? '160px' : '200px'
  const containerHeight = isMobile ? '60px' : '80px'

  return (
    <motion.div
      className="fixed flex cursor-pointer items-center justify-center"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        mixBlendMode: 'exclusion',
        width: containerWidth,
        height: containerHeight,
        opacity: showAboutPopup || (showPopup && isMobile) ? 0 : 1,
        pointerEvents:
          showAboutPopup || (showPopup && isMobile) ? 'none' : 'auto',
        transition:
          'opacity 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out',
      }}
      initial={{ top: isHero ? 'calc(50% - 18lvh)' : '60px' }}
      animate={{ top: '60px' }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onClick={onClick}
    >
      <img
        src={Asset7Logo}
        alt="Joanna Logo Top"
        style={{
          filter: 'brightness(0) invert(1)',
          maxWidth: '54.15%', // 54.15162455% - proportional to Asset 11's width
          maxHeight: '100%', // Full height since Asset 7 is the height baseline
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </motion.div>
  )
}
