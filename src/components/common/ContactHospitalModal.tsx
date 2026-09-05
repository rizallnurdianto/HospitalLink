import { MapPin, Clock, X, ChevronRight } from "lucide-react"
import type { Hospital } from "../../types/db"
import { whatsAppHref } from "../../lib/whatsapp"

type Props = {
  hospital: Hospital
  onClose: () => void
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

export default function ContactHospitalModal({ hospital, onClose }: Props) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.address)}`
  const waMessage = `Halo, saya ingin bertanya tentang layanan di ${hospital.name} melalui HospitalLink.`
  const waHref = whatsAppHref(hospital.phone, waMessage)
  const place = [hospital.location, hospital.province]
    .filter(Boolean)
    .join(", ")

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Kontak ${hospital.name}`}
    >
      <div
        className="w-full overflow-hidden rounded-t-3xl bg-surface shadow-xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {hospital.image_url && (
            <img
              src={hospital.image_url}
              alt={hospital.name}
              className="h-36 w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />

          <div className="absolute left-4 top-3.5">
            {hospital.is_open_24h ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-success/90 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <Clock size={12} className="flex-shrink-0" />
                Buka 24 Jam
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Clock size={12} className="flex-shrink-0" />
                Tutup {hospital.closing_time}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-3 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground transition-colors hover:bg-white"
          >
            <X size={16} />
          </button>

          <div className="absolute bottom-3.5 left-4 right-4">
            <p className="truncate font-display text-lg font-bold leading-snug text-white">
              {hospital.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/85">
              <MapPin size={11} className="flex-shrink-0" />
              {place || hospital.location}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
              <WhatsAppIcon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-white/80">
                Chat via WhatsApp
              </span>
              <span className="block font-display text-base font-bold">
                {hospital.phone}
              </span>
            </span>
            <ChevronRight size={16} className="flex-shrink-0 text-white/70" />
          </a>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-primary hover:bg-primary-light"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <MapPin size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted">
                Alamat &amp; Peta
              </span>
              <span className="block text-sm leading-snug text-foreground">
                {hospital.address}
              </span>
            </span>
            <ChevronRight size={16} className="flex-shrink-0 text-subtle" />
          </a>

          <div className="rounded-2xl border border-border p-4">
            <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-muted">
              <Clock size={14} /> Jam Operasional
            </div>
            <ul className="space-y-1.5">
              {hospital.operational_hours.map((h) => {
                const is24h = h.hours.includes("24")
                return (
                  <li
                    key={h.day}
                    className="flex items-center justify-between text-sm"
                  >
                    <span
                      className={
                        is24h ? "font-medium text-success" : "text-muted"
                      }
                    >
                      {h.day}
                    </span>
                    <span
                      className={`font-semibold ${
                        is24h ? "text-success" : "text-foreground"
                      }`}
                    >
                      {h.hours}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
