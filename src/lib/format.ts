const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" })

const DIVISIONS: {
  amount: number
  unit: Intl.RelativeTimeFormatUnit
}[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
]

/** "3 menit yang lalu", "kemarin", "baru saja", dari timestamp ISO. */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "-"
  const date = new Date(iso)
  let duration = (date.getTime() - Date.now()) / 1000
  if (Math.abs(duration) < 45) return "baru saja"
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return "-"
}

/** Tanggal saja, mis. "27 Agu 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Kunci hari kalender lokal untuk mengelompokkan pesan chat ("Mon Aug 25 2026"). */
export function chatDayKey(iso: string): string {
  return new Date(iso).toDateString()
}

/** Pemisah hari gaya WhatsApp: "Hari ini" / "Kemarin" / nama hari / tanggal lengkap. */
export function chatDateLabel(iso: string): string {
  const d = new Date(iso)
  const day0 = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day0(new Date()) - day0(d)) / 86_400_000)
  if (diff === 0) return "Hari ini"
  if (diff === 1) return "Kemarin"
  if (diff > 1 && diff < 7)
    return d.toLocaleDateString("id-ID", { weekday: "long" })
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return ""
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Kategori kebaruan data dari updated_at rumah sakit; dasar untuk "status data". */
export function dataFreshness(iso: string): "fresh" | "aging" | "stale" {
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000
  if (days <= 30) return "fresh"
  if (days <= 90) return "aging"
  return "stale"
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
