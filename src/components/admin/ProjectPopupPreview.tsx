import ProjectCardSVG from '../../assets/Project Card/JVDW WEB LIGHT BOX copy.svg'

interface ProjectPopupPreviewProps {
  projectTitle: string
  projectDescription: string
  projectResponsibility: string[]
}

export default function ProjectPopupPreview({
  projectTitle,
  projectDescription,
  projectResponsibility,
}: ProjectPopupPreviewProps) {
  return (
    <div className="relative" style={{ width: '280px' }}>
      <img
        src={ProjectCardSVG}
        alt="Project Card"
        className="h-auto w-full"
        style={{
          width: '280px',
          height: 'auto',
          filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.15))',
        }}
      />

      {/* Project Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-center px-4 py-8">
        <h2
          className="text-center leading-tight text-black uppercase"
          style={{
            fontFamily: 'EnduroWeb, sans-serif',
            letterSpacing: '0.03em',
            fontSize: '12px',
            marginBottom: '18px',
          }}
        >
          {projectTitle}
        </h2>

        <div
          className="text-center leading-tight text-black uppercase"
          style={{
            fontFamily: 'EnduroWeb, sans-serif',
            letterSpacing: '0.03em',
            fontSize: '12px',
            marginBottom: '18px',
          }}
        >
          {projectResponsibility.map((responsibility, index) => (
            <span key={`${responsibility}-${index}`}>
              {responsibility}
              {index < projectResponsibility.length - 1 && <br />}
            </span>
          ))}
        </div>

        <p
          className="text-center leading-tight text-black"
          style={{
            fontFamily: 'EnduroWeb, sans-serif',
            letterSpacing: '0.03em',
            fontSize: '12px',
          }}
        >
          {projectDescription}
        </p>
      </div>
    </div>
  )
}
