import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useConversations } from "./useConversations"
import { useHospitals } from "./useHospitals"
import { useSettings } from "./useSettings"
import { listProfiles } from "../api/profiles"
import { CATEGORY_LABELS, isAwaitingAdminReply } from "../api/conversations"
import { dataFreshness } from "../lib/format"
import {
  announcementFirstSeen,
  readPrefs,
  readSeenAt,
  writeSeenAt,
  type NotifEntry,
} from "../lib/notifications"
import type { Profile } from "../types/db"

const DAY = 86_400_000
const ms = (iso: string) => new Date(iso).getTime()

/**
 * Feed notifikasi live sisi klien, diturunkan dari data yang sudah bisa dilihat
 * user saat ini (realtime-aware). Tidak ada tabel khusus; "unread" adalah timestamp
 * "terakhir dilihat" per-device di localStorage, dan toggle profil menentukan sumber
 * mana yang disertakan. Item per-thread tetap individual; noise directory/pengguna
 * baru/review digabung jadi satu entri.
 */
export function useNotifications() {
  const { session, profile } = useAuth()
  const userId = session?.user.id
  const isAdmin = profile?.role === "admin"

  const { conversations } = useConversations(isAdmin ? "all" : "mine")
  const { hospitals } = useHospitals(isAdmin ? "all" : "active")
  const { settings } = useSettings()

  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [bump, setBump] = useState(0)

  // pemuatan pertama di device ini: mulai feed "bersih" agar data lama
  // tidak langsung muncul sebagai unread semua.
  useEffect(() => {
    if (userId && readSeenAt(userId) === 0) writeSeenAt(userId, Date.now())
  }, [userId])

  // admin butuh nama profil + pendaftaran terbaru
  useEffect(() => {
    if (!isAdmin) return
    let active = true
    const load = () =>
      listProfiles()
        .then((rows) => {
          if (active)
            setProfiles(Object.fromEntries(rows.map((r) => [r.id, r])))
        })
        .catch(() => {})
    load()
    const id = setInterval(load, 90_000)
    const onVis = () => document.visibilityState === "visible" && load()
    document.addEventListener("visibilitychange", onVis)
    return () => {
      active = false
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [isAdmin])

  useEffect(() => {
    const onChange = () => setBump((n) => n + 1)
    window.addEventListener("hospitalink:notif-prefs", onChange)
    window.addEventListener("hospitalink:notif-seen", onChange)
    window.addEventListener("storage", onChange)
    return () => {
      window.removeEventListener("hospitalink:notif-prefs", onChange)
      window.removeEventListener("hospitalink:notif-seen", onChange)
      window.removeEventListener("storage", onChange)
    }
  }, [])

  const prefs = useMemo(
    () => (userId && profile ? readPrefs(userId, profile.role) : {}),
    [userId, profile, bump],
  )
  const seenAt = useMemo(
    () => (userId ? readSeenAt(userId) : 0),
    [userId, bump],
  )

  const announcement =
    settings?.announcement?.enabled && settings.announcement.text.trim()
      ? settings.announcement.text.trim()
      : ""
  const [annAt, setAnnAt] = useState(0)
  useEffect(() => {
    setAnnAt(
      userId && announcement ? announcementFirstSeen(userId, announcement) : 0,
    )
  }, [userId, announcement])

  const entries = useMemo<NotifEntry[]>(() => {
    if (!profile) return []
    const now = Date.now()
    const out: NotifEntry[] = []

    if (prefs.announcement && announcement && annAt > 0) {
      out.push({
        id: "announcement",
        type: "announcement",
        title: "Pengumuman HospitalLink",
        body: announcement,
        at: annAt,
      })
    }

    if (isAdmin) {
      if (prefs.newMessage) {
        for (const c of conversations) {
          if (!isAwaitingAdminReply(c)) continue
          const name = profiles[c.patient_id]?.full_name || "Pengguna"
          out.push({
            id: `msg-${c.id}`,
            type: "newMessage",
            title: `Pesan baru dari ${name}`,
            body:
              c.last_message ||
              CATEGORY_LABELS[c.category] ||
              c.subject ||
              "Bantuan",
            at: ms(c.last_message_at),
            to: `/admin/inbox/${c.id}`,
          })
        }
      }
      if (prefs.newUser) {
        const recent = Object.values(profiles)
          .filter(
            (p) => p.role === "patient" && now - ms(p.created_at) <= 7 * DAY,
          )
          .sort((a, b) => ms(b.created_at) - ms(a.created_at))
        if (recent.length > 0) {
          out.push({
            id: "new-users",
            type: "newUser",
            title:
              recent.length === 1
                ? "1 pengguna baru mendaftar"
                : `${recent.length} pengguna baru mendaftar`,
            body: recent
              .slice(0, 3)
              .map((p) => p.full_name || p.email || "Tanpa nama")
              .join(", "),
            at: ms(recent[0].created_at),
            to: "/admin/users",
          })
        }
      }
      if (prefs.hospitalReview) {
        const review = hospitals
          .filter(
            (h) => !h.is_active || dataFreshness(h.updated_at) === "stale",
          )
          .sort((a, b) => ms(b.updated_at) - ms(a.updated_at))
        if (review.length > 0) {
          out.push({
            id: "review",
            type: "hospitalReview",
            title: `${review.length} rumah sakit perlu ditinjau`,
            body: review
              .slice(0, 3)
              .map((h) => h.name)
              .join(", "),
            at: ms(review[0].updated_at),
            to: "/admin/hospitals",
          })
        }
      }
    } else {
      if (prefs.adminReply) {
        for (const c of conversations) {
          if (c.last_message_role !== "admin") continue
          out.push({
            id: `reply-${c.id}`,
            type: "adminReply",
            title: "Admin membalas pesanmu",
            body: c.last_message || "Buka percakapan Bantuan.",
            at: ms(c.last_message_at),
            to: "/help",
          })
        }
      }
      if (prefs.directory) {
        const recent = hospitals
          .filter((h) => now - ms(h.updated_at) <= 10 * DAY)
          .sort((a, b) => ms(b.updated_at) - ms(a.updated_at))
        if (recent.length > 0) {
          out.push({
            id: `directory-${ms(recent[0].updated_at)}`,
            type: "directory",
            title: `${recent.length} rumah sakit baru diperbarui`,
            body: recent
              .slice(0, 3)
              .map((h) => h.name)
              .join(", "),
            at: ms(recent[0].updated_at),
            to: "/search",
          })
        }
      }
    }

    return out.sort((a, b) => b.at - a.at).slice(0, 20)
  }, [
    profile,
    isAdmin,
    prefs,
    announcement,
    annAt,
    conversations,
    hospitals,
    profiles,
  ])

  const unreadCount = useMemo(
    () => entries.filter((e) => e.at > seenAt).length,
    [entries, seenAt],
  )

  const markAllRead = () => {
    if (userId) writeSeenAt(userId, Date.now())
  }

  return { entries, unreadCount, seenAt, markAllRead }
}
