/**
 * @file ProjectIndex.tsx
 * @description Final section of the portfolio containing the project navigation list.
 *
 * This component serves as the last scroll-snap section in the portfolio layout,
 * providing a full-screen white background that displays the complete list of
 * project titles. It wraps the ProjectNavigation component and positions it as
 * a scroll-snap section in the main vertical scrolling container.
 *
 * @architecture
 * The component implements:
 *
 * 1. **Scroll-Snap Section** - Uses `snap-center` class to be a snap point in the
 *    vertical scroll container, occupying the full viewport height
 * 2. **Anchor Link Pattern** - The wrapped ProjectNavigation uses `#project-{index}`
 *    hrefs for native browser navigation to project sections
 * 3. **White Background** - Distinct visual treatment that signals the end of the
 *    portfolio content and provides high contrast for the navigation list
 *
 * Section Identification:
 * - Uses `id="project-index"` for potential anchor linking from other components
 * - Full viewport height (`100lvh`) for consistent scroll-snap behavior
 *
 * @see {@link ProjectNavigation} - The core navigation component rendered within
 * @see {@link App} - Renders this as the final section in the scroll container
 */

import type { Settings } from '../config/pocketbase'
import ProjectNavigation from './ProjectNavigation'

interface ProjectIndexProps {
  projectTitles: string[]
  settingsData?: Settings | null
}

/**
 * Final portfolio section containing the project navigation list.
 *
 * Renders as a full-screen white section with centered content, serving as the
 * concluding scroll-snap section in the portfolio. Contains the ProjectNavigation
 * component which displays all project titles as clickable anchor links.
 *
 * @param {ProjectIndexProps} props - Component props
 * @param {string[]} props.projectTitles - Array of project titles to pass to ProjectNavigation
 * @param {Settings | null} [props.settingsData=null] - Settings data from PocketBase for typography configuration
 * @returns {JSX.Element} A full-screen section with the project navigation list
 */
export default function ProjectIndex({
  projectTitles,
  settingsData = null,
}: ProjectIndexProps) {
  return (
    <section
      id="project-index"
      className="flex w-full snap-center items-center justify-center bg-white"
      style={{ height: '100lvh' }}
    >
      <ProjectNavigation
        projectTitles={projectTitles}
        settingsData={settingsData}
      />
    </section>
  )
}
