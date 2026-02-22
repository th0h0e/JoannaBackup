/**
 * @fileoverview Custom hook for fetching and managing portfolio data from PocketBase.
 *
 * This hook is the primary data layer for the portfolio website, handling:
 * - Initial data fetching from PocketBase collections
 * - Local caching with 7-day expiration
 * - Realtime subscriptions for live content updates
 * - Dynamic favicon management based on settings
 *
 * Data Flow:
 * 1. On mount, check localStorage for cached data
 * 2. If cache exists and is valid (< 7 days old), use cached data
 * 3. Otherwise, fetch fresh data from PocketBase API
 * 4. Store fetched data in localStorage with timestamp
 * 5. Subscribe to realtime updates for all collections
 * 6. Update favicon dynamically based on settings
 *
 * @module hooks/usePortfolioData
 * @see {@link ../config/pocketbase.ts} - PocketBase configuration and utilities
 */

import type {
  About,
  Homepage,
  PortfolioProject,
  Settings,
} from '../config/pocketbase'
import type { PreloadProgress } from '../utils/imagePreloader'
import { useEffect, useRef, useState } from 'react'
import pb, {
  getCachedData,
  getImageUrl,
  setCachedData,
} from '../config/pocketbase'
import { imagePreloader } from '../utils/imagePreloader'

const PRELOAD_BATCH_SIZE = 3

/**
 * Converted project data structure for use in components.
 *
 * This interface represents the transformed project data after conversion
 * from PocketBase's raw format. The conversion handles:
 * - Title casing (Title → title)
 * - Image URL generation from PocketBase file references
 * - Responsibility field normalization (JSON array or string array)
 *
 * @interface ConvertedProject
 */
export interface ConvertedProject {
  /** Project title for display and popup header */
  title: string

  /** Project description text for popup content */
  description: string

  /** Array of image objects with src URLs for carousel display */
  images: { src: string }[]

  /** Optional array of responsibility strings for popup display */
  responsibility?: string[]
}

/**
 * Converts a PocketBase project record to the ConvertedProject format.
 *
 * This function transforms the raw PocketBase data structure into the
 * format expected by the carousel and popup components:
 *
 * Transformations:
 * - Title: Direct mapping from PocketBase Title field
 * - Description: Direct mapping from PocketBase Description field
 * - Images: Converts filename strings to full URLs using getImageUrl
 * - Responsibility: Uses JSON field if available, falls back to string array
 *
 * @param project - The raw PocketBase PortfolioProject record
 * @returns Converted project object for component consumption
 *
 * @example
 * ```tsx
 * const rawProject = {
 *   id: 'abc123',
 *   Title: 'My Project',
 *   Description: 'A description',
 *   Images: ['image1.jpg', 'image2.jpg'],
 *   Responsibility: ['Art Direction', 'Design'],
 * };
 *
 * const converted = convertPocketBaseProject(rawProject);
 * // {
 * //   title: 'My Project',
 * //   description: 'A description',
 * //   images: [{ src: 'https://.../image1.jpg' }, { src: 'https://.../image2.jpg' }],
 * //   responsibility: ['Art Direction', 'Design'],
 * // }
 * ```
 */
function convertPocketBaseProject(project: PortfolioProject): ConvertedProject {
  return {
    title: project.Title,
    description: project.Description,
    images: project.Images.map(filename => ({
      src: getImageUrl(project, filename),
    })),
    responsibility: project.Responsibility_json || project.Responsibility,
  }
}

/**
 * Return type for the usePortfolioData hook.
 *
 * @interface UsePortfolioDataReturn
 */
interface UsePortfolioDataReturn {
  /** Array of converted project objects for carousel and popup display */
  projectsData: ConvertedProject[]

  /** Homepage data record or null if not loaded */
  homepageData: Homepage | null

  /** About page data record or null if not loaded */
  aboutData: About | null

  /** Site settings record or null if not loaded */
  settingsData: Settings | null

  /** Loading state - true during initial fetch */
  loading: boolean

  /** Error message string or null if no error */
  error: string | null

  /** Preload progress for batch image loading */
  preloadProgress: PreloadProgress | null

  /** Whether first 3 sections are ready to display */
  sectionsReady: boolean
}

