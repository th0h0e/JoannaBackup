/**
 * @file App.tsx
 * @description Main entry point for Joanna's Portfolio Website.
 *
 * This component serves as the root of the application, orchestrating all
 * child components and managing the core application state. It implements
 * a vertical scroll-snap layout where each section occupies the full viewport
 * height, with horizontal image carousels contained within each project section.
 *
 * @architecture
 * The application follows a layered architecture:
 *
 * 1. **Data Layer** - usePortfolioData hook fetches content from PocketBase CMS
 * 2. **State Layer** - usePopupState manages popup visibility and content
 * 3. **UI Layer** - useSectionObserver tracks scroll position for UI updates
 *
 * Section Structure (vertical scroll-snap):
 * - Hero Section (id: "hero-section") - Full-screen intro with animated image
 * - Project Sections (id: "project-{index}") - Each contains a horizontal carousel
 * - Project Index (id: "project-index") - Navigation list of all projects
 *
 * Responsive Behavior:
 * - Desktop (≥1024px): Uses MotionCarouselDesktopEmbla with optimized layout
 * - Mobile (<1024px): Uses MotionCarouselEmbla with touch-optimized interactions
 *
 * @dependencies
 * - React: Core UI library with hooks (useCallback, useEffect, useState)
 * - usehooks-ts: Browser API hooks (useEventListener, useMediaQuery, useScreen, useWindowSize)
 * - PocketBase: Headless CMS for content management (via usePortfolioData)
 *
 * @see {@link https://github.com/owner/repo} Project documentation
 * @author Joanna van der Wilt
 * @version 2.0.0
 */

// ============================================================================
// IMPORTS
// ============================================================================

// React
import { useCallback, useEffect, useState } from 'react'

// Libraries
import {
  useEventListener,
  useMediaQuery,
  useScreen,
  useWindowSize,
} from 'usehooks-ts'

// Components
import AboutPopup from './components/AboutPopup'
import HamburgerMenu from './components/HamburgerMenu'
import Hero from './components/Hero'
import HeroMobile from './components/HeroMobile'
import LogoBottom from './components/LogoBottom'
import LogoTop from './components/LogoTop'
import MotionCarousel from './components/MotionCarousel'
import MotionCarouselDesktop from './components/MotionCarouselDesktop'
import ProjectIndex from './components/ProjectIndex'
import ProjectPopup from './components/ProjectPopup'

// Config
import { getImageUrl } from './config/pocketbase'

// Hooks
import { usePopupState } from './hooks/usePopupState'
import { usePortfolioData } from './hooks/usePortfolioData'
import { useSectionObserver } from './hooks/useSectionObserver'

// ============================================================================
// COMPONENT DEFINITION
// ============================================================================

/**
 * Main application component for the portfolio website.
 *
 * This component is responsible for:
 * - Fetching and managing all portfolio data from PocketBase
 * - Rendering the responsive layout (desktop vs mobile)
 * - Managing popup states (project details and about info)
 * - Tracking scroll position for logo animations
 * - Implementing touch gesture protections for mobile
 *
 * @returns {JSX.Element} The rendered portfolio application
 *
 * @example
 * // In main.tsx
 * ReactDOM.createRoot(rootElement).render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * )
 */
