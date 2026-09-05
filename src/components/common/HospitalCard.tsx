import { useEffect, useState } from "react"
import { MapPin, Clock, Bookmark, Building2 } from "lucide-react"
import { categoryShort } from "../../lib/hospitalCategories"
import type { Hospital } from "../../types/db"

type Props = {
  hospital: Hospital
  onDetail: (slug: string) => void
  onContact: (hospital: Hospital) => void
  bookmarked?: boolean
  onToggleBookmark?: (id: string) => void
  compact?: boolean
  /** Kata kunci dari pencarian / filter layanan aktif; layanan yang cocok ditampilkan lebih dulu. */
  highlightTerms?: string[]
}

export default function HospitalCard({
  hospital,
  onDetail,
  onContact,
  bookmarked = false,
  onToggleBookmark,
  compact = false,
  highlightTerms,
}: Props) {
  const place = [hospital.location, hospital.province]
    .filter(Boolean)
    .join(", ")
  const typeShort =
    hospital.type === "Rumah Sakit Pemerintah" ? "Pemerintah" : "Swasta"
  const kindShort = hospital.category
    ? categoryShort(hospital.category)
    : typeShort

  const orderedServices = (() => {
    const terms = (highlightTerms ?? [])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    if (terms.length === 0) return hospital.services
    const relevant = (s: string) =>
      terms.some((t) => s.toLowerCase().includes(t)) ? 0 : 1
    return [...hospital.services].sort((a, b) => relevant(a) - relevant(b))
  })()

  const [imgBroken, setImgBroken] = useState(false)
  useEffect(() => setImgBroken(false), [hospital.image_url])
  const showPlaceholder = !hospital.image_url || imgBroken

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      {/* media */}
      <div
        className={`relative ${
          compact ? "h-36" : "h-44"
        } flex-shrink-0 overflow-hidden bg-border`}
      >
        {showPlaceholder ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-primary-light px-5 transition-transform duration-500 group-hover:scale-105">
            <Building2
              size={compact ? 26 : 32}
              strokeWidth={1.5}
              className="text-primary/40"
            />
            <span className="line-clamp-2 text-center font-display text-[13px] font-bold leading-snug text-primary/70">
              {hospital.short_name || hospital.name}
            </span>
          </div>
        ) : (
          <img
            src={hospital.image_url}
            alt={hospital.name}
            onError={() => setImgBroken(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {!showPlaceholder && (
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent" />
        )}

        {onToggleBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleBookmark(hospital.id)
            }}
            aria-label={
              bookmarked ? "Hapus dari tersimpan" : "Simpan rumah sakit"
            }
            title={bookmarked ? "Hapus dari tersimpan" : "Simpan rumah sakit"}
            className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all ${
              bookmarked
                ? "bg-primary text-white"
                : "bg-white/95 text-muted opacity-100 hover:text-primary sm:opacity-0 sm:group-hover:opacity-100"
            }`}
          >
            <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} />
          </button>
        )}

        <div className="absolute inset-x-3 bottom-2.5 flex">
          {hospital.is_open_24h ? (
            <span className="flex items-center gap-1 rounded-lg bg-success px-2 py-1 text-xs font-bold text-white shadow-sm">
              <Clock size={11} /> Buka 24 Jam
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-lg bg-foreground/70 px-2 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              <Clock size={11} />
              {hospital.closing_time
                ? `Tutup ${hospital.closing_time}`
                : "Cek jam buka"}
            </span>
          )}
        </div>
      </div>

      {/* konten */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onDetail(hospital.slug)}
            className="block text-left font-display text-[15px] font-bold leading-snug text-foreground transition-colors hover:text-primary"
          >
            <span className="line-clamp-2">{hospital.name}</span>
          </button>
          <div className="flex items-center gap-1 text-xs text-muted">
            <MapPin size={11} className="flex-shrink-0 text-subtle" />
            <span className="truncate">{place || "-"}</span>
            <span className="flex-shrink-0 text-subtle">·</span>
            <span className="flex-shrink-0 font-medium">{kindShort}</span>
            {hospital.hospital_class && (
              <>
                <span className="flex-shrink-0 text-subtle">·</span>
                <span className="flex-shrink-0 font-medium">
                  Kelas {hospital.hospital_class}
                </span>
              </>
            )}
          </div>
        </div>

        {orderedServices.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {orderedServices.slice(0, 2).map((s) => (
              <span
                key={s}
                className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {s}
              </span>
            ))}
            {orderedServices.length > 2 && (
              <span className="text-[11px] font-medium text-subtle">
                +{orderedServices.length - 2} lainnya
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex gap-2 border-t border-border-light pt-3">
          <button
            onClick={() => onDetail(hospital.slug)}
            className="flex-1 rounded-xl border-[1.5px] border-border py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
          >
            Lihat Detail
          </button>
          <button
            onClick={() => onContact(hospital)}
            className="flex-shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            Hubungi
          </button>
        </div>
      </div>
    </div>
  )
}