/**
 * Custom hook for fetching and managing all portfolio data from PocketBase.
 *
 * **Caching Strategy:**
 * - Data is cached in localStorage with a 7-day expiration
 * - Cached data is used immediately if available and valid
 * - Fresh data is fetched on cache miss or expiration
 * - The cache key is the collection name (e.g., 'Portfolio_Projects')
 *
 * **Realtime Subscriptions:**
 * - Subscribes to all four collections on mount
 * - On any change, fetches fresh data and updates state + cache
 * - Automatically unsubscribes on unmount
 * - Subscriptions are: Portfolio_Projects, Homepage, About, Settings
 *
 * **Favicon Management:**
 * - Dynamically updates the page favicon based on settings.favicon
 * - Caches favicon as base64 data URL in localStorage
 * - Uses version key (settings.updated) to detect changes
 * - Falls back to URL with query param if caching fails
 *
 * @returns Object containing all portfolio data and loading/error states
 *
 * @example
 * ```tsx
 * const {
 *   projectsData,
 *   homepageData,
 *   aboutData,
 *   settingsData,
 *   loading,
 *   error,
 * } = usePortfolioData();
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error} />;
 *
 * return (
 *   <>
 *     <Hero headline={homepageData?.Headline} />
 *     {projectsData.map(project => (
 *       <ProjectSection key={project.title} project={project} />
 *     ))}
 *   </>
 * );
 * ```
 */
