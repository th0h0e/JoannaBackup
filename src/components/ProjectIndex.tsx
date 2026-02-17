import type { Settings } from '../config/pocketbase'
import ProjectNavigation from './ProjectNavigation'

interface ProjectIndexProps {
  projectTitles: string[]
  settingsData?: Settings | null
}

export default function ProjectIndex({ projectTitles, settingsData = null }: ProjectIndexProps) {
  return (
    <section
      id="project-index"
      className="w-full snap-center bg-white flex items-center justify-center"
      style={{ height: '100lvh' }}
    >
      <ProjectNavigation projectTitles={projectTitles} settingsData={settingsData} />
    </section>
  )
}
