import type { Settings } from '../config/pocketbase'
import { getResponsiveFontSizes } from '../config/pocketbase'
import {
  navigationContainerClasses,
  navigationLinkClasses,
  navigationListClasses,
} from '../utils/sharedStyles'

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
  // Get dynamic font sizes from settings
  const fontSizes = getResponsiveFontSizes(settingsData)

  return (
    <>
      <style>
        {`
        .project-navigation__link {
          font-size: ${fontSizes.mobile}rem;
        }
        
        @media (min-width: 768px) {
          .project-navigation__link {
            font-size: ${fontSizes.tablet}rem;
          }
        }
        
        @media (min-width: 1024px) {
          .project-navigation__link {
            font-size: ${fontSizes.desktop}rem;
          }
        }
        
        @media (min-width: 1280px) {
          .project-navigation__link {
            font-size: ${fontSizes.largeDesktop}rem;
          }
        }
      `}
      </style>
      <div className={navigationContainerClasses}>
        <ul className={navigationListClasses}>
          {projectTitles.map((title, index) => (
            <li key={`${title}-${index}`}>
              <a
                href={`#project-${index}`}
                className={`${navigationLinkClasses} project-navigation__link`}
                style={{
                  fontFamily: 'EnduroWeb, sans-serif',
                  letterSpacing: '0.03em',
                }}
                onClick={(e) => {
                  if (onLinkClick) {
                    e.preventDefault()
                    onLinkClick(index)
                  }
                  else {
                    // Default behavior for ProjectIndex - direct navigation
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
