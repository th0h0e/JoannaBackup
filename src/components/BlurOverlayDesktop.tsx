/**
 * @file BlurOverlayDesktop.tsx
 * @description Static blur overlay component for desktop carousel transitions.
 *
 * This component renders a semi-transparent blur overlay that is always visible,
 * designed specifically for the desktop carousel's "NEXT PROJECT" slide.
 * Unlike the animated BlurOverlay component, this version is always rendered
 * to avoid any backdrop-filter rendering delay when scrolling to the slide.
 *
 * @architecture
 * The component uses a simple static render pattern:
 *
 * 1. **Always Rendered** - No conditional logic, blur is always active
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
// COMPONENT DEFINITION
// ============================================================================

/**
 * Static blur overlay component for desktop carousel visual transitions.
 *
 * Renders a full-coverage overlay with a backdrop blur effect that is always
 * visible. No conditional rendering - the blur is always applied to avoid
 * any rendering delay when the user scrolls to this slide.
 *
 * The overlay is positioned absolutely to fill its parent container and
 * allows pointer events to pass through to underlying elements.
 *
 * @returns {JSX.Element} A static blur overlay element
 */
export default function BlurOverlayDesktop() {
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