export function usePortfolioData(): UsePortfolioDataReturn {
  const [projectsData, setProjectsData] = useState<ConvertedProject[]>([])
  const [homepageData, setHomepageData] = useState<Homepage | null>(null)
  const [aboutData, setAboutData] = useState<About | null>(null)
  const [settingsData, setSettingsData] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preloadProgress, setPreloadProgress] = useState<PreloadProgress | null>(null)
  const [sectionsReady, setSectionsReady] = useState(false)

  const hasPreloadedRef = useRef(false)

  /**
   * Initial data fetch effect with caching support.
   *
   * Flow:
   * 1. Check localStorage for cached data (all 4 collections)
   * 2. If all caches exist and are valid, use cached data
   * 3. Otherwise, fetch from PocketBase API in parallel
   * 4. Store fetched data in localStorage cache
   * 5. Update React state with fetched/converted data
   *
   * The isCancelled flag prevents state updates after unmount.
   */
  useEffect(() => {
    let isCancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)

        const cachedProjects
          = getCachedData<PortfolioProject[]>('Portfolio_Projects')
        const cachedHomepage = getCachedData<Homepage[]>('Homepage')
        const cachedAbout = getCachedData<About[]>('About')
        const cachedSettings = getCachedData<Settings[]>('Settings')

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

        const [
          projectsResponse,
          homepageResponse,
          aboutResponse,
          settingsResponse,
        ] = await Promise.all([
          pb.collection('Portfolio_Projects')
            .getFullList<PortfolioProject>({
              sort: 'Order',
            }),
          pb.collection('Homepage')
            .getFullList<Homepage>({
              filter: 'Is_Active = true',
              sort: '-created',
            }),
          pb.collection('About')
            .getFullList<About>({
              filter: 'Is_Active = true',
              sort: '-created',
            }),
          pb.collection('Settings')
            .getFullList<Settings>({
              sort: '-created',
            }),
        ])

        setCachedData('Portfolio_Projects', projectsResponse)
        setCachedData('Homepage', homepageResponse)
        setCachedData('About', aboutResponse)
        setCachedData('Settings', settingsResponse)

        if (!isCancelled) {
          const convertedProjects = projectsResponse.map(convertPocketBaseProject)
          setProjectsData(convertedProjects)
          setHomepageData(homepageResponse[0] || null)
          setAboutData(aboutResponse[0] || null)
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

    return () => {
      isCancelled = true
    }
  }, [])

  /**
   * Image preloading effect.
   *
   * After data is fetched, preload images in batches:
   * - Batch 1: Hero + first 3 projects (blocks until complete)
   * - Remaining batches: Load in background
   */
  useEffect(() => {
    if (projectsData.length === 0 || hasPreloadedRef.current)
      return

    hasPreloadedRef.current = true

    const preloadImages = async () => {
      const heroImage = homepageData?.Hero_Image
        ? getImageUrl(homepageData, homepageData.Hero_Image)
        : null

      const imagesBySection: string[][] = []

      if (heroImage) {
        imagesBySection.push([heroImage])
      }

      projectsData.forEach((project) => {
        imagesBySection.push(project.images.map(img => img.src))
      })

      await imagePreloader.preloadSections({
        imagesBySection,
        batchSize: PRELOAD_BATCH_SIZE,
        onProgress: (progress) => {
          setPreloadProgress(progress)
          if (progress.isReady) {
            setSectionsReady(true)
          }
        },
      })
    }

    preloadImages()
  }, [projectsData, homepageData])

  /**
   * Realtime subscription effect for live content updates.
   *
   * Subscribes to changes in all four collections:
   * - Portfolio_Projects: Sorted by Order field
   * - Homepage: Active records only, sorted by creation date
   * - About: Active records only, sorted by creation date
   * - Settings: Most recent record
   *
   * On any change, fetches fresh data and updates both state and cache.
   * The isCancelled flag prevents state updates after unmount.
   */
  useEffect(() => {
    let isCancelled = false

    pb.collection('Portfolio_Projects')
      .subscribe('*', async () => {
        const freshProjects = await pb
          .collection('Portfolio_Projects')
          .getFullList<PortfolioProject>({
            sort: 'Order',
          })

        if (!isCancelled) {
          setCachedData('Portfolio_Projects', freshProjects)
          setProjectsData(freshProjects.map(convertPocketBaseProject))
        }
      })

    pb.collection('Homepage')
      .subscribe('*', async () => {
        const freshHomepage = await pb
          .collection('Homepage')
          .getFullList<Homepage>({
            filter: 'Is_Active = true',
            sort: '-created',
          })

        if (!isCancelled) {
          setCachedData('Homepage', freshHomepage)
          setHomepageData(freshHomepage[0] || null)
        }
      })

    pb.collection('About')
      .subscribe('*', async () => {
        const freshAbout = await pb.collection('About')
          .getFullList<About>({
            filter: 'Is_Active = true',
            sort: '-created',
          })

        if (!isCancelled) {
          setCachedData('About', freshAbout)
          setAboutData(freshAbout[0] || null)
        }
      })

    pb.collection('Settings')
      .subscribe('*', async () => {
        const freshSettings = await pb
          .collection('Settings')
          .getFullList<Settings>({
            sort: '-created',
          })

        if (!isCancelled) {
          setCachedData('Settings', freshSettings)
          setSettingsData(freshSettings[0] || null)
        }
      })

    return () => {
      isCancelled = true
      pb.collection('Portfolio_Projects')
        .unsubscribe()
      pb.collection('Homepage')
        .unsubscribe()
      pb.collection('About')
        .unsubscribe()
      pb.collection('Settings')
        .unsubscribe()
    }
  }, [])

  /**
   * Favicon management effect.
   *
   * Updates the page favicon based on settings.favicon when settings data loads.
   *
   * Caching Strategy:
   * - Favicon stored as base64 data URL in localStorage
   * - Version key (settings.updated) tracks changes
   * - If cached version matches, use cached favicon
   * - Otherwise, fetch, convert to base64, cache, and update
   *
   * Error Handling:
   * - Logs warning if localStorage is full (quota exceeded)
   * - Falls back to direct URL with version query param
   * - Gracefully handles fetch failures
   */
  useEffect(() => {
    if (settingsData && settingsData.favicon) {
      const faviconUrl = getImageUrl(settingsData, settingsData.favicon)
      const cacheKey = 'favicon_cache'
      const versionKey = 'favicon_version'

      const cachedVersion = localStorage.getItem(versionKey)
      const cachedFavicon = localStorage.getItem(cacheKey)

      /**
       * Updates the DOM with the new favicon.
       * Removes existing favicon links and creates a new one.
       */
      const updateFavicon = (dataUrl: string) => {
        const existingLinks = document.querySelectorAll('link[rel="icon"]')
        existingLinks.forEach(link => link.remove())

        const faviconLink = document.createElement('link')
        faviconLink.rel = 'icon'
        faviconLink.type = 'image/png'
        faviconLink.href = dataUrl
        document.head.appendChild(faviconLink)
      }

      if (cachedVersion === settingsData.updated && cachedFavicon) {
        updateFavicon(cachedFavicon)
      }
      else {
        fetch(faviconUrl)
          .then(response => response.blob())
          .then((blob) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const dataUrl = reader.result as string

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
            updateFavicon(`${faviconUrl}?v=${settingsData.updated}`)
          })
      }
    }
  }, [settingsData])

  return {
    projectsData,
    homepageData,
    aboutData,
    settingsData,
    loading,
    error,
    preloadProgress,
    sectionsReady,
  }
}
