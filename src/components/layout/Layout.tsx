import { useState } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-background">
        <header className="flex items-center justify-between px-4 h-14 border-b bg-card border-border shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-accent transition-colors" aria-label="菜单">
              <i data-lucide="menu" className="w-5 h-5"></i>
            </button>
            <h1 className="text-lg font-semibold tracking-tight">KeNote</h1>
          </div>
        </header>
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSidebarOpen(false)} />
            <div className="fixed top-0 left-0 z-50 w-64 h-full bg-sidebar border-r border-sidebar-border shadow-xl animate-slide-in">
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <h2 className="font-semibold text-lg">KeNote</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md hover:bg-sidebar-accent transition-colors">
                  <i data-lucide="x" className="w-[18px] h-[18px]"></i>
                </button>
              </div>
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
        <main className="flex-1 overflow-auto custom-scrollbar"><Outlet /></main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="flex h-dvh bg-background">
      <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">K</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">KeNote</h1>
        </div>
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-auto custom-scrollbar bg-background"><Outlet /></main>
    </div>
  )
}