function App() {
  // ============================================================================
  // CUSTOM HOOKS USAGE - Data & Popup State
  // ============================================================================

  /**
   * Fetches all portfolio content from PocketBase CMS.
   *
   * This hook manages the complete data lifecycle:
   * 1. Checks localStorage for cached data (instant render)
   * 2. Fetches fresh data from PocketBase API
   * 3. Subscribes to real-time updates for live content changes
   *
   * @returns {object} Portfolio data and loading state
   * @property {ConvertedProject[]} projectsData - Array of project objects with images
   * @property {Homepage|null} homepageData - Hero section configuration
   * @property {About|null} aboutData - About popup content
   * @property {Settings|null} settingsData - Global site settings (favicon, colors)
   * @property {boolean} loading - Initial data fetch status
   * @property {string|null} error - Error message if fetch failed
   */
  const {
    projectsData,
    homepageData,
    aboutData,
    settingsData,
    loading,
    error,
  } = usePortfolioData()

  /**
   * Manages popup visibility and content state.
   *
   * This hook depends on projectsData being loaded first, as it needs
   * to look up project details when a popup is triggered. The popup
   * state is lifted to this level to allow global keyboard handling
   * and prevent z-index conflicts between sections.
   *
   * @param {ProjectData[]} projectsData - Project array for lookup by title
   * @returns {object} Popup state and handlers
   * @property {boolean} showPopup - Whether project popup is visible
   * @property {string} popupProjectTitle - Current popup project title
   * @property {string} popupProjectDescription - Current popup description
   * @property {string[]} popupProjectResponsibility - Project responsibilities
   * @property {boolean} showAboutPopup - Whether about popup is visible
   * @property {Function} handleShowPopup - Opens popup for given project title
   * @property {Function} handleClosePopup - Closes project popup
   * @property {Function} handleShowAboutPopup - Opens about popup
   * @property {Function} handleCloseAboutPopup - Closes about popup
   */
  const {
    showPopup,
    popupProjectTitle,
    popupProjectDescription,
    popupProjectResponsibility,
    showAboutPopup,
    handleShowPopup,
    handleClosePopup,
    handleShowAboutPopup,
    handleCloseAboutPopup,
  } = usePopupState(projectsData)

  // ============================================================================
  // RESPONSIVE STATE
  // ============================================================================

  /**
   * Responsive breakpoint detection using CSS media queries.
   *
   * These values determine which components and layouts to render:
   * - isMobile (≤767px): Touch-optimized carousels, mobile hero
   * - isDesktop (≥1024px): Desktop carousels with hover interactions
   *
   * The gap between 768-1023px uses desktop layout on tablets.
   */
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  /**
   * Screen dimensions for responsive calculations.
   * - screen: Full screen dimensions (null on SSR)
   * - windowWidth: Window width for carousel calculations
   */
  const screen = useScreen()
  const { width: windowWidth } = useWindowSize()

  // ============================================================================
  // LOCAL STATE
  // ============================================================================

  /**
   * Tracks whether the mobile swipe hint animation has been shown.
   * This prevents the hint from replaying on subsequent visits to
   * the first project section during the same session.
   */
  const [hasShownMobileHint, setHasShownMobileHint] = useState(false)

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  /**
   * Extracted project titles for the hamburger menu navigation.
   * Derived from projectsData to ensure it stays in sync.
   */
  const projectTitles = projectsData.map(project => project.title)

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Resets carousel scroll positions for all non-visible sections.
   *
   * When navigating between sections using the hamburger menu or
   * scroll-snap, this ensures that returning to a section starts
   * at the first slide rather than the last viewed position.
   *
   * @param {string} currentSectionId - The ID of the currently visible section
   *
   * @example
   * // Called when section changes via IntersectionObserver
   * resetInactiveCarousels('project-2')
   * // Resets carousels for project-0, project-1, project-3, etc.
   */
  const resetInactiveCarousels = useCallback(
    (currentSectionId: string) => {
      setTimeout(() => {
        projectsData.forEach((_, index) => {
          const sectionId = `project-${index}`

          if (sectionId === currentSectionId)
            return

          const section = document.getElementById(sectionId)
          if (!section)
            return

          const carousel = section.querySelector('.motion-carousel, .motion-carousel-desktop') as HTMLElement
          if (!carousel)
            return

          carousel.scrollLeft = 0
        })
      }, 300)
    },
    [projectsData],
  )

  /**
   * Prevents iOS Safari navigation gestures at screen edges.
   *
   * iOS Safari triggers back/forward navigation when swiping from
   * the left edge of the screen. This handler prevents that behavior
   * when the touch occurs within 50px of the edge but outside a carousel
   * (which should handle horizontal swipes independently).
   *
   * @param {TouchEvent} e - The touchstart event
   */
  const preventEdgeNavigation = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    if (touch && touch.clientX < 50) {
      const carousel = (e.target as Element)?.closest('[data-carousel]')
      if (!carousel) {
        e.preventDefault()
      }
    }
  }, [])

  // ============================================================================
  // CUSTOM HOOKS USAGE - Section Observer (depends on resetInactiveCarousels)
  // ============================================================================

  /**
   * Tracks the currently visible section using IntersectionObserver.
   *
   * This hook must be called after resetInactiveCarousels is defined
   * because it uses that callback when sections change. The observer
   * uses a 50% threshold to detect when a section is majority-visible.
   *
   * @param {object} options - Observer configuration
   * @property {object[]} projectsData - Used to calculate total sections
   * @property {Function} resetInactiveCarousels - Called on section change
   * @returns {object} Observer state
   * @property {number} currentSectionIndex - Index of visible section (0 = hero)
   * @property {React.RefObject} mainContainerRef - Ref for scroll container
   */
  const { currentSectionIndex, mainContainerRef } = useSectionObserver({
    projectsData,
    resetInactiveCarousels,
  })

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Prevents browser navigation gestures at edge of page.
   * Uses useEventListener for automatic cleanup on unmount.
   */
  useEventListener('touchstart', preventEdgeNavigation, undefined, {
    passive: false,
  })

  /**
   * Hides the mobile browser address bar for an immersive experience.
   *
   * On mobile devices, the browser address bar takes up valuable
   * viewport space. This effect programmatically scrolls the page
   * slightly to trigger the browser's "hide address bar" behavior.
   *
   * Also re-runs on orientation change to handle device rotation.
   */
  useEffect(() => {
    const timeoutIds: number[] = []

    const hideAddressBar = () => {
      const outerTimeout = window.setTimeout(() => {
        window.scrollTo(0, 1)
        const innerTimeout = window.setTimeout(() => {
          window.scrollTo(0, 0)
        }, 0)
        timeoutIds.push(innerTimeout)
      }, 100)
      timeoutIds.push(outerTimeout)
    }

    hideAddressBar()

    const onOrientationChange = () => {
      const timeout = window.setTimeout(hideAddressBar, 100) // eslint-disable-line react-web-api/no-leaked-timeout
      timeoutIds.push(timeout)
    }

    window.addEventListener('orientationchange', onOrientationChange)
    window.addEventListener('resize', onOrientationChange)

    return () => {
      timeoutIds.forEach(id => window.clearTimeout(id))
      window.removeEventListener('orientationchange', onOrientationChange)
      window.removeEventListener('resize', onOrientationChange)
    }
  }, [])

  /**
   * Shows a swipe hint animation for first-time mobile visitors.
   *
   * When a mobile user scrolls to the first project section for the
   * first time, this animates the carousel to show the second slide
   * briefly, then returns to the first slide. This teaches users
   * that horizontal swiping is available.
   *
   * Conditions:
   * - Window width < 1024px (mobile/tablet portrait)
   * - Hasn't shown hint before (hasShownMobileHint = false)
   * - Projects data is loaded (projectsData.length > 0)
   *
   * Uses IntersectionObserver with 50% threshold to detect when
   * the first project section becomes visible.
   */
  useEffect(() => {
    if (
      window.innerWidth >= 1024
      || hasShownMobileHint
      || projectsData.length === 0
    ) {
      return
    }

    const timeoutIds: number[] = []
    let animationTriggered = false

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animationTriggered) {
            animationTriggered = true
            setHasShownMobileHint(true)
            observer.disconnect()

            const timeout1 = window.setTimeout(() => {
              const firstProjectSection = document.getElementById('project-0')
              const carousel = firstProjectSection?.querySelector('.motion-carousel') as HTMLDivElement

              if (!carousel)
                return

              const slides = carousel.querySelectorAll('.motion-carousel__slide')

              if (slides.length < 2)
                return

              const firstSlide = slides[0]
              const secondSlide = slides[1]

              secondSlide.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
              })

              const timeout2 = window.setTimeout(() => {
                const timeout3 = window.setTimeout(() => {
                  firstSlide.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                  })
                }, 300)
                timeoutIds.push(timeout3)
              }, 200)
              timeoutIds.push(timeout2)
            }, 1000)
            timeoutIds.push(timeout1)
          }
        })
      },
      {
        threshold: 0.5,
        rootMargin: '0px',
      },
    )

    const firstProjectSection = document.getElementById('project-0')
    if (firstProjectSection) {
      observer.observe(firstProjectSection)
    }

    return () => {
      timeoutIds.forEach(id => window.clearTimeout(id))
      observer.disconnect()
    }
  }, [hasShownMobileHint, projectsData.length])

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================

  /**
   * Loading State
   * Displays a centered loading message while data is being fetched.
   * Uses cached data when available for instant renders.
   */
  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-xl">Loading Portfolio...</div>
        </div>
      </div>
    )
  }

  /**
   * Error State
   * Displays an error message with retry button if data fetch fails.
   */
  if (error) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <div className="text-center text-red-500">
          <div className="mb-4 text-xl">
            Error:
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-gray-200 px-4 py-2 text-black"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  /**
   * Main Application Render
   *
   * Structure:
   * 1. Fixed Logo Components - Positioned outside main for viewport centering
   * 2. Hamburger Menu - Fixed position navigation overlay
   * 3. Main Container - Scroll-snap container with all sections
   * 4. Popup Components - Modal overlays for project/about details
   */
  return (
    <>
      {/*
       * Fixed Logo Containers
       * Positioned outside the main scroll container to maintain
       * consistent viewport positioning regardless of scroll position.
       * Uses mix-blend-mode: exclusion for visibility on all backgrounds.
       *
       * Props:
       * - onClick: Opens About popup when logo is clicked
       * - isHero: Triggers entrance/exit animations based on section
       * - showAboutPopup/showPopup: Hides logos when popups are open
       * - isMobile: Adjusts container sizing for mobile
       */}
      <LogoTop
        onClick={handleShowAboutPopup}
        isHero={currentSectionIndex === 0}
        showAboutPopup={showAboutPopup}
        showPopup={showPopup}
        isMobile={isMobile}
      />
      <LogoBottom
        onClick={handleShowAboutPopup}
        isHero={currentSectionIndex === 0}
        showAboutPopup={showAboutPopup}
        showPopup={showPopup}
        isMobile={isMobile}
      />

      {/*
       * Hamburger Menu
       * Provides navigation to all project sections via anchor links.
       * Hidden when popups are visible to prevent z-index conflicts.
       */}
      <HamburgerMenu
        projectTitles={projectTitles}
        isPopupVisible={showPopup || showAboutPopup}
        settingsData={settingsData}
        isMobile={isMobile}
      />

      {/*
       * Desktop Main Container (≥1024px)
       * Uses CSS scroll-snap for section-by-section vertical navigation.
       * Each section takes 100lvh (logical viewport height) to ensure
       * full coverage on mobile browsers with dynamic address bars.
       */}
      {isDesktop
        ? (
            <main
              ref={mainContainerRef as React.RefObject<HTMLElement>}
              className="snap-y snap-mandatory overflow-y-scroll"
              style={{
                height: '100lvh',
                scrollBehavior: 'smooth',
                scrollSnapType: 'y mandatory',
              }}
            >
              {/*
             * Desktop Hero Section
             * Full-screen intro with animated hero image and title.
             * ID: "hero-section" - used by IntersectionObserver.
             */}
              <Hero
                heroImage={
                  homepageData
                    ? getImageUrl(homepageData, homepageData.Hero_Image)
                    : ''
                }
                heroTitle={
                  homepageData?.Hero_Title || 'Creative Strategy and Communication'
                }
                isAboutPopupVisible={showAboutPopup}
                settingsData={settingsData}
              />

              {/*
             * Desktop Project Sections
             * Each project gets its own full-height section with
             * a horizontal scroll-snap carousel for image navigation.
             * IDs follow pattern: "project-0", "project-1", etc.
             */}
              {projectsData.map((project, index) => (
                <section
                  key={project.title}
                  id={`project-${index}`}
                  className="relative w-full snap-center"
                  style={{ height: '100lvh' }}
                >
                  <MotionCarouselDesktop
                    images={project.images}
                    projectTitle={project.title}
                    settingsData={settingsData}
                    totalSlides={project.images.length + 1}
                    onShowPopup={handleShowPopup}
                    isPopupVisible={showPopup}
                    isAboutPopupVisible={showAboutPopup}
                    screenWidth={windowWidth}
                  />
                </section>
              ))}

              {/*
             * Desktop Project Index
             * Final section with list of all projects for navigation.
             * ID: "project-index" - used by IntersectionObserver.
             */}
              <ProjectIndex
                projectTitles={projectTitles}
                settingsData={settingsData}
              />
            </main>
          )
        : (
            <main
              ref={mainContainerRef as React.RefObject<HTMLElement>}
              className="snap-y snap-mandatory overflow-y-scroll"
              style={{
                height: '100lvh',
                scrollBehavior: 'smooth',
                scrollSnapType: 'y mandatory',
              }}
            >
              {/*
             * Mobile Main Container (<1024px)
             * Same structure as desktop but with mobile-optimized components.
             * Uses 100lvh for consistent sizing with dynamic viewport units.
             *
             * Mobile Hero Section
             * Uses HeroMobile component with touch-optimized interactions
             * and mobile-specific image (Hero_Image_Mobile if available).
             */}
              <HeroMobile
                heroImage={
                  homepageData
                    ? getImageUrl(
                        homepageData,
                        homepageData.Hero_Image_Mobile || homepageData.Hero_Image,
                      )
                    : ''
                }
                heroTitle={
                  homepageData?.Hero_Title || 'Creative Strategy and Communication'
                }
                isAboutPopupVisible={showAboutPopup}
                settingsData={settingsData}
                isMobile={isMobile}
              />

              {/*
             * Mobile Project Sections
             * Uses MotionCarousel with native scroll-snap carousel.
             * totalSlides includes extra slides for blur transition effect.
             */}
              {projectsData.map((project, index) => (
                <section
                  key={project.title}
                  id={`project-${index}`}
                  className="relative w-full snap-center"
                  style={{ height: '100lvh' }}
                >
                  <MotionCarousel
                    images={project.images}
                    projectTitle={project.title}
                    settingsData={settingsData}
                    totalSlides={project.images.length + 2}
                    showTopProgressBar={settingsData?.Show_Top_Progress_Bar ?? true}
                    onShowPopup={handleShowPopup}
                    isPopupVisible={showPopup}
                    isAboutPopupVisible={showAboutPopup}
                    screenWidth={screen?.width}
                  />
                </section>
              ))}

              {/*
             * Mobile Project Index
             * Same as desktop but with touch-friendly tap targets.
             */}
              <ProjectIndex
                projectTitles={projectTitles}
                settingsData={settingsData}
              />
            </main>
          )}

      {/*
       * Global Popup Components
       * Rendered at root level to escape scroll container positioning.
       * Visibility controlled by popup state from usePopupState hook.
       */}

      {/*
       * Project Popup
       * Displays project details (title, description, responsibilities)
       * when a user clicks on a project title in the carousel.
       */}
      <ProjectPopup
        isVisible={showPopup}
        onClose={handleClosePopup}
        projectTitle={popupProjectTitle}
        projectDescription={popupProjectDescription}
        projectResponsibility={popupProjectResponsibility}
      />

      {/*
       * About Popup
       * Displays company information and contact details.
       * Triggered by clicking on the logo components.
       */}
      <AboutPopup
        isVisible={showAboutPopup}
        onClose={handleCloseAboutPopup}
        aboutData={aboutData}
      />
    </>
  )
}

export default App
