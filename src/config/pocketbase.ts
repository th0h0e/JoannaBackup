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
const CACHE_VERSION_KEY = 'pocketbase_cache_version'

// Cache storage interface - using unknown for type safety
interface CacheEntry {
  data: unknown
  timestamp: number
  version: number
}

// Get current cache version
function getCacheVersion(): number {
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
    localStorage.setItem(getCacheKey(collection), JSON.stringify(entry))
  }
  catch (error) {
    console.warn('Cache write error:', error)
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

// Helper function to get image URLs
export function getImageUrl(record: BaseSystemFields, filename: string) {
  return pb.files.getURL(record, filename)
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
