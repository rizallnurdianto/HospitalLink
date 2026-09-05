import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import AppSidebar, { type SidebarNavItem } from "./AppSidebar"
import TopBar from "./TopBar"

export type PageMeta = {
  title: string
  subtitle?: string
}

type Props = {
  portalLabel: string
  navItems: SidebarNavItem[]
  footerTo: string
  footerCaption: string
  resolveMeta: (pathname: string) => PageMeta
  /** Strip opsional yang dirender antara top bar dan halaman (mis. pengumuman). */
  banner?: React.ReactNode
}

/**
 * Satu-satunya shell aplikasi: sidebar + top bar + main yang bisa discroll.
 * Kedua portal merender ini dengan konfigurasi nav masing-masing; kerangkanya sama persis.
 */
export default function AppLayout({
  portalLabel,
  navItems,
  footerTo,
  footerCaption,
  resolveMeta,
  banner,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const meta = resolveMeta(pathname)

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar
        portalLabel={portalLabel}
        items={navItems}
        footerTo={footerTo}
        footerCaption={footerCaption}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {banner}

        <main className="relative flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
