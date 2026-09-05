import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Search,
  X,
  Check,
  Clock,
  Building2,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react"
import HospitalCard from "../components/common/HospitalCard"
import { PROVINCES } from "../lib/provinces"
import { HOSPITAL_CATEGORIES, categoryShort } from "../lib/hospitalCategories"
import { useHospitals } from "../hooks/useHospitals"
import { useBookmarks } from "../hooks/useBookmarks"
import { useContact } from "../context/ContactContext"
import {
  Alert,
  Button,
  Dropdown,
  EmptyState,
  SearchInput,
} from "../components/ui"

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <div className="h-44 bg-border-light" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-border-light" />
            <div className="h-3 w-1/2 rounded bg-border-light" />
            <div className="flex gap-1.5">
              <div className="h-5 w-16 rounded-full bg-border-light" />
              <div className="h-5 w-14 rounded-full bg-border-light" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-9 flex-1 rounded-xl bg-border-light" />
              <div className="h-9 flex-1 rounded-xl bg-border-light" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FilterChip({
  label,
  icon,
  onClear,
}: {
  label: string
  icon?: ReactNode
  onClear: () => void
}) {
  return (
    <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-primary-light py-1 pl-2.5 pr-1 text-xs font-semibold text-primary">
      {icon}
      {label}
      <button
        onClick={onClear}
        aria-label={`Hapus filter ${label}`}
        className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-primary/15"
      >
        <X size={11} />
      </button>
    </span>
  )
}

