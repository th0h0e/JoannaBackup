// Static classes for project titles (non-font-size styles)
export const projectTitleClasses = 'uppercase leading-none block'

// Function to generate dynamic project title styles based on settings
export function getProjectTitleStyles(fontSizes: {
  mobile: number
  tablet: number
  desktop: number
  largeDesktop: number
}) {
  return {
    'fontFamily': 'EnduroWeb, sans-serif',
    'letterSpacing': '0.03em',
    'fontSize': `${fontSizes.mobile}rem`,
    '@media (min-width: 768px)': {
      fontSize: `${fontSizes.tablet}rem`,
    },
    '@media (min-width: 1024px)': {
      fontSize: `${fontSizes.desktop}rem`,
    },
    '@media (min-width: 1280px)': {
      fontSize: `${fontSizes.largeDesktop}rem`,
    },
  }
}

// Legacy static style (for fallback)
export const projectTitleStyle = {
  fontFamily: 'EnduroWeb, sans-serif',
  letterSpacing: '0.03em',
}

// Shared navigation container styling for ProjectIndex and HamburgerMenu
export const navigationContainerClasses
  = 'w-full md:w-4/5 text-center px-6 md:px-0'

// Shared navigation link styling (without font sizes - will be dynamic)
export const navigationLinkClasses
  = 'text-black uppercase leading-none block no-underline hover:underline transition-all duration-200'

// Shared navigation list spacing
export const navigationListClasses = 'space-y-1'

// Shared project title container padding (used in both navigation and carousel titles)
export const projectTitleContainerClasses = 'px-6 md:px-0'
