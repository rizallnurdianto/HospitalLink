import type { UserRole } from "../types/db"

export type NotifPrefKey = string

export type NotifItem = {
  key: NotifPrefKey
  label: string
  description: string
  default: boolean
}

/** Daftar toggle yang tampil di tab "Notifikasi" profil; berbeda per role. */
export const NOTIF_ITEMS: Record<UserRole, NotifItem[]> = {
  patient: [
    {
      key: "adminReply",
      label: "Balasan dari Admin",
      description: "Beri tahu saya saat Admin membalas percakapan Bantuan.",
      default: true,
    },
    {
      key: "directory",
      label: "Rumah sakit baru & pembaruan",
      description:
        "Info saat ada rumah sakit baru atau perubahan data pada direktori.",
      default: true,
    },
    {
      key: "announcement",
      label: "Pengumuman aplikasi",
      description: "Kabar penting seputar layanan HospitalLink.",
      default: true,
    },
  ],
  admin: [
    {
      key: "newMessage",
      label: "Pesan pengguna baru",
      description: "Beri tahu saat ada pesan Bantuan baru yang perlu dibalas.",
      default: true,
    },
    {
      key: "newUser",
      label: "Pendaftaran pengguna baru",
      description: "Info setiap ada akun pengguna baru yang mendaftar.",
      default: false,
    },
    {
      key: "hospitalReview",
      label: "Data rumah sakit perlu ditinjau",
      description:
        "Ingatkan saat ada data rumah sakit yang lama tidak diperbarui.",
      default: true,
    },
  ],
}

const prefsKey = (userId: string) => `hospitalink:notif-prefs:${userId}`
const seenKey = (userId: string) => `hospitalink:notif-seen:${userId}`

export function defaultPrefs(role: UserRole): Record<string, boolean> {
  const d: Record<string, boolean> = {}
  for (const i of NOTIF_ITEMS[role]) d[i.key] = i.default
  return d
}

export function readPrefs(
  userId: string,
  role: UserRole,
): Record<string, boolean> {
  const defaults = defaultPrefs(role)
  try {
    const raw = localStorage.getItem(prefsKey(userId))
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export function writePrefs(userId: string, prefs: Record<string, boolean>) {
  try {
    localStorage.setItem(prefsKey(userId), JSON.stringify(prefs))
  } catch {
    /* storage tidak tersedia */
  }
  // agar notification bell yang sedang terbuka di tab yang sama langsung bereaksi
  window.dispatchEvent(new Event("hospitalink:notif-prefs"))
}

/**
 * Epoch ms saat viewer ini pertama kali melihat teks pengumuman SAAT INI.
 * Reset setiap kali teksnya berubah, jadi pengumuman baru terbaca sebagai
 * belum dibaca sampai viewer menandai notifikasi sudah dibaca.
 */
export function announcementFirstSeen(userId: string, text: string): number {
  const key = `hospitalink:notif-ann:${userId}`
  try {
    const raw = localStorage.getItem(key)
    const saved = raw ? JSON.parse(raw) as { text: string; at: number } : null
    if (saved && saved.text === text) return saved.at
    const at = Date.now()
    localStorage.setItem(key, JSON.stringify({ text, at }))
    return at
  } catch {
    return Date.now()
  }
}

export function readSeenAt(userId: string): number {
  try {
    const raw = localStorage.getItem(seenKey(userId))
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

export function writeSeenAt(userId: string, ms: number) {
  try {
    localStorage.setItem(seenKey(userId), String(ms))
  } catch {
    /* storage tidak tersedia */
  }
  window.dispatchEvent(new Event("hospitalink:notif-seen"))
}

/* --------------------------- tipe feed runtime --------------------------- */

export type NotifType = "adminReply" | "directory" | "announcement" | "newMessage" | "newUser" | "hospitalReview"

export type NotifEntry = {
  id: string
  type: NotifType
  title: string
  body: string
  /** epoch ms; dipakai untuk sorting + perbandingan belum dibaca */
  at: number
  /** path router yang dibuka saat diklik, jika ada */
  to?: string
}
