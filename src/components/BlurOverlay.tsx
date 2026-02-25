/**
 * @file BlurOverlay.tsx
 * @description Animated blur overlay component for carousel transitions.
 *
 * This component renders a semi-transparent blur overlay that animates in and
 * out of view, used to create smooth visual transitions within the carousel
 * sections. It employs the Framer Motion variants pattern for declarative
 * animation state management.
 *
 * @architecture
 * The component uses Motion's AnimatePresence for enter/exit animations with
 * a variants pattern that defines animation states:
 *
 * 1. **Variants Pattern** - Uses `overlayVariants` object to define `hidden`
 *    and `visible` states, promoting reusability and maintainability.
 *
 * 2. **Backdrop Filter** - Applies a 12px Gaussian blur with a semi-transparent
 *    black background (15% opacity) for a glassmorphism effect.
 *
 * 3. **Cross-Browser Support** - Includes both `backdropFilter` and
 *    `WebkitBackdropFilter` for Safari compatibility.
 *
 * 4. **Pointer Events** - Set to `none` to allow click-through to underlying
 *    content while maintaining visual effect.
 *
 * Animation Properties:
 * - Duration: 0.6 seconds
 * - Easing: easeOut for smooth fade transitions
 * - Properties: opacity and backdrop-filter blur
 *
 * @see {@link MotionCarousel} - Primary consumer of this component
 * @see {@link MotionCarouselDesktop} - Desktop variant consumer
 * @author Joanna van der Wilt
 */

import { AnimatePresence, motion } from 'motion/react'

/**
 * Props for the BlurOverlay component.
 */
interface BlurOverlayProps {
  visible: boolean
}

/**
 * Animation variants for the blur overlay.
 *
 * Defines the visual states for the overlay animation using Framer Motion's
 * variants pattern. This approach allows for declarative animation state
 * management and easy state transitions.
 *
 * @property {Object} hidden - Initial/exit state with no blur and full transparency
 * @property {number} hidden.opacity - Fully transparent (0)
 * @property {string} hidden.backdropFilter - No blur effect ('blur(0px)')
 * @property {string} hidden.WebkitBackdropFilter - Safari-compatible blur ('blur(0px)')
 * @property {Object} visible - Active state with blur and full opacity
 * @property {number} visible.opacity - Fully visible (1)
 * @property {string} visible.backdropFilter - 12px Gaussian blur ('blur(12px)')
 * @property {string} visible.WebkitBackdropFilter - Safari-compatible blur ('blur(12px)')
 */
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

/**
 * Animated blur overlay component for carousel visual transitions.
 *
 * Renders a full-coverage overlay with a backdrop blur effect that animates
 * smoothly when entering and exiting. Uses AnimatePresence for exit animations
 * and the variants pattern for state management.
 *
 * The overlay is positioned absolutely to fill its parent container and
 * allows pointer events to pass through to underlying elements.
 *
 * @param {boolean} visible - Whether the blur overlay should be visible;
 *   when true, the overlay animates in with blur effect; when false,
 *   it animates out and is removed from the DOM via AnimatePresence
 *
 * @returns {JSX.Element} A Motion-animated blur overlay element, or null
 *   when not visible (handled by AnimatePresence)
 */
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
