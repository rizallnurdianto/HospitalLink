import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Pencil, Power, Trash2, Building2, MapPin } from "lucide-react"
import { useHospitals } from "../../hooks/useHospitals"
import { deleteHospital, setHospitalActive } from "../../api/hospitals"
import { formatDateTime } from "../../lib/format"
import {
  HOSPITAL_CATEGORIES,
  categoryShort,
} from "../../lib/hospitalCategories"
import {
  ActiveBadge,
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  PageContainer,
  SearchInput,
  Spinner,
} from "../../components/ui"
import type { Hospital } from "../../types/db"

type PendingAction = { hospital: Hospital; action: "toggle" | "delete" }

const ACTION_BTN =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors"

type StatusFilter = "all" | "active" | "inactive"
type TypeFilter = "all" | "swasta" | "pemerintah"

export default function AdminHospitals() {
  const { hospitals, loading, error, reload } = useHospitals("all")
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [busy, setBusy] = useState(false)

  const counts = useMemo(
    () => ({
      all: hospitals.length,
      active: hospitals.filter((h) => h.is_active).length,
      inactive: hospitals.filter((h) => !h.is_active).length,
    }),
    [hospitals],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return hospitals
      .filter((h) => {
        if (statusFilter === "active" && !h.is_active) return false
        if (statusFilter === "inactive" && h.is_active) return false
        if (typeFilter === "pemerintah" && h.type !== "Rumah Sakit Pemerintah")
          return false
        if (typeFilter === "swasta" && h.type === "Rumah Sakit Pemerintah")
          return false
        if (categoryFilter && h.category !== categoryFilter) return false
        if (
          q &&
          !`${h.name} ${h.location} ${h.category} ${h.services.join(" ")}`
            .toLowerCase()
            .includes(q)
        )
          return false
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
  }, [hospitals, query, statusFilter, typeFilter, categoryFilter])

  const runPending = async () => {
    if (!pending) return
    setBusy(true)
    try {
      // activity_log ditulis otomatis oleh trigger DB on_hospital_change.
      if (pending.action === "delete") {
        await deleteHospital(pending.hospital.id)
      } else {
        await setHospitalActive(
          pending.hospital.id,
          !pending.hospital.is_active,
        )
      }
      setPending(null)
      reload()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageContainer>
      {/* ringkasan status */}
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <StatTile label="Semua" value={counts.all} />
        <StatTile label="Aktif" value={counts.active} tone="success" />
        <StatTile label="Nonaktif" value={counts.inactive} tone="danger" />
      </div>

      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari nama, lokasi, atau layanan…"
          className="min-w-[200px] flex-1"
        />
        <Dropdown
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
          options={[
            { value: "all", label: "Semua tipe" },
            { value: "swasta", label: "Swasta" },
            { value: "pemerintah", label: "Pemerintah" },
          ]}
        />
        <Dropdown
          value={categoryFilter}
          onChange={setCategoryFilter}
          searchable
          placeholder="Semua kategori"
          options={[
            { value: "", label: "Semua kategori" },
            ...HOSPITAL_CATEGORIES.map((c) => ({
              value: c,
              label: categoryShort(c),
            })),
          ]}
        />
        <Dropdown
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          options={[
            { value: "all", label: "Semua status" },
            { value: "active", label: "Aktif" },
            { value: "inactive", label: "Nonaktif" },
          ]}
        />
        <Button to="/admin/hospitals/new" icon={<Plus size={16} />}>
          Tambah Rumah Sakit
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada rumah sakit"
          description="Coba ubah kata kunci atau filter, atau tambahkan rumah sakit baru."
          action={
            <Button to="/admin/hospitals/new" size="sm" icon={<Plus size={14} />}>
              Tambah Rumah Sakit
            </Button>
          }
        />
      ) : (
        <>
          {/* tabel desktop */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background/70 text-[10px] uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rumah Sakit</th>
                  <th className="px-4 py-3 font-semibold">Tipe</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Diperbarui</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map((h) => (
                  <tr
                    key={h.id}
                    className="align-middle transition-colors hover:bg-primary-light/30"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Thumb url={h.image_url} />
                        <div className="min-w-0">
                          <Link
                            to={`/admin/hospitals/${h.id}/edit`}
                            className="font-display text-sm font-bold text-foreground hover:text-primary"
                          >
                            {h.name}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                            <MapPin size={10} className="flex-shrink-0" />
                            <span className="truncate">
                              {h.location || "-"} · {h.services.length} layanan
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <TypeBadge type={h.type} />
                    </td>
                    <td className="px-4 py-3.5 text-[12px] font-medium text-muted">
                      {h.category ? categoryShort(h.category) : "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <ActiveBadge active={h.is_active} />
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-muted">
                      {formatDateTime(h.updated_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/admin/hospitals/${h.id}/edit`}
                          aria-label={`Edit ${h.name}`}
                          title="Edit"
                          className={`${ACTION_BTN} hover:border-primary hover:bg-primary-light hover:text-primary`}
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() =>
                            setPending({ hospital: h, action: "toggle" })
                          }
                          aria-label={
                            h.is_active
                              ? `Nonaktifkan ${h.name}`
                              : `Aktifkan ${h.name}`
                          }
                          title={h.is_active ? "Nonaktifkan" : "Aktifkan"}
                          className={`${ACTION_BTN} ${
                            h.is_active
                              ? "hover:border-warning hover:bg-warning-light hover:text-warning"
                              : "hover:border-success hover:bg-success-light hover:text-success"
                          }`}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setPending({ hospital: h, action: "delete" })
                          }
                          aria-label={`Hapus ${h.name}`}
                          title="Hapus"
                          className={`${ACTION_BTN} hover:border-danger hover:bg-danger-light hover:text-danger`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* kartu mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((h) => (
              <Card key={h.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Thumb url={h.image_url} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/admin/hospitals/${h.id}/edit`}
                      className="font-display text-sm font-bold text-foreground"
                    >
                      {h.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                      <MapPin size={10} className="flex-shrink-0" />
                      <span className="truncate">
                        {h.location || "-"} · {h.services.length} layanan
                      </span>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <TypeBadge type={h.type} />
                      {h.category && (
                        <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
                          {categoryShort(h.category)}
                        </span>
                      )}
                      <ActiveBadge active={h.is_active} />
                    </div>
                    <p className="mt-2 text-[11px] text-subtle">
                      Diperbarui {formatDateTime(h.updated_at)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-light pt-3">
                  <Link
                    to={`/admin/hospitals/${h.id}/edit`}
                    aria-label={`Edit ${h.name}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-[12px] font-semibold text-foreground"
                  >
                    <Pencil size={14} />
                    Edit
                  </Link>
                  <button
                    onClick={() =>
                      setPending({ hospital: h, action: "toggle" })
                    }
                    aria-label={
                      h.is_active
                        ? `Nonaktifkan ${h.name}`
                        : `Aktifkan ${h.name}`
                    }
                    className={`flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-[12px] font-semibold ${
                      h.is_active ? "text-warning" : "text-success"
                    }`}
                  >
                    <Power size={14} />
                    {h.is_active ? "Nonaktif" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() =>
                      setPending({ hospital: h, action: "delete" })
                    }
                    aria-label={`Hapus ${h.name}`}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-[12px] font-semibold text-danger"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {!loading && filtered.length > 0 && (
        <p className="mt-3 text-[11px] text-subtle">
          {filtered.length} dari {hospitals.length} rumah sakit ditampilkan.
        </p>
      )}

      {pending &&
        (pending.action === "delete" ? (
          <ConfirmDialog
            title="Hapus rumah sakit?"
            message={`"${pending.hospital.name}" akan dihapus permanen beserta datanya. Tindakan ini tidak bisa dibatalkan.`}
            confirmLabel="Hapus"
            tone="danger"
            busy={busy}
            onConfirm={runPending}
            onCancel={() => setPending(null)}
          />
        ) : (
          <ConfirmDialog
            title={
              pending.hospital.is_active
                ? "Nonaktifkan rumah sakit?"
                : "Aktifkan rumah sakit?"
            }
            message={
              pending.hospital.is_active
                ? `"${pending.hospital.name}" akan disembunyikan dari Portal Pengguna sampai diaktifkan kembali.`
                : `"${pending.hospital.name}" akan tampil kembali di Portal Pengguna.`
            }
            confirmLabel={
              pending.hospital.is_active ? "Nonaktifkan" : "Aktifkan"
            }
            tone={pending.hospital.is_active ? "danger" : "primary"}
            busy={busy}
            onConfirm={runPending}
            onCancel={() => setPending(null)}
          />
        ))}
    </PageContainer>
  )
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "success" | "danger"
}) {
  const dot =
    tone === "success"
      ? "bg-success"
      : tone === "danger"
        ? "bg-danger"
        : "bg-subtle"
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[11px] font-semibold text-muted">{label}</span>
      </div>
      <p className="mt-1 font-display text-xl font-extrabold text-foreground">
        {value}
      </p>
    </div>
  )
}

function TypeBadge({ type }: { type: Hospital["type"] }) {
  const gov = type === "Rumah Sakit Pemerintah"
  return (
    <Badge tone={gov ? "success" : "primary"}>
      {gov ? "Pemerintah" : "Swasta"}
    </Badge>
  )
}

function Thumb({ url }: { url: string }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="flex h-12 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      {url && !broken ? (
        <img
          src={url}
          alt=""
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Building2 size={16} className="text-subtle" />
      )}
    </div>
  )
}
