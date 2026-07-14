import { useState } from "react"
import { NavLink } from "react-router-dom"
import { useIsMobile } from "@/hooks/useMediaQuery"
import MobileNav from "@/components/layout/MobileNav"
import { Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const navItems = [
  { path: "/", label: "主页", icon: "home" },
  { path: "/bills", label: "账单", icon: "file-text" },
  { path: "/tools", label: "工具", icon: "calculator" },
  { path: "/console", label: "控制台", icon: "monitor" },
]

export default function Layout() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)

  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-background">
        <header className="flex items-center px-4 h-14 border-b bg-card border-border shrink-0">
          <div className="size-7 rounded-md bg-primary flex items-center justify-center mr-2"><span className="text-primary-foreground text-xs font-bold">K</span></div>
          <h1 className="text-lg font-semibold tracking-tight">KeNote</h1>
        </header>
        <main className="flex-1 overflow-auto custom-scrollbar"><Outlet /></main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="flex h-dvh bg-background">
      <aside className={cn("shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-200", collapsed ? "w-[52px]" : "w-56")}>
        <div className={cn("flex items-center h-14 border-b border-sidebar-border shrink-0", collapsed ? "justify-center px-1" : "gap-2 px-4")}>
          <div className="size-7 rounded-md bg-primary flex items-center justify-center shrink-0"><span className="text-primary-foreground text-xs font-bold">K</span></div>
          {!collapsed && <h1 className="text-lg font-semibold tracking-tight truncate">KeNote</h1>}
        </div>
        <nav className={cn("flex-1 py-3 space-y-0.5 overflow-auto custom-scrollbar", collapsed ? "px-1" : "px-2")}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path==="/"}
              className={({ isActive }) => cn(
                "flex items-center rounded-md text-[13px] font-medium transition-colors",
                collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2",
                isActive ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}>
              <i data-lucide={item.icon} className="size-[18px] shrink-0 pointer-events-none"></i>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-2 flex shrink-0">
          <button onClick={() => setCollapsed(!collapsed)} className={cn("p-1.5 rounded-md hover:bg-sidebar-accent transition-colors flex items-center justify-center", collapsed ? "mx-auto" : "w-full justify-start gap-2")} title={collapsed ? "展开菜单" : "折叠菜单"}>
            <i data-lucide={collapsed ? "panel-right-open" : "panel-left-open"} className="size-4 pointer-events-none"></i>
            {!collapsed && <span className="text-[13px] text-sidebar-foreground/70">折叠</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto custom-scrollbar bg-background"><Outlet /></main>
    </div>
  )
}
