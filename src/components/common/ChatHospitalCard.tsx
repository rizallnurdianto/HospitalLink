import { Link } from "react-router-dom"
import { MapPin, CheckCircle2, ArrowRight, Building2 } from "lucide-react"
import type { MessageHospital } from "../../types/db"

type Props = {
  hospital: MessageHospital
  /** Inbox Admin menampilkan preview tanpa navigasi; chat pengguna tertaut ke halaman detail. */
  interactive?: boolean
}

export default function ChatHospitalCard({
  hospital,
  interactive = true,
}: Props) {
  const inner = (
    <div className="w-[240px] overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative h-24 bg-background">
        {hospital.image_url ? (
          <img
            src={hospital.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 size={18} className="text-subtle" />
          </div>
        )}
        {hospital.is_open_24h && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-success/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <CheckCircle2 size={9} /> 24 Jam
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-display text-[12px] font-bold leading-snug text-foreground">
          {hospital.name}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
          <MapPin size={10} />
          {hospital.location}
        </p>
        {interactive && (
          <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
            Lihat detail <ArrowRight size={11} />
          </span>
        )}
      </div>
    </div>
  )

  if (!interactive) return inner

  return (
    <Link
      to={`/hospital/${hospital.slug}`}
      className="block transition-transform hover:-translate-y-0.5"
    >
      {inner}
    </Link>
  )
}
