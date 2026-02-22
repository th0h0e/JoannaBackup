import type { Settings } from '../config/pocketbase'
import { getResponsiveFontSizes } from '../config/pocketbase'
import {
  navigationContainerClasses,
  navigationLinkClasses,
  navigationListClasses,
} from '../utils/sharedStyles'
import { FONT_FAMILY, generateFontMediaQueries, LETTER_SPACING } from '../utils/typography'

interface ProjectNavigationProps {
  projectTitles: string[]
  onLinkClick?: (index: number) => void
  settingsData?: Settings | null
}

export default function ProjectNavigation({
  projectTitles,
  onLinkClick,
  settingsData = null,
}: ProjectNavigationProps) {
  const fontSizes = getResponsiveFontSizes(settingsData)

  return (
    <>
      <style>
        {generateFontMediaQueries('.project-navigation__link', fontSizes)}
      </style>
      <div className={navigationContainerClasses}>
        <ul className={navigationListClasses}>
          {projectTitles.map((title, index) => (
            <li key={`${title}-${index}`}>
              <a
                href={`#project-${index}`}
                className={`${navigationLinkClasses} project-navigation__link`}
                style={{
                  fontFamily: FONT_FAMILY,
                  letterSpacing: LETTER_SPACING,
                }}
                onClick={(e) => {
                  if (onLinkClick) {
                    e.preventDefault()
                    onLinkClick(index)
                  }
                }}
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
