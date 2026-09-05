import { NavLink } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export type SidebarNavItem = {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
  /** Pil angka opsional (mis. jumlah rumah sakit tersimpan). */
  badge?: number
}

type Props = {
  /** Identitas portal yang ditampilkan di bawah brand; "Portal Admin" / "Portal Pengguna". */
  portalLabel: string
  items: SidebarNavItem[]
  footerTo: string
  footerCaption: string
  isOpen: boolean
  onClose: () => void
}

/**
 * Satu-satunya sidebar untuk semua portal. Shell sama (blok brand, nav,
 * footer profil, drawer mobile); hanya konfigurasi nav dan label yang beda.
 */
export default function AppSidebar({
  portalLabel,
  items,
  footerTo,
  footerCaption,
  isOpen,
  onClose,
}: Props) {
  const { profile } = useAuth()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-shrink-0 transform flex-col border-r border-border bg-surface transition-transform duration-200 ease-out md:static md:z-auto md:w-60 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-border-light px-5 py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
            <span className="font-display text-base font-extrabold leading-none text-white">
              H
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-extrabold leading-tight text-foreground">
              HospitalLink
            </p>
            <p className="text-[11px] font-semibold text-primary">
              {portalLabel}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-display text-[13px] font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-border-light hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span
                        className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-primary text-white"
                        }`}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <NavLink
          to={footerTo}
          onClick={onClose}
          className="flex items-center gap-2.5 border-t border-border px-3.5 py-3 text-left transition-colors hover:bg-background"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-light font-display text-sm font-bold text-primary">
            {(profile?.full_name || "P").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[13px] font-bold leading-tight text-foreground">
              {profile?.full_name || "Pengguna"}
            </p>
            <p className="text-[11px] text-muted">{footerCaption}</p>
          </div>
          <ChevronRight size={13} className="flex-shrink-0 text-subtle" />
        </NavLink>
      </aside>
    </>
  )
}
