import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '主页', icon: 'home' },
  { path: '/bills', label: '账单', icon: 'file-text' },
  { path: '/tools', label: '工具', icon: 'settings' },
  { path: '/console', label: '控制台', icon: 'monitor' },
]

interface SidebarProps { onNavigate?: () => void }

export default function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-auto custom-scrollbar">
      {navItems.map((item) => (
        <NavLink
          key={item.path} to={item.path} end={item.path === '/'} onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors',
              isActive ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
            )
          }
        >
          <i data-lucide={item.icon} className="w-[20px] h-[20px]"></i>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
