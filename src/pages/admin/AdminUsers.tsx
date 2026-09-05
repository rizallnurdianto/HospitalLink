import { useEffect, useMemo, useState } from "react"
import { Power, X, Eye, Mail, Phone, MapPin, CalendarDays } from "lucide-react"
import { listProfiles, setProfileActive } from "../../api/profiles"
import { useAuth } from "../../context/AuthContext"
import { formatDate, formatDateTime } from "../../lib/format"
import {
  ActiveBadge,
  Alert,
  Avatar,
  Card,
  EmptyState,
  IconButton,
  PageContainer,
  SearchInput,
  Segmented,
  Spinner,
} from "../../components/ui"
import type { Profile } from "../../types/db"

type StatusFilter = "all" | "active" | "inactive"

export default function AdminUsers() {
  const { session } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    listProfiles()
      .then((rows) => {
        setProfiles(rows.filter((p) => p.role === "patient"))
        setError(null)
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return profiles.filter((p) => {
      if (status === "active" && !p.is_active) return false
      if (status === "inactive" && p.is_active) return false
      if (
        q &&
        !`${p.full_name} ${p.email} ${p.location} ${p.phone}`
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
  }, [profiles, query, status])

  const activeCount = profiles.filter((p) => p.is_active).length
  const detail = detailId
    ? (profiles.find((p) => p.id === detailId) ?? null)
    : null

  const toggleActive = async (p: Profile) => {
    setSavingId(p.id)
    try {
      await setProfileActive(p.id, !p.is_active)
      load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <Alert tone="info">
          Akun pengguna dibuat sendiri lewat halaman pendaftaran. Halaman ini
          untuk <strong>melihat data pengguna</strong> dan menonaktifkan akun
          yang melanggar. Akun admin dikelola terpisah lewat pendaftaran admin.
        </Alert>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari nama, email, provinsi, atau nomor HP…"
          className="min-w-[220px] flex-1"
        />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Semua" },
            { value: "active", label: "Aktif" },
            { value: "inactive", label: "Nonaktif" },
          ]}
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna"
          description={
            profiles.length === 0
              ? "Belum ada yang mendaftar."
              : "Coba ubah kata kunci atau filter status."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-background/70 text-[10px] uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Provinsi</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Terdaftar</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="align-middle transition-colors hover:bg-primary-light/30"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={p.full_name || "?"}
                          size={38}
                          tone="muted"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-display text-[13px] font-bold text-foreground">
                            {p.full_name || "(tanpa nama)"}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-muted">
                            {p.email || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-muted">
                      {p.location || "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <ActiveBadge active={p.is_active} />
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-muted">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setDetailId(p.id)}
                          title="Lihat data pengguna"
                          aria-label={`Lihat data ${p.full_name || "pengguna"}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          disabled={
                            p.id === session?.user.id || savingId === p.id
                          }
                          onClick={() => toggleActive(p)}
                          title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                          aria-label={
                            p.is_active
                              ? `Nonaktifkan ${p.full_name || "pengguna"}`
                              : `Aktifkan ${p.full_name || "pengguna"}`
                          }
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                            p.is_active
                              ? "hover:border-danger hover:bg-danger-light hover:text-danger"
                              : "hover:border-success hover:bg-success-light hover:text-success"
                          }`}
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && profiles.length > 0 && (
        <p className="mt-3 text-[11px] text-subtle">
          {filtered.length} dari {profiles.length} pengguna · {activeCount}{" "}
          aktif
        </p>
      )}

      {detail && (
        <UserDetailDrawer
          user={detail}
          isSelf={detail.id === session?.user.id}
          busy={savingId === detail.id}
          onToggleActive={() => toggleActive(detail)}
          onClose={() => setDetailId(null)}
        />
      )}
    </PageContainer>
  )
}

/* --------------------------- panel detail --------------------------- */

function UserDetailDrawer({
  user,
  isSelf,
  busy,
  onToggleActive,
  onClose,
}: {
  user: Profile
  isSelf: boolean
  busy: boolean
  onToggleActive: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/40"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <p className="font-display text-sm font-bold text-foreground">
            Data Pengguna
          </p>
          <IconButton label="Tutup" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-center gap-4 rounded-2xl bg-background p-4">
            <Avatar name={user.full_name || "?"} size={56} tone="muted" />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-foreground">
                {user.full_name || "(tanpa nama)"}
              </p>
              <div className="mt-1.5">
                <ActiveBadge active={user.is_active} />
              </div>
            </div>
          </div>

          <Section title="Kontak">
            <DetailRow
              icon={<Mail size={13} />}
              label="Email"
              value={user.email}
            />
            <DetailRow
              icon={<Phone size={13} />}
              label="Nomor HP"
              value={user.phone}
            />
            <DetailRow
              icon={<MapPin size={13} />}
              label="Provinsi"
              value={user.location}
            />
          </Section>

          <Section title="Akun">
            <DetailRow
              icon={<CalendarDays size={13} />}
              label="Terdaftar"
              value={formatDateTime(user.created_at)}
            />
          </Section>

          {!isSelf && (
            <Section title="Kelola">
              <button
                disabled={busy}
                onClick={onToggleActive}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
                  user.is_active
                    ? "border-danger-light text-danger hover:bg-danger hover:text-white"
                    : "border-success-light text-success hover:bg-success hover:text-white"
                }`}
              >
                <Power size={14} />
                {user.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
              </button>
              <p className="mt-1.5 text-[11px] text-subtle">
                Akun nonaktif tidak bisa masuk ke portal.
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-subtle">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-background px-3 py-2.5">
      <span className="text-primary">{icon}</span>
      <span className="w-20 flex-shrink-0 text-[11px] font-medium text-subtle">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
        {value || "-"}
      </span>
    </div>
  )
}
