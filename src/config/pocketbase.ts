import type {
  AboutResponse,
  BaseSystemFields,
  HomepageResponse,
  PortfolioProjectsResponse,
  SettingsResponse,
} from '../types/pocketbase-types'
import PocketBase from 'pocketbase'

// PocketBase client configuration
const pb = new PocketBase('https://pocketbase-j0ososc8ckcw48sos8w0ccok.kontext.icu')

// Default timeout for API requests (15 seconds)
const DEFAULT_TIMEOUT_MS = 15000

/**
 * Wraps a promise with a timeout, rejecting if it takes too long.
 * Useful for adding timeouts to PocketBase API calls.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${timeoutMs / 1000}s`))
      }, timeoutMs)
    }),
  ])
}

export default pb

// Re-export types with simpler names for use throughout the app
// Use the Response types with proper generics for JSON fields
export type PortfolioProject = PortfolioProjectsResponse<string[]> & {
  Responsibility?: string[] // Legacy field alias
}
export type Homepage = HomepageResponse
export type About = AboutResponse<string[]> & {
  Client_List?: string[] // Legacy field alias
}
export type Settings = SettingsResponse

// Cache configuration - Long duration for better performance (7 days)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// Cache version key for invalidation
export const CACHE_VERSION_KEY = 'pocketbase_cache_version'

// Cache storage interface - using unknown for type safety
interface CacheEntry {
  data: unknown
  timestamp: number
  version: number
}

// Get current cache version
export function getCacheVersion(): number {
  try {
    const version = localStorage.getItem(CACHE_VERSION_KEY)
    return version ? Number.parseInt(version, 10) : 1
  }
  catch {
    return 1
  }
}

// Increment cache version (called when admin updates data)
function incrementCacheVersion(): void {
  try {
    const currentVersion = getCacheVersion()
    localStorage.setItem(CACHE_VERSION_KEY, String(currentVersion + 1))
  }
  catch (error) {
    console.warn('Cache version update error:', error)
  }
}

// Cache storage using localStorage
const getCacheKey = (collection: string) => `pocketbase_cache_${collection}`

function isValidCache(timestamp: number, version: number): boolean {
  const notExpired = Date.now() - timestamp < CACHE_DURATION
  const versionMatches = version === getCacheVersion()
  return notExpired && versionMatches
}

export function getCachedData<T>(collection: string): T | null {
  try {
    const cached = localStorage.getItem(getCacheKey(collection))
    if (!cached)
      return null

    const entry: CacheEntry = JSON.parse(cached)
    if (isValidCache(entry.timestamp, entry.version)) {
      return entry.data as T
    }
    else {
      // Clean up expired or outdated cache
      localStorage.removeItem(getCacheKey(collection))
      return null
    }
  }
  catch (error) {
    console.warn('Cache read error:', error)
    return null
  }
}

export function setCachedData<T>(collection: string, data: T): void {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: getCacheVersion(),
    }
    const serialized = JSON.stringify(entry)

    // Check if we have enough storage space (optional best-effort check)
    if (!hasStorageSpace(serialized.length)) {
      console.warn('Insufficient storage space, clearing old cache')
      clearCache()
    }

    localStorage.setItem(getCacheKey(collection), serialized)
  }
  catch (error) {
    console.warn('Cache write error:', error)
  }
}

/**
 * Best-effort check for available storage space.
 * Returns true if storage appears available or if API is unsupported.
 */
function hasStorageSpace(bytesNeeded: number): boolean {
  try {
    // Use Storage API if available (modern browsers)
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        if (usage !== undefined && quota !== undefined) {
          return (quota - usage) > bytesNeeded
        }
      })
    }
    return true // Fallback: assume space available
  }
  catch {
    return true
  }
}

