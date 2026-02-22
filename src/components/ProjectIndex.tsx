import type { Settings } from '../config/pocketbase'
import ProjectNavigation from './ProjectNavigation'

interface ProjectIndexProps {
  projectTitles: string[]
  settingsData?: Settings | null
}

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
