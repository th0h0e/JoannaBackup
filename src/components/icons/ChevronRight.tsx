interface ChevronRightProps {
  width?: number
  height?: number
  color?: string
  className?: string
}

export default function ChevronRight({
  width = 24,
  height = 24,
  color = 'white',
  className = '',
}: ChevronRightProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9,18 15,12 9,6" />
    </svg>
  )
}
