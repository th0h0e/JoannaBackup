/**
 * @file BlurOverlayDesktop.tsx
 * @description Static blur overlay component for desktop carousel transitions.
 *
 * This component renders a semi-transparent blur overlay that appears instantly
 * without animation, designed specifically for the desktop carousel experience.
 * Unlike the animated BlurOverlay component, this version provides immediate
 * visual feedback when scrolling to the blur slide.
 *
 * @architecture
 * The component uses a simple conditional render pattern:
 *
 * 1. **Static Rendering** - No Framer Motion or animation library dependencies
 * 2. **Backdrop Filter** - Applies a 12px Gaussian blur with a semi-transparent
 *    black background (15% opacity) for a glassmorphism effect
 * 3. **Cross-Browser Support** - Includes both `backdropFilter` and
 *    `WebkitBackdropFilter` for Safari compatibility
 * 4. **Pointer Events** - Set to `none` to allow click-through to underlying
 *    content while maintaining visual effect
 *
 * @see {@link BlurOverlay} - Animated version for mobile carousel
 * @see {@link MotionCarouselDesktop} - Primary consumer of this component
 * @author Joanna van der Wilt
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BlurOverlayDesktopProps {
  /** Whether the blur overlay should be visible */
  visible: boolean
}

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * Static blur overlay component for desktop carousel visual transitions.
 *
 * Renders a full-coverage overlay with a backdrop blur effect that appears
 * instantly when visible becomes true. No enter/exit animations - the blur
 * is either fully visible or not rendered.
 *
 * The overlay is positioned absolutely to fill its parent container and
 * allows pointer events to pass through to underlying elements.
 *
 * @param {BlurOverlayDesktopProps} props - Component props
 * @param {boolean} props.visible - Whether the blur overlay should be visible
 * @returns {JSX.Element | null} A static blur overlay element, or null if not visible
 */
export default function BlurOverlayDesktop({ visible }: BlurOverlayDesktopProps) {
  if (!visible)
    return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        pointerEvents: 'none',
      }}
    />
  )
}
