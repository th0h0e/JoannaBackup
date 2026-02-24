import { AnimatePresence, motion } from 'motion/react'

interface BlurOverlayProps {
  visible: boolean
}

const overlayVariants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    WebkitBackdropFilter: 'blur(0px)',
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
}

export default function BlurOverlay({ visible }: BlurOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="blur-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.15)',
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>
  )
}
