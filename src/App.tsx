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
 * - Desktop (≥1024px): Uses MotionCarouselDesktop with optimized layout
 * - Mobile (<1024px): Uses MotionCarousel with touch-optimized interactions
 *
 * @dependencies
 * - React: Core UI library with hooks (useMemo, useState)
 * - usehooks-ts: Browser API hooks (useMediaQuery, useScreen, useWindowSize)
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
import { useMemo, useState } from 'react'

// Libraries
import {
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
import { useEdgeNavigationPrevention } from './hooks/useEdgeNavigationPrevention'
import { useHideAddressBar } from './hooks/useHideAddressBar'
import { useMobileSwipeHint } from './hooks/useMobileSwipeHint'
import { usePopupState } from './hooks/usePopupState'
import { usePortfolioData } from './hooks/usePortfolioData'
import { useSectionObserver } from './hooks/useSectionObserver'

// Utils
import { resetInactiveCarousels } from './utils/carousel'

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
 *
 * @returns {JSX.Element} The rendered portfolio application
 */
function App() {
  // ============================================================================
  // CUSTOM HOOKS USAGE - Data & Popup State
  // ============================================================================

  const {
    projectsData,
    homepageData,
    aboutData,
    settingsData,
    loading,
    error,
    preloadProgress,
    sectionsReady,
  } = usePortfolioData()

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

  const isMobile = useMediaQuery('(max-width: 767px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const screen = useScreen()
  const { width: windowWidth } = useWindowSize()

  // ============================================================================
  // LOCAL STATE
  // ============================================================================

  const [hasShownMobileHint, setHasShownMobileHint] = useState(false)

  // ============================================================================
  // DERIVED STATE (MEMOIZED)
  // ============================================================================

  const projectTitles = useMemo(
    () => projectsData.map(project => project.title),
    [projectsData],
  )

  const handleResetInactiveCarousels = useMemo(
    () => (currentSectionId: string) => {
      resetInactiveCarousels(currentSectionId, projectsData.length)
    },
    [projectsData.length],
  )

  // ============================================================================
  // CUSTOM HOOKS USAGE - Section Observer
  // ============================================================================

  const { currentSectionIndex, mainContainerRef } = useSectionObserver({
    projectsData,
    resetInactiveCarousels: handleResetInactiveCarousels,
  })

  // ============================================================================
  // MOBILE-SPECIFIC HOOKS
  // ============================================================================

  useHideAddressBar()
  useEdgeNavigationPrevention()
  useMobileSwipeHint({
    hasShownMobileHint,
    setHasShownMobileHint,
    projectsCount: projectsData.length,
  })

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================

  if (loading || !sectionsReady) {
    const progressPercent = preloadProgress
      ? Math.round((preloadProgress.loadedImages / preloadProgress.totalImages) * 100)
      : 0

    return (
      <div className="flex h-dvh w-full items-center justify-center bg-neutral-950">
        <div className="text-center">
          <div className="mb-4 text-xl text-white">Loading Portfolio...</div>
          {preloadProgress && (
            <div className="mx-auto w-48">
              <div className="h-1 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-neutral-400">
                {preloadProgress.loadedImages}
                {' '}
                /
                {preloadProgress.totalImages}
                {' '}
                images
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

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

  return (
    <>
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

      <HamburgerMenu
        projectTitles={projectTitles}
        isPopupVisible={showPopup || showAboutPopup}
        settingsData={settingsData}
        isMobile={isMobile}
      />

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

              <ProjectIndex
                projectTitles={projectTitles}
                settingsData={settingsData}
              />
            </main>
          )}

      <ProjectPopup
        isVisible={showPopup}
        onClose={handleClosePopup}
        projectTitle={popupProjectTitle}
        projectDescription={popupProjectDescription}
        projectResponsibility={popupProjectResponsibility}
      />

      <AboutPopup
        isVisible={showAboutPopup}
        onClose={handleCloseAboutPopup}
        aboutData={aboutData}
      />
    </>
  )
}

export default App
