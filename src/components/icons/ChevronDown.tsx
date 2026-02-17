interface ChevronDownProps {
  width?: number
  height?: number
  color?: string
  className?: string
}

export default function ChevronDown({
  width = 24,
  height = 24,
  color = 'white',
  className = '',
}: ChevronDownProps) {
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
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}
