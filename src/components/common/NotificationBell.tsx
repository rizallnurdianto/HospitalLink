import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bell,
  MessageSquare,
  Building2,
  Megaphone,
  UserPlus,
  AlertTriangle,
  CheckCheck,
} from "lucide-react"
import { useNotifications } from "../../hooks/useNotifications"
import { useDismissable } from "../../hooks/useDismissable"
import RelativeTime from "./RelativeTime"
import type { NotifType } from "../../lib/notifications"

const ICONS: Record<NotifType, { icon: typeof Bell; cls: string }> = {
  adminReply: { icon: MessageSquare, cls: "bg-primary-light text-primary" },
  newMessage: { icon: MessageSquare, cls: "bg-primary-light text-primary" },
  directory: { icon: Building2, cls: "bg-primary-light text-primary" },
  announcement: { icon: Megaphone, cls: "bg-warning-light text-warning" },
  newUser: { icon: UserPlus, cls: "bg-success-light text-success" },
  hospitalReview: { icon: AlertTriangle, cls: "bg-warning-light text-warning" },
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const { entries, unreadCount, seenAt, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(0)
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false))

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpenedAt(seenAt)
    setOpen(true)
    markAllRead()
  }

  // "baru sejak terakhir dibuka"; dibekukan selagi panel terbuka
  const isNew = useMemo(
    () => (at: number) => at > (open ? openedAt : seenAt),
    [open, openedAt, seenAt],
  )

  const freshCount = useMemo(
    () => entries.filter((e) => isNew(e.at)).length,
    [entries, isNew],
  )

  // Tandai dibaca + tutup jendela sorot "baru" agar semua baris langsung bersih.
  const dismissFresh = () => {
    markAllRead()
    setOpenedAt(Date.now())
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifikasi"
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border text-muted transition-colors hover:bg-primary-light hover:text-primary ${
          open
            ? "border-primary bg-primary-light text-primary"
            : "border-border bg-background"
        }`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-surface bg-danger px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="pop-in absolute right-0 top-[calc(100%+8px)] z-40 flex max-h-[70vh] w-[320px] max-w-[calc(100vw-1.5rem)] origin-top-right flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
          <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border-light px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-bold text-foreground">
                Notifikasi
              </p>
              {freshCount > 0 && (
                <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {freshCount} baru
                </span>
              )}
            </div>
            {entries.length > 0 &&
              (freshCount > 0 ? (
                <button
                  onClick={dismissFresh}
                  className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary-light"
                >
                  <CheckCheck size={13} />
                  Tandai dibaca
                </button>
              ) : (
                <span className="flex flex-shrink-0 items-center gap-1 text-[11px] font-medium text-subtle">
                  <CheckCheck size={13} />
                  Sudah dibaca
                </span>
              ))}
          </div>

          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <Bell size={20} className="text-subtle" />
              <p className="text-[12px] text-muted">Belum ada notifikasi.</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-border-light overflow-y-auto">
              {entries.map((e) => {
                const meta = ICONS[e.type]
                const Icon = meta.icon
                const fresh = isNew(e.at)
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => {
                        dismissFresh()
                        if (e.to) navigate(e.to)
                        setOpen(false)
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-background ${
                        fresh ? "bg-primary-light/40" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${meta.cls}`}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`truncate text-[13px] text-foreground ${
                              fresh ? "font-bold" : "font-semibold"
                            }`}
                          >
                            {e.title}
                          </span>
                          {fresh && (
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-danger" />
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-[11px] text-muted">
                          {e.body}
                        </span>
                        <RelativeTime
                          value={new Date(e.at).toISOString()}
                          className="mt-0.5 block text-[10px] text-subtle"
                        />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
