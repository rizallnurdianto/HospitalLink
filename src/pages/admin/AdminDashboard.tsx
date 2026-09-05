import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Hospital,
  Users,
  MessageSquare,
  MapPin,
  ArrowRight,
  Activity,
  Plus,
  ChevronRight,
  CheckCircle2,
  Pencil,
  Power,
} from "lucide-react"
import {
  getAdminStats,
  getRecentActivity,
  type AdminStats,
} from "../../api/dashboard"
import {
  listAllConversations,
  CATEGORY_LABELS,
  isAwaitingAdminReply,
} from "../../api/conversations"
import { listProfiles } from "../../api/profiles"
import { listAllHospitals } from "../../api/hospitals"
import { useAuth } from "../../context/AuthContext"
import { relativeTime } from "../../lib/format"
import RelativeTime from "../../components/common/RelativeTime"
import {
  Alert,
  Button,
  Card,
  PageContainer,
  SectionHeader,
  Spinner,
  StatCard,
} from "../../components/ui"
import type { ActivityLog, Conversation, Profile } from "../../types/db"

const dateLabel = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

function startOfTodayMs(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [provincesCovered, setProvincesCovered] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getRecentActivity(6),
      listAllConversations(),
      listProfiles(),
      listAllHospitals(),
    ])
      .then(([s, a, c, p, h]) => {
        setStats(s)
        setActivity(a)
        setConversations(c)
        setProfiles(Object.fromEntries(p.map((row) => [row.id, row])))
        setProvincesCovered(
          new Set(
            h
              .filter((row) => row.is_active && row.province)
              .map((row) => row.province),
          ).size,
        )
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const waiting = useMemo(
    () =>
      conversations
        .filter(isAwaitingAdminReply)
        .sort(
          (a, b) =>
            new Date(b.last_message_at).getTime() -
            new Date(a.last_message_at).getTime(),
        ),
    [conversations],
  )
  const waitingConversations = waiting.slice(0, 6)
  const conversationsTotal = conversations.length
  const newTodayCount = useMemo(() => {
    const t = startOfTodayMs()
    return conversations.filter((c) => new Date(c.created_at).getTime() >= t)
      .length
  }, [conversations])

  return (
    <PageContainer>
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {loading || !stats ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-6">
          {/* sambutan */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary-light via-surface to-surface p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-extrabold text-foreground">
                Halo, {(profile?.full_name || "Admin").split(" ")[0]}
              </h2>
              <p className="mt-1 text-[13px] text-muted">
                Ringkasan HospitalLink · {dateLabel}
              </p>
              {(newTodayCount > 0 || stats.usersNew7d > 0) && (
                <p className="mt-1.5 text-[12px] font-medium text-primary">
                  {[
                    newTodayCount > 0 &&
                      `${newTodayCount} percakapan baru hari ini`,
                    stats.usersNew7d > 0 &&
                      `${stats.usersNew7d} pengguna baru minggu ini`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <Button to="/admin/hospitals/new" icon={<Plus size={15} />}>
                Tambah Rumah Sakit
              </Button>
              <Button
                to="/admin/inbox"
                variant="secondary"
                icon={<MessageSquare size={15} />}
              >
                Bantuan
              </Button>
            </div>
          </div>

          {/* statistik */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Hospital size={18} />}
              label="Rumah Sakit"
              value={stats.hospitalsTotal}
              to="/admin/hospitals"
            />
            <StatCard
              icon={<Users size={18} />}
              label="Pengguna"
              value={stats.patients + stats.admins}
              to="/admin/users"
            />
            <StatCard
              icon={<MessageSquare size={18} />}
              label="Menunggu Balasan"
              value={waiting.length}
              tone={waiting.length > 0 ? "warning" : "primary"}
              to="/admin/inbox"
            />
            <StatCard
              icon={<MapPin size={18} />}
              label="Cakupan Provinsi"
              value={provincesCovered}
              to="/admin/hospitals"
            />
          </div>

          {/* dua panel seimbang */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* percakapan yang menunggu balasan */}
            <Card className="flex flex-col overflow-hidden">
              <SectionHeader
                icon={<MessageSquare size={15} />}
                title="Percakapan Menunggu Balasan"
                count={waiting.length}
                action={
                  <Link
                    to="/admin/inbox"
                    className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                  >
                    Lihat semua <ArrowRight size={12} />
                  </Link>
                }
              />
              {waitingConversations.length === 0 ? (
                <EmptyPanel
                  text={
                    conversationsTotal > 0
                      ? `${conversationsTotal} percakapan, semua sudah dibalas.`
                      : "Belum ada percakapan masuk."
                  }
                />
              ) : (
                <ul className="divide-y divide-border-light">
                  {waitingConversations.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/admin/inbox/${c.id}`}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-background"
                      >
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-light font-display text-[13px] font-bold text-primary">
                          {(profiles[c.patient_id]?.full_name || "P")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-[13px] font-bold text-foreground">
                            {profiles[c.patient_id]?.full_name || "Pengguna"}
                          </p>
                          <p className="truncate text-[11px] text-muted">
                            {c.last_message ||
                              CATEGORY_LABELS[c.category] ||
                              c.subject}{" "}
                            · {relativeTime(c.last_message_at)}
                          </p>
                        </div>
                        <ChevronRight
                          size={14}
                          className="flex-shrink-0 text-subtle"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* aktivitas terakhir */}
            <Card className="flex flex-col overflow-hidden">
              <SectionHeader
                icon={<Activity size={15} />}
                title="Aktivitas Terakhir"
              />
              {activity.length === 0 ? (
                <EmptyPanel text="Belum ada aktivitas tercatat." />
              ) : (
                <ul className="divide-y divide-border-light">
                  {activity.map((a) => {
                    const meta = ACTION_META[a.action] ?? ACTION_META.default
                    const actor = a.actor_id
                      ? profiles[a.actor_id]?.full_name
                      : null
                    return (
                      <li
                        key={a.id}
                        className="flex items-start gap-3 px-5 py-3"
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg ${meta.cls}`}
                        >
                          {meta.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[12px] leading-snug text-foreground">
                            {a.summary}
                          </p>
                          <p className="mt-0.5 text-[10px] text-subtle">
                            <RelativeTime value={a.created_at} />
                            {actor ? ` · ${actor}` : ""}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

type ActionMeta = {
  icon: React.ReactNode
  cls: string
}

const ACTION_META: Record<string, ActionMeta> = {
  created: { icon: <Plus size={12} />, cls: "bg-success-light text-success" },
  updated: { icon: <Pencil size={12} />, cls: "bg-primary-light text-primary" },
  activated: {
    icon: <Power size={12} />,
    cls: "bg-success-light text-success",
  },
  deactivated: {
    icon: <Power size={12} />,
    cls: "bg-danger-light text-danger",
  },
  default: { icon: <Activity size={12} />, cls: "bg-background text-muted" },
}

/** Panel kecil "semua beres" yang tampil di tengah kartu dashboard. */
function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-12 text-center">
      <CheckCircle2 size={20} className="text-success" />
      <p className="max-w-[240px] text-[12px] text-muted">{text}</p>
    </div>
  )
}
