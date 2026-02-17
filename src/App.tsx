import type { About, Homepage, PortfolioProject, Settings } from './config/pocketbase'
import { useCallback, useEffect, useState } from 'react'
import { useScreen, useWindowSize } from 'usehooks-ts'
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
import pb, { getCachedData, getImageUrl, setCachedData } from './config/pocketbase'

// Type for converted project data used in the app
interface ConvertedProject {
  title: string
  description: string
  images: { src: string }[]
  responsibility?: string[]
}

// Convert PocketBase project to expected format
function convertPocketBaseProject(project: PortfolioProject) {
  return {
    title: project.Title,
    description: project.Description,
    images: project.Images.map(filename => ({
      src: getImageUrl(project, filename),
    })),
    responsibility: project.Responsibility_json || project.Responsibility,
  }
}

function App() {
  // State for PocketBase data
  const [projectsData, setProjectsData] = useState<ConvertedProject[]>([])
  const [homepageData, setHomepageData] = useState<Homepage | null>(null)
  const [aboutData, setAboutData] = useState<About | null>(null)
  const [settingsData, setSettingsData] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for tracking current section and slide
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)

  // State for popup
  const [showPopup, setShowPopup] = useState(false)
  const [popupProjectTitle, setPopupProjectTitle] = useState('')
  const [popupProjectDescription, setPopupProjectDescription] = useState('')

  // State for about popup
  const [showAboutPopup, setShowAboutPopup] = useState(false)
  const [canOpenAboutPopup, setCanOpenAboutPopup] = useState(true)

  // Mobile swipe hint state
  const [hasShownMobileHint, setHasShownMobileHint] = useState(false)

  // Removed showHints state - will use carousel's currentSlide instead

  // State for responsive behavior
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const screen = useScreen()
  const { width: windowWidth } = useWindowSize()

  // Update responsive states on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsDesktop(window.innerWidth >= 1024)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch data from PocketBase
  useEffect(() => {
    let isCancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)

        // Try to get cached data first
        const cachedProjects = getCachedData<PortfolioProject[]>('Portfolio_Projects')
        const cachedHomepage = getCachedData<Homepage[]>('Homepage')
        const cachedAbout = getCachedData<About[]>('About')
        const cachedSettings = getCachedData<Settings[]>('Settings')

        // Use cached data if all collections are cached
        if (cachedProjects && cachedHomepage && cachedAbout && cachedSettings) {
          if (!isCancelled) {
            const convertedProjects = cachedProjects.map(convertPocketBaseProject)
            setProjectsData(convertedProjects)
            setHomepageData(cachedHomepage[0] || null)
            setAboutData(cachedAbout[0] || null)
            setSettingsData(cachedSettings[0] || null)
            setError(null)
            setLoading(false)
          }
          return
        }

        // Fetch all data in parallel
        const [projectsResponse, homepageResponse, aboutResponse, settingsResponse] = await Promise.all([
          pb.collection('Portfolio_Projects').getFullList<PortfolioProject>({
            sort: 'Order',
          }),
          pb.collection('Homepage').getFullList<Homepage>({
            filter: 'Is_Active = true',
            sort: '-created',
          }),
          pb.collection('About').getFullList<About>({
            filter: 'Is_Active = true',
            sort: '-created',
          }),
          pb.collection('Settings').getFullList<Settings>({
            sort: '-created',
          }),
        ])

        // Cache the fresh data
        setCachedData('Portfolio_Projects', projectsResponse)
        setCachedData('Homepage', homepageResponse)
        setCachedData('About', aboutResponse)
        setCachedData('Settings', settingsResponse)

        // Only update state if the effect wasn't cancelled
        if (!isCancelled) {
          // Convert PocketBase data to expected format
          const convertedProjects = projectsResponse.map(convertPocketBaseProject)
          setProjectsData(convertedProjects)

          // Set homepage data (use first active record)
          setHomepageData(homepageResponse[0] || null)

          // Set about data (use first active record)
          setAboutData(aboutResponse[0] || null)

          // Set settings data (use first record)
          setSettingsData(settingsResponse[0] || null)

          setError(null)
        }
      }
      catch (err) {
        if (!isCancelled) {
          console.error('Error fetching data:', err)
          setError('Failed to load data')
        }
      }
      finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isCancelled = true
    }
  }, [])

  // Set up realtime subscriptions for automatic cache updates
  useEffect(() => {
    let isCancelled = false

    // Subscribe to Portfolio_Projects changes
    pb.collection('Portfolio_Projects').subscribe('*', async () => {
      const freshProjects = await pb.collection('Portfolio_Projects').getFullList<PortfolioProject>({
        sort: 'Order',
      })

      if (!isCancelled) {
        setCachedData('Portfolio_Projects', freshProjects)
        setProjectsData(freshProjects.map(convertPocketBaseProject))
      }
    })

    // Subscribe to Homepage changes
    pb.collection('Homepage').subscribe('*', async () => {
      const freshHomepage = await pb.collection('Homepage').getFullList<Homepage>({
        filter: 'Is_Active = true',
        sort: '-created',
      })

      if (!isCancelled) {
        setCachedData('Homepage', freshHomepage)
        setHomepageData(freshHomepage[0] || null)
      }
    })

    // Subscribe to About changes
    pb.collection('About').subscribe('*', async () => {
      const freshAbout = await pb.collection('About').getFullList<About>({
        filter: 'Is_Active = true',
        sort: '-created',
      })

      if (!isCancelled) {
        setCachedData('About', freshAbout)
        setAboutData(freshAbout[0] || null)
      }
    })

    // Subscribe to Settings changes
    pb.collection('Settings').subscribe('*', async () => {
      const freshSettings = await pb.collection('Settings').getFullList<Settings>({
        sort: '-created',
      })

      if (!isCancelled) {
        setCachedData('Settings', freshSettings)
        setSettingsData(freshSettings[0] || null)
      }
    })

    // Cleanup subscriptions on unmount
    return () => {
      isCancelled = true
      pb.collection('Portfolio_Projects').unsubscribe()
      pb.collection('Homepage').unsubscribe()
      pb.collection('About').unsubscribe()
      pb.collection('Settings').unsubscribe()
    }
  }, [])

  // Update favicon dynamically when settingsData changes with long-lasting cache
  useEffect(() => {
    if (settingsData && settingsData.favicon) {
      const faviconUrl = getImageUrl(settingsData, settingsData.favicon)
      const cacheKey = 'favicon_cache'
      const versionKey = 'favicon_version'

      // Check if we have a cached version
      const cachedVersion = localStorage.getItem(versionKey)
      const cachedFavicon = localStorage.getItem(cacheKey)

      const updateFavicon = (dataUrl: string) => {
        // Remove existing favicon links
        const existingLinks = document.querySelectorAll('link[rel="icon"]')
        existingLinks.forEach(link => link.remove())

        // Create new favicon link
        const faviconLink = document.createElement('link')
        faviconLink.rel = 'icon'
        faviconLink.type = 'image/png'
        faviconLink.href = dataUrl
        document.head.appendChild(faviconLink)
      }

      // If cached version matches current version, use cached favicon
      if (cachedVersion === settingsData.updated && cachedFavicon) {
        updateFavicon(cachedFavicon)
      }
      else {
        // Fetch and cache new favicon
        fetch(faviconUrl)
          .then(response => response.blob())
          .then((blob) => {
            // Convert to data URL for caching
            const reader = new FileReader()
            reader.onloadend = () => {
              const dataUrl = reader.result as string

              // Store in localStorage with unlimited duration
              try {
                localStorage.setItem(cacheKey, dataUrl)
                localStorage.setItem(versionKey, settingsData.updated)
              }
              catch (error) {
                console.warn('Failed to cache favicon:', error)
              }

              updateFavicon(dataUrl)
            }
            reader.readAsDataURL(blob)
          })
          .catch((error) => {
            console.warn('Failed to load favicon:', error)
            // Fallback to direct URL without caching
            updateFavicon(`${faviconUrl}?v=${settingsData.updated}`)
          })
      }
    }
  }, [settingsData])

  // Reset inactive project carousels to first slide using CSS scroll behavior
  const resetInactiveCarousels = useCallback((currentSectionId: string) => {
    // Add a small delay to allow the section transition to complete
    setTimeout(() => {
      // Get all project sections
      projectsData.forEach((_, index) => {
        const sectionId = `project-${index}`

        // Skip the currently active section
        if (sectionId === currentSectionId)
          return

        // Find the carousel in this section (try both mobile and desktop)
        const section = document.getElementById(sectionId)
        if (!section)
          return

        const carousel = section.querySelector('.motion-carousel, .motion-carousel-desktop') as HTMLElement
        if (!carousel)
          return

        // Reset carousel scroll position directly (horizontal only)
        // This only affects the horizontal scroll of the carousel, not the main page
        carousel.scrollLeft = 0
      })
    }, 300)
  }, [projectsData])

  // Track which section is currently visible using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only update if the section is intersecting and more than 50% visible
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const sectionId = entry.target.id

            // Determine the section index based on the ID
            let index
            if (sectionId === 'hero-section') {
              index = 0
            }
            else if (sectionId.startsWith('project-')) {
              // Extract project index and add 1 to account for hero section
              index = Number.parseInt(sectionId.replace('project-', '')) + 1
            }
            else if (sectionId === 'project-index') {
              index = projectsData.length + 1
            }

            if (index !== undefined) {
              setCurrentSectionIndex(index)

              // Reset all other project carousels to first slide using CSS scroll behavior
              if (sectionId.startsWith('project-') || sectionId === 'hero-section' || sectionId === 'project-index') {
                resetInactiveCarousels(sectionId)
              }
            }
          }
        })
      },
      {
        threshold: 0.5, // Trigger when 50% of the section is visible
        root: document.querySelector('main'), // Observe within the main scrollable container
      },
    )

    // Observe all sections
    const heroSection = document.getElementById('hero-section')
    if (heroSection)
      observer.observe(heroSection)

    projectsData.forEach((_, index) => {
      const section = document.getElementById(`project-${index}`)
      if (section)
        observer.observe(section)
    })

    const indexSection = document.getElementById('project-index')
    if (indexSection)
      observer.observe(indexSection)

    return () => observer.disconnect()
  }, [projectsData, resetInactiveCarousels])

  // Generate project titles from loaded data
  const projectTitles = projectsData.map(project => project.title)

  // State for popup responsibility
  const [popupProjectResponsibility, setPopupProjectResponsibility] = useState<string[]>([])

  const handleShowPopup = (projectTitle: string) => {
    const project = projectsData.find(p => p.title === projectTitle)
    setPopupProjectTitle(projectTitle)
    setPopupProjectDescription(project?.description || '')
    setPopupProjectResponsibility(project?.responsibility || [])
    // Close AboutPopup if open
    setShowAboutPopup(false)
    setShowPopup(true)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
    // Temporarily disable AboutPopup opening
    setCanOpenAboutPopup(false)
    setTimeout(() => {
      setCanOpenAboutPopup(true)
    }, 100)
  }

  const handleShowAboutPopup = () => {
    // Don't open if ProjectPopup is currently open or if temporarily disabled
    if (showPopup || !canOpenAboutPopup)
      return

    // Close ProjectPopup if open
    setShowPopup(false)
    setShowAboutPopup(true)
  }

  const handleCloseAboutPopup = () => {
    setShowAboutPopup(false)
  }

  // Prevent browser navigation gestures more selectively
  useEffect(() => {
    // Only prevent browser navigation when at the edge of the page
    const preventEdgeNavigation = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch && touch.clientX < 50) { // Only prevent when very close to left edge
        const carousel = (e.target as Element)?.closest('[data-carousel]')
        if (!carousel) { // Only prevent if not inside a carousel
          e.preventDefault()
        }
      }
    }

    document.addEventListener('touchstart', preventEdgeNavigation, { passive: false })

    return () => {
      document.removeEventListener('touchstart', preventEdgeNavigation)
    }
  }, [])

  // Hide address bar for immersive experience
  useEffect(() => {
    const timeoutIds: number[] = []

    // Function to hide address bar
    const hideAddressBar = () => {
      // Small delay to ensure page is loaded
      const outerTimeout = window.setTimeout(() => { // eslint-disable-line react-web-api/no-leaked-timeout
        window.scrollTo(0, 1)
        const innerTimeout = window.setTimeout(() => { // eslint-disable-line react-web-api/no-leaked-timeout
          window.scrollTo(0, 0)
        }, 0)
        timeoutIds.push(innerTimeout)
      }, 100)
      timeoutIds.push(outerTimeout)
    }

    // Hide on initial load
    hideAddressBar()

    // Hide when orientation changes
    const handleOrientationChange = () => {
      const timeout = window.setTimeout(hideAddressBar, 100) // eslint-disable-line react-web-api/no-leaked-timeout
      timeoutIds.push(timeout)
    }

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    return () => {
      timeoutIds.forEach(id => window.clearTimeout(id))
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [])

  // Mobile swipe hint for first project section
  useEffect(() => {
    // Only on mobile/tablet (below 1024px), only once, only if we have projects
    if (window.innerWidth >= 1024 || hasShownMobileHint || projectsData.length === 0) {
      return
    }

    // Track timeout IDs for cleanup
    const timeoutIds: number[] = []

    // Use a ref to track if animation has been triggered to avoid stale closure issues
    let animationTriggered = false

    // Create intersection observer to detect when first project section comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only trigger if first project section is in view and we haven't shown hint yet
          if (entry.isIntersecting && !animationTriggered) {
            // Set flag immediately to prevent multiple triggers
            animationTriggered = true
            setHasShownMobileHint(true)

            // Disconnect observer immediately after first trigger
            observer.disconnect()

            // Wait 1 second after section becomes visible, then show hint
            const timeout1 = window.setTimeout(() => { // eslint-disable-line react-web-api/no-leaked-timeout
              // Find the carousel in the first project section (mobile/tablet only)
              const firstProjectSection = document.getElementById('project-0')
              const carousel = firstProjectSection?.querySelector('.motion-carousel') as HTMLDivElement

              if (!carousel)
                return

              // Get carousel slides
              const slides = carousel.querySelectorAll('.motion-carousel__slide')

              if (slides.length < 2)
                return

              const firstSlide = slides[0]
              const secondSlide = slides[1]

              // Animate to second slide (peek position)
              secondSlide.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
              })

              // Wait at peek position, then bounce back to first slide
              const timeout2 = window.setTimeout(() => { // eslint-disable-line react-web-api/no-leaked-timeout
                const timeout3 = window.setTimeout(() => { // eslint-disable-line react-web-api/no-leaked-timeout
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
        threshold: 0.5, // Trigger when 50% of the section is visible
        rootMargin: '0px',
      },
    )

    // Observe the first project section
    const firstProjectSection = document.getElementById('project-0')
    if (firstProjectSection) {
      observer.observe(firstProjectSection)
    }

    return () => {
      timeoutIds.forEach(id => window.clearTimeout(id))
      observer.disconnect()
    }
  }, [hasShownMobileHint, projectsData.length])

  // Loading state
  if (loading) {
    return (
      <div className="h-dvh w-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading Portfolio...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-dvh w-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <div className="text-xl mb-4">
            Error:
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-black rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Fixed Logo Containers - Outside main container for proper viewport positioning */}
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

      {/* Hamburger Menu */}
      <HamburgerMenu
        projectTitles={projectTitles}
        isPopupVisible={showPopup || showAboutPopup}
        settingsData={settingsData}
        isMobile={isMobile}
      />

      {/* Desktop Main Container */}
      {isDesktop
        ? (
            <main
              className="overflow-y-scroll snap-y snap-mandatory"
              style={{
                height: '100lvh',
                scrollBehavior: 'smooth',
                scrollSnapType: 'y mandatory',
              }}
            >
              {/* Desktop Hero Section */}
              <Hero
                heroImage={homepageData ? getImageUrl(homepageData, homepageData.Hero_Image) : ''}
                heroTitle={homepageData?.Hero_Title || 'Creative Strategy and Communication'}
                isAboutPopupVisible={showAboutPopup}
                settingsData={settingsData}
              />

              {/* Desktop Project Sections */}
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

              {/* Desktop Project Index */}
              <ProjectIndex projectTitles={projectTitles} settingsData={settingsData} />
            </main>
          )
        : (
            <main
              className="overflow-y-scroll snap-y snap-mandatory"
              style={{
                height: '100lvh',
                scrollBehavior: 'smooth',
                scrollSnapType: 'y mandatory',
              }}
            >
              {/* Mobile Hero Section */}
              <HeroMobile
                heroImage={homepageData ? getImageUrl(homepageData, homepageData.Hero_Image_Mobile || homepageData.Hero_Image) : ''}
                heroTitle={homepageData?.Hero_Title || 'Creative Strategy and Communication'}
                isAboutPopupVisible={showAboutPopup}
                settingsData={settingsData}
                isMobile={isMobile}
              />

              {/* Mobile Project Sections */}
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

              {/* Mobile Project Index */}
              <ProjectIndex projectTitles={projectTitles} settingsData={settingsData} />
            </main>
          )}

      {/* Global Popup - Positioned relative to viewport */}
      <ProjectPopup
        isVisible={showPopup}
        onClose={handleClosePopup}
        projectTitle={popupProjectTitle}
        projectDescription={popupProjectDescription}
        projectResponsibility={popupProjectResponsibility}
      />

      {/* About Popup - Positioned relative to viewport */}
      <AboutPopup
        isVisible={showAboutPopup}
        onClose={handleCloseAboutPopup}
        aboutData={aboutData}
      />

    </>
  )
}

export default App
