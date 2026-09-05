import { useState } from "react"
import { LogOut, Menu, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useDismissable } from "../../hooks/useDismissable"
import NotificationBell from "./NotificationBell"

type Props = {
  title: string
  subtitle?: string
  onMenuClick?: () => void
  /** Kontrol tambahan opsional yang dirender di kiri ikon lonceng (mis. aksi halaman). */
  actions?: React.ReactNode
}

export default function TopBar({
  title,
  subtitle,
  onMenuClick,
  actions,
}: Props) {
  const navigate = useNavigate()
  const { profile, session, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useDismissable<HTMLDivElement>(menuOpen, () =>
    setMenuOpen(false),
  )

  const initial = (profile?.full_name || "P").charAt(0).toUpperCase()

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Buka menu"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border text-muted md:hidden"
        >
          <Menu size={17} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-base font-bold leading-tight text-foreground sm:text-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 hidden truncate text-xs text-muted sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2.5">
        {actions}

        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Akun saya"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary-light bg-primary-light font-display text-sm font-bold text-primary"
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
              <div className="border-b border-border-light px-3.5 py-3">
                <p className="truncate font-display text-[13px] font-bold text-foreground">
                  {profile?.full_name || "Pengguna"}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {session?.user.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  navigate(
                    profile?.role === "admin" ? "/admin/profile" : "/profile",
                  )
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-background"
              >
                <User size={14} className="text-muted" />
                Profil Saya
              </button>
              <button
                onClick={async () => {
                  setMenuOpen(false)
                  await signOut()
                  navigate("/login", { replace: true })
                }}
                className="flex w-full items-center gap-2.5 border-t border-border-light px-3.5 py-2.5 text-left text-[13px] font-medium text-danger transition-colors hover:bg-danger-light"
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
