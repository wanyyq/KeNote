interface CategoryIconProps {
  iconName: string
  size?: number
  className?: string
}

export default function CategoryIcon({ iconName, size = 16, className = '' }: CategoryIconProps) {
  return <i data-lucide={iconName} className={className} style={{ width: size, height: size }}></i>
}
