import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

const items = [
  { path: "/", label: "主页", icon: "home" },
  { path: "/bills", label: "账单", icon: "file-text" },
  { path: "/tools", label: "工具", icon: "calculator" },
  { path: "/console", label: "控制台", icon: "monitor" },
]

export default function MobileNav() {
  return (
    <nav className="flex items-center justify-around h-16 border-t border-border bg-card shrink-0">
      {items.map(item => (
        <NavLink key={item.path} to={item.path} end={item.path==="/"}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-0 rounded-md transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}>
          <i data-lucide={item.icon} className="size-[22px]"></i>
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
