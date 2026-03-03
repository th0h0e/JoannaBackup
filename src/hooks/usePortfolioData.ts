import type {
  About,
  Homepage,
  PortfolioProject,
  Settings,
} from '../config/pocketbase'
import type { PreloadProgress } from '../utils/imagePreloader'
import { useCallback, useEffect, useRef, useState } from 'react'
import pb, {
  getCachedData,
  getCacheVersion,
  getImageUrl,
  setCachedData,
  withTimeout,
} from '../config/pocketbase'
import { imagePreloader } from '../utils/imagePreloader'

const PRELOAD_BATCH_SIZE = 3

export interface ConvertedProject {
  title: string
  description: string
  images: { src: string }[]
  responsibility?: string[]
}

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

interface UsePortfolioDataReturn {
  projectsData: ConvertedProject[]
  homepageData: Homepage | null
  aboutData: About | null
  settingsData: Settings | null
  loading: boolean
  error: string | null
  preloadProgress: PreloadProgress | null
  sectionsReady: boolean
}

export function usePortfolioData(): UsePortfolioDataReturn {
  const [projectsData, setProjectsData] = useState<ConvertedProject[]>([])
  const [homepageData, setHomepageData] = useState<Homepage | null>(null)
  const [aboutData, setAboutData] = useState<About | null>(null)
  const [settingsData, setSettingsData] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preloadProgress, setPreloadProgress] = useState<PreloadProgress | null>(null)
  const [sectionsReady, setSectionsReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(() => pb.authStore.isValid)

  const hasPreloadedRef = useRef(false)
  const cacheVersionRef = useRef(getCacheVersion())
  const isMountedRef = useRef(false)
  const isComponentMountedRef = useRef(true)

  /**
   * Auth state listener - tracks admin login/logout.
   */
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token) => {
      setIsAdmin(!!token)
    })
    return unsubscribe
  }, [])

  /**
   * Cleanup on unmount - prevents state updates after unmount.
   */
  useEffect(() => {
    return () => {
      isComponentMountedRef.current = false
    }
  }, [])

  /**
   * Fetches all data from PocketBase API.
   */
  const fetchData = useCallback(async (forceRefetch = false) => {
    try {
      setLoading(true)

      // Check cache first (unless forced)
      if (!forceRefetch) {
        const cachedProjects = getCachedData<PortfolioProject[]>('Portfolio_Projects')
        const cachedHomepage = getCachedData<Homepage[]>('Homepage')
        const cachedAbout = getCachedData<About[]>('About')
        const cachedSettings = getCachedData<Settings[]>('Settings')

        if (cachedProjects && cachedHomepage && cachedAbout && cachedSettings) {
          const convertedProjects = cachedProjects.map(convertPocketBaseProject)
          setProjectsData(convertedProjects)
          setHomepageData(cachedHomepage[0] || null)
          setAboutData(cachedAbout[0] || null)
          setSettingsData(cachedSettings[0] || null)
          setError(null)
          setLoading(false)
          return
        }
      }

      // Fetch from API with timeout
      const [
        projectsResponse,
        homepageResponse,
        aboutResponse,
        settingsResponse,
      ] = await withTimeout(Promise.all([
        pb.collection('Portfolio_Projects')
          .getFullList<PortfolioProject>({ sort: 'Order' }),
        pb.collection('Homepage')
          .getFullList<Homepage>({ filter: 'Is_Active = true', sort: '-created' }),
        pb.collection('About')
          .getFullList<About>({ filter: 'Is_Active = true', sort: '-created' }),
        pb.collection('Settings')
          .getFullList<Settings>({ sort: '-created' }),
      ]))

      // Cache the results
      setCachedData('Portfolio_Projects', projectsResponse)
      setCachedData('Homepage', homepageResponse)
      setCachedData('About', aboutResponse)
      setCachedData('Settings', settingsResponse)

      // Update cache version ref
      cacheVersionRef.current = getCacheVersion()

      // Update state (only if still mounted)
      if (!isComponentMountedRef.current)
        return

      const convertedProjects = projectsResponse.map(convertPocketBaseProject)
      setProjectsData(convertedProjects)
      setHomepageData(homepageResponse[0] || null)
      setAboutData(aboutResponse[0] || null)
      setSettingsData(settingsResponse[0] || null)
      setError(null)
    }
    catch (err) {
      if (!isComponentMountedRef.current)
        return
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    }
    finally {
      if (isComponentMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  /**
   * Initial data fetch on mount.
   */
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchData()
    }
  }, [fetchData])

  /**
   * Image preloading effect.
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
   * Admin-only realtime subscriptions.
   * Visitors get no realtime updates - they only see cached data.
   */
  useEffect(() => {
    if (!isAdmin)
      return

    let isCancelled = false

    /**
     * Checks if cache version changed before refetching.
     * Prevents unnecessary API calls when data is still valid.
     */
    const checkCacheAndRefetch = async () => {
      const currentVersion = getCacheVersion()
      if (currentVersion !== cacheVersionRef.current) {
        cacheVersionRef.current = currentVersion
        await fetchData(true)
      }
    }

    // Subscribe to all collections for admin
    pb.collection('Portfolio_Projects')
      .subscribe('*', () => {
        if (!isCancelled)
          checkCacheAndRefetch()
      })

    pb.collection('Homepage')
      .subscribe('*', () => {
        if (!isCancelled)
          checkCacheAndRefetch()
      })

    pb.collection('About')
      .subscribe('*', () => {
        if (!isCancelled)
          checkCacheAndRefetch()
      })

    pb.collection('Settings')
      .subscribe('*', () => {
        if (!isCancelled)
          checkCacheAndRefetch()
      })

    return () => {
      isCancelled = true
      pb.collection('Portfolio_Projects').unsubscribe()
      pb.collection('Homepage').unsubscribe()
      pb.collection('About').unsubscribe()
      pb.collection('Settings').unsubscribe()
    }
  }, [isAdmin, fetchData])

  /**
   * Favicon management effect.
   */
  useEffect(() => {
    if (settingsData && settingsData.favicon) {
      const faviconUrl = getImageUrl(settingsData, settingsData.favicon)
      const cacheKey = 'favicon_cache'
      const versionKey = 'favicon_version'

      const cachedVersion = localStorage.getItem(versionKey)
      const cachedFavicon = localStorage.getItem(cacheKey)

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
              catch (err) {
                console.warn('Failed to cache favicon:', err)
              }

              updateFavicon(dataUrl)
            }
            reader.readAsDataURL(blob)
          })
          .catch((err) => {
            console.warn('Failed to load favicon:', err)
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