function ProvincePicker({
  value,
  counts,
  onChange,
}: {
  value: string
  counts: Record<string, number>
  onChange: (p: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const term = q.trim().toLowerCase()
  const matches = PROVINCES.filter((p) => p.toLowerCase().includes(term))
  const withData = matches.filter((p) => (counts[p] ?? 0) > 0)
  const withoutData = matches.filter((p) => (counts[p] ?? 0) === 0)

  const pick = (p: string) => {
    onChange(p)
    setOpen(false)
    setQ("")
  }

  const row = (p: string) => {
    const n = counts[p] ?? 0
    const on = value === p
    return (
      <button
        key={p}
        onClick={() => pick(p)}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition-colors ${
          on
            ? "bg-primary-light font-bold text-primary"
            : n > 0
              ? "font-medium text-foreground hover:bg-background"
              : "text-subtle hover:bg-background"
        }`}
      >
        <span className="flex-1 truncate">{p}</span>
        {n > 0 ? (
          <span className="flex-shrink-0 rounded-md bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted">
            {n}
          </span>
        ) : (
          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-subtle">
            Segera
          </span>
        )}
        {on && (
          <Check
            size={13}
            strokeWidth={3}
            className="flex-shrink-0 text-primary"
          />
        )}
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-xl border-[1.5px] bg-surface px-3.5 py-2.5 text-left transition-colors ${
          open ? "border-primary" : "border-border hover:border-primary/50"
        }`}
      >
        <MapPin size={15} className="flex-shrink-0 text-primary" />
        <span
          className={`min-w-0 flex-1 truncate text-sm font-semibold ${
            value === "all" ? "text-muted" : "text-foreground"
          }`}
        >
          {value === "all" ? "Semua Provinsi" : value}
        </span>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="pop-in absolute left-0 top-[calc(100%+8px)] z-40 w-[min(320px,calc(100vw-2rem))] origin-top-left overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border-light px-3.5 py-2.5">
            <Search size={14} className="flex-shrink-0 text-subtle" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari provinsi…"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-subtle"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto p-2">
            {!term && (
              <button
                onClick={() => pick("all")}
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] transition-colors ${
                  value === "all"
                    ? "bg-primary-light font-bold text-primary"
                    : "font-medium text-foreground hover:bg-background"
                }`}
              >
                Semua Provinsi
                {value === "all" && (
                  <Check
                    size={13}
                    strokeWidth={3}
                    className="ml-auto text-primary"
                  />
                )}
              </button>
            )}

            {withData.length > 0 && (
              <p className="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-subtle">
                Tersedia
              </p>
            )}
            {withData.map(row)}

            {withoutData.length > 0 && (
              <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-subtle">
                Segera hadir
              </p>
            )}
            {withoutData.map(row)}

            {matches.length === 0 && (
              <p className="px-3 py-6 text-center text-[12px] text-muted">
                Provinsi "{q}" tidak ditemukan.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  const navigate = useNavigate()
  const { openContact } = useContact()
  const { hospitals, loading, error } = useHospitals("active")
  const { isBookmarked, toggle } = useBookmarks()

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [province, setProvince] = useState(
    searchParams.get("provinsi") ?? "all",
  )
  const [open24hOnly, setOpen24hOnly] = useState(false)
  const [typeFilter, setTypeFilter] =
    useState<"semua" | "pemerintah" | "swasta">("semua")
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("jenis") ?? "",
  )
  const [showFilter, setShowFilter] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showFilter) return
    const onDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setShowFilter(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [showFilter])

  const setQ = (v: string) => {
    setQuery(v)
    setSearchParams(v ? { q: v } : {}, { replace: true })
  }

  const provinceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const h of hospitals)
      if (h.province) counts[h.province] = (counts[h.province] ?? 0) + 1
    return counts
  }, [hospitals])

  const provincesWithData = useMemo(
    () => PROVINCES.filter((p) => (provinceCounts[p] ?? 0) > 0),
    [provinceCounts],
  )

  const filtered = useMemo(() => {
    return hospitals
      .filter((h) => {
        const q = query.toLowerCase()
        if (
          q &&
          !h.name.toLowerCase().includes(q) &&
          !h.location.toLowerCase().includes(q) &&
          !h.category.toLowerCase().includes(q) &&
          !h.services.some((s) => s.toLowerCase().includes(q))
        )
          return false
        if (province !== "all" && h.province !== province) return false
        if (open24hOnly && !h.is_open_24h) return false
        if (typeFilter === "pemerintah" && h.type !== "Rumah Sakit Pemerintah")
          return false
        if (typeFilter === "swasta" && h.type === "Rumah Sakit Pemerintah")
          return false
        if (categoryFilter && h.category !== categoryFilter) return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [hospitals, query, province, open24hOnly, typeFilter, categoryFilter])

  const panelCount =
    (open24hOnly ? 1 : 0) +
    (typeFilter !== "semua" ? 1 : 0) +
    (categoryFilter ? 1 : 0)
  const activeCount = panelCount + (province !== "all" ? 1 : 0)
  const provinceEmpty =
    province !== "all" && (provinceCounts[province] ?? 0) === 0
  const typeLabel =
    typeFilter === "pemerintah"
      ? "Pemerintah"
      : typeFilter === "swasta"
        ? "Swasta"
        : ""
  const highlightTerms = [query.trim()].filter(Boolean)

  const resetAll = () => {
    setProvince("all")
    setOpen24hOnly(false)
    setTypeFilter("semua")
    setCategoryFilter("")
    setQ("")
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 border-b border-border-light bg-background px-4 pt-4 sm:px-7 sm:pt-5">
          <div className="flex flex-wrap items-stretch gap-2">
            {/* search */}
            <SearchInput
              value={query}
              onChange={setQ}
              placeholder="Cari rumah sakit, layanan medis…"
              className="w-full sm:w-auto sm:min-w-[220px] sm:flex-1"
            />

            {/* province */}
            <div className="min-w-0 flex-1 sm:w-[190px] sm:flex-none">
              <ProvincePicker
                value={province}
                counts={provinceCounts}
                onChange={setProvince}
              />
            </div>

            {/* filter */}
            <div className="relative flex-shrink-0" ref={filterRef}>
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`flex h-full items-center gap-2 rounded-xl border-[1.5px] bg-surface px-3.5 py-2.5 transition-colors ${
                  showFilter
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <SlidersHorizontal
                  size={15}
                  className="flex-shrink-0 text-primary"
                />
                <span className="text-sm font-semibold text-foreground">
                  Filter
                </span>
                {panelCount > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {panelCount}
                  </span>
                )}
                <ChevronDown
                  size={15}
                  className={`flex-shrink-0 text-muted transition-transform duration-200 ${
                    showFilter ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showFilter && (
                <div className="pop-in absolute right-0 top-[calc(100%+10px)] z-40 flex max-h-[70vh] w-[288px] max-w-[calc(100vw-1.5rem)] origin-top-right flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
                  <div className="flex flex-shrink-0 items-center justify-between border-b border-border-light px-3.5 py-3">
                    <p className="font-display text-sm font-bold text-foreground">
                      Filter
                    </p>
                    <button
                      onClick={() => setShowFilter(false)}
                      aria-label="Tutup filter"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-background"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto p-3.5">
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-subtle">
                        Tipe rumah sakit
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(["semua", "pemerintah", "swasta"] as const).map(
                          (t) => (
                            <button
                              key={t}
                              onClick={() => setTypeFilter(t)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                typeFilter === t
                                  ? "bg-primary text-white"
                                  : "bg-background text-muted hover:bg-primary-light hover:text-primary"
                              }`}
                            >
                              {t === "semua"
                                ? "Semua"
                                : t === "pemerintah"
                                  ? "Pemerintah"
                                  : "Swasta"}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-subtle">
                        Jenis rumah sakit
                      </p>
                      <Dropdown
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        block
                        inline
                        tone="field"
                        placeholder="Semua jenis"
                        options={[
                          { value: "", label: "Semua jenis" },
                          ...HOSPITAL_CATEGORIES.map((c) => ({
                            value: c,
                            label: categoryShort(c),
                          })),
                        ]}
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-subtle">
                        Ketersediaan
                      </p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={open24hOnly}
                        onClick={() => setOpen24hOnly((v) => !v)}
                        className="flex w-full items-center justify-between rounded-xl bg-background px-3.5 py-3 text-left transition-colors hover:bg-primary-light/60"
                      >
                        <span className="text-[13px] font-semibold text-foreground">
                          Buka 24 Jam
                        </span>
                        <span
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                            open24hOnly ? "bg-success" : "bg-border"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform ${
                              open24hOnly
                                ? "translate-x-[22px]"
                                : "translate-x-0.5"
                            }`}
                          />
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2 border-t border-border-light p-3.5">
                    <button
                      onClick={resetAll}
                      disabled={activeCount === 0}
                      className="rounded-xl px-3 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:text-danger disabled:opacity-40 disabled:hover:text-muted"
                    >
                      Reset
                    </button>
                    <Button onClick={() => setShowFilter(false)} block>
                      Lihat {filtered.length} hasil
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`scrollbar-hide flex items-center gap-1.5 overflow-x-auto pb-3.5 ${
              activeCount > 0 ? "pt-2.5" : ""
            }`}
          >
            {province !== "all" && (
              <FilterChip
                label={province}
                icon={<MapPin size={11} />}
                onClear={() => setProvince("all")}
              />
            )}
            {typeLabel && (
              <FilterChip
                label={typeLabel}
                onClear={() => setTypeFilter("semua")}
              />
            )}
            {categoryFilter && (
              <FilterChip
                label={categoryShort(categoryFilter)}
                onClear={() => setCategoryFilter("")}
              />
            )}
            {open24hOnly && (
              <FilterChip
                label="Buka 24 Jam"
                icon={<Clock size={11} />}
                onClear={() => setOpen24hOnly(false)}
              />
            )}
            {activeCount > 0 && (
              <button
                onClick={resetAll}
                className="ml-1 flex-shrink-0 whitespace-nowrap text-xs font-semibold text-danger hover:underline"
              >
                Hapus semua
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-16 pt-5 sm:px-7">
          {!loading && !error && (
            <p className="mb-3 text-xs text-muted">
              <strong className="font-bold text-foreground">
                {filtered.length}
              </strong>{" "}
              rumah sakit{province !== "all" ? ` di ${province}` : ""}
            </p>
          )}

          {error && <Alert tone="error">{error}</Alert>}
          {loading ? (
            <SkeletonGrid />
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((h) => (
                <HospitalCard
                  key={h.id}
                  hospital={h}
                  onDetail={(slug) => navigate(`/hospital/${slug}`)}
                  onContact={openContact}
                  bookmarked={isBookmarked(h.id)}
                  onToggleBookmark={toggle}
                  highlightTerms={highlightTerms}
                />
              ))}
            </div>
          ) : provinceEmpty ? (
            <div className="py-6">
              <EmptyState
                icon={<MapPin size={26} />}
                title={`Belum ada rumah sakit di ${province}`}
                description="HospitalLink sedang memperluas jangkauan ke seluruh Indonesia. Direktori untuk provinsi ini akan segera tersedia."
                action={
                  <div className="flex flex-col items-center gap-4">
                    {provincesWithData.length > 0 && (
                      <div className="flex max-w-lg flex-wrap justify-center gap-1.5">
                        {provincesWithData.map((p) => (
                          <button
                            key={p}
                            onClick={() => setProvince(p)}
                            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                          >
                            {p}{" "}
                            <span className="text-subtle">
                              ({provinceCounts[p]})
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <Button onClick={() => setProvince("all")}>
                      Lihat Semua Provinsi
                    </Button>
                  </div>
                }
              />
            </div>
          ) : (
            <div className="py-6">
              <EmptyState
                icon={<Building2 size={24} />}
                title="Tidak ada hasil"
                description="Coba ubah filter atau kata kunci pencarian."
                action={
                  <Button variant="subtle" onClick={resetAll}>
                    Reset Filter
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