export function clearCache(collection?: string): void {
  try {
    if (collection) {
      // Increment version to invalidate all caches
      incrementCacheVersion()
      // Also remove specific collection cache immediately
      localStorage.removeItem(getCacheKey(collection))
    }
    else {
      // Clear all PocketBase caches and increment version
      incrementCacheVersion()
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith('pocketbase_cache_')) {
          localStorage.removeItem(key)
        }
      })
    }
  }
  catch (error) {
    console.warn('Cache clear error:', error)
  }
}

/**
 * Updates the local cache version to match the server version.
 * Called when server version differs from local version.
 */
export function setLocalCacheVersion(version: number): void {
  try {
    localStorage.setItem(CACHE_VERSION_KEY, String(version))
  }
  catch (error) {
    console.warn('Failed to set local cache version:', error)
  }
}

/**
 * Fetches the current data version from the server.
 * This is a lightweight request that only fetches the Settings record.
 * Returns the server's data_version, or 1 as fallback.
 */
export async function getServerDataVersion(): Promise<number> {
  try {
    // Fetch only the first Settings record (there should only be one)
    const settingsList = await pb.collection('Settings').getList<Settings>(1, 1)
    const settings = settingsList.items[0]
    // Use data_version if it exists, otherwise fall back to 1
    // Using optional chaining and nullish coalescing for safety
    return (settings as Settings & { data_version?: number })?.data_version ?? 1
  }
  catch (error) {
    console.warn('Failed to fetch server data version:', error)
    return 1 // Fallback to version 1 if fetch fails
  }
}

/**
 * Increments the server-side data version.
 * Called by admin actions when data changes.
 * This signals to all clients that their cache is stale.
 */
export async function incrementServerDataVersion(): Promise<void> {
  try {
    // Fetch current settings to get the record ID and current version
    const settingsList = await pb.collection('Settings').getList<Settings>(1, 1)
    const settings = settingsList.items[0]

    if (!settings) {
      console.warn('No Settings record found to increment version')
      return
    }

    const currentVersion = (settings as Settings & { data_version?: number })?.data_version ?? 1

    // Update the data_version field
    await pb.collection('Settings').update(settings.id, {
      data_version: currentVersion + 1,
    } as Partial<Settings>)

    // Also increment local version for the admin
    incrementCacheVersion()
  }
  catch (error) {
    console.warn('Failed to increment server data version:', error)
  }
}

// Helper function to get image URLs
export function getImageUrl(record: BaseSystemFields, filename: string) {
  return pb.files.getURL(record, filename)
}

// Viewport-based image size configuration
const IMAGE_SIZE_CONFIG = {
  mobile: { maxWidth: 800, quality: 80 },
  tablet: { maxWidth: 1200, quality: 85 },
  desktop: { maxWidth: 1920, quality: 90 },
} as const

// Determine viewport category based on width
function getViewportCategory(width: number): keyof typeof IMAGE_SIZE_CONFIG {
  if (width < 768)
    return 'mobile'
  if (width < 1280)
    return 'tablet'
  return 'desktop'
}

// Get optimized image URL with PocketBase thumbnail parameters
export function getOptimizedImageUrl(
  record: BaseSystemFields,
  filename: string,
  viewportWidth: number = typeof window !== 'undefined' ? window.innerWidth : 1920,
): string {
  const baseUrl = getImageUrl(record, filename)
  const category = getViewportCategory(viewportWidth)
  const config = IMAGE_SIZE_CONFIG[category]

  const url = new URL(baseUrl)
  url.searchParams.set('thumb', `${config.maxWidth}x0`)

  return url.toString()
}

// Helper to get responsive font size classes (for CSS-in-JS)
export function getResponsiveFontSizes(settings: Settings | null) {
  return {
    mobile: settings?.Mobile_Font_Size ?? 1.25,
    tablet: settings?.Tablet_Font_Size ?? 1.875,
    desktop: settings?.Desktop_Font_Size ?? 2.25,
    largeDesktop: settings?.Large_Desktop_Font_Size ?? 3,
  }
}
