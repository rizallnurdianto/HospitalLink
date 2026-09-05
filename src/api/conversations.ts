import { supabase } from "../lib/supabase"
import type { Conversation, ConversationStatus } from "../types/db"

export const CATEGORY_LABELS: Record<string, string> = {
  bantuan: "Bantuan",
  "cari-rs": "Cari Rumah Sakit",
  "info-rs": "Informasi RS",
  rekomendasi: "Rekomendasi RS",
  "kendala-website": "Kendala Website",
  lainnya: "Lainnya",
}

/** Status yang masih butuh perhatian admin (belum resolved/closed). */
export const OPEN_STATUSES: ConversationStatus[] = ["open", "pending"]

/**
 * True jika thread sedang menunggu balasan admin:
 *   - masih aktif (open/pending; belum resolved/closed),
 *   - belum di-clear admin melewati pesan terakhirnya, dan
 *   - pesan terakhirnya dari pengguna.
 * Jika `last_message_role` belum terisi (migrasi 0011 belum diterapkan), fallback
 * ke "ada pesan apa saja" agar sinyalnya melemah secara wajar, bukan hilang sama
 * sekali. Dipakai bersama oleh dashboard Admin dan inbox agar keduanya konsisten.
 */
export function isAwaitingAdminReply(c: Conversation): boolean {
  if (!OPEN_STATUSES.includes(c.status)) return false
  if (
    c.admin_cleared_at &&
    new Date(c.last_message_at).getTime() <=
      new Date(c.admin_cleared_at).getTime()
  )
    return false
  if (c.last_message_role != null) return c.last_message_role === "patient"
  return c.last_message.trim().length > 0
}

/** Balasan siap pakai yang bisa dimasukkan admin ke composer dari inbox. */
export const ADMIN_QUICK_REPLIES: {
  label: string
  message: string
}[] = [
  {
    label: "Sapa pengguna",
    message:
      "Halo, terima kasih sudah menghubungi HospitalLink. Ada yang bisa saya bantu?",
  },
  {
    label: "Minta lokasi",
    message:
      "Boleh sebutkan kota atau area Anda? Nanti saya bantu carikan rumah sakit terdekat.",
  },
  {
    label: "Minta detail keluhan",
    message:
      "Boleh dijelaskan keluhan atau layanan yang dibutuhkan? Saya bantu carikan rumah sakit yang sesuai.",
  },
  {
    label: "Butuh bantuan lagi?",
    message: "Apakah masih ada hal lain yang bisa saya bantu?",
  },
  {
    label: "Tutup dengan ramah",
    message:
      "Baik, senang bisa membantu. Jangan ragu menghubungi kami lagi bila butuh bantuan. Semoga lekas sehat! 🙏",
  },
]

export async function listMyConversations(
  patientId: string,
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("patient_id", patientId)
    .order("last_message_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Conversation[]
}

export async function listAllConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Conversation[]
}

const supportInflight = new Map<string, Promise<Conversation>>()

async function resolveSupportConversation(
  patientId: string,
): Promise<Conversation> {
  // Satu thread support permanen per pengguna; pakai ulang yang terbaru apapun statusnya;
  // pesan dari pengguna membuka kembali thread resolved/closed (trigger handle_new_message).
  const { data: existing, error: findErr } = await supabase
    .from("conversations")
    .select("*")
    .eq("patient_id", patientId)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (findErr) throw findErr
  if (existing) return existing as Conversation

  const { data, error } = await supabase
    .from("conversations")
    .insert({ patient_id: patientId, category: "bantuan", subject: "Bantuan" })
    .select("*")
    .single()
  if (error) throw error
  return data as Conversation
}

/**
 * Satu-satunya thread support pengguna yang sedang berjalan; pakai ulang conversation
 * non-closed terbaru apapun kategorinya, kalau tidak ada buka thread "bantuan" baru.
 * Panggilan bersamaan (mis. double-mount React StrictMode) berbagi satu request
 * yang sama agar tidak pernah membuat thread duplikat.
 */
export function getOrCreateSupportConversation(
  patientId: string,
): Promise<Conversation> {
  const cached = supportInflight.get(patientId)
  if (cached) return cached
  const p = resolveSupportConversation(patientId).finally(() =>
    supportInflight.delete(patientId),
  )
  supportInflight.set(patientId, p)
  return p
}

export async function setConversationStatus(
  id: string,
  status: ConversationStatus,
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ status })
    .eq("id", id)
  if (error) throw error
}

/**
 * Membersihkan tampilan salah satu sisi pada thread; menyembunyikan pesan lama
 * hanya dari sisi itu; conversation + pesan tetap ada untuk sisi lainnya.
 * Mengembalikan timestamp cutoff yang tersimpan.
 *   side "patient" → conversations.cleared_at   (halaman Bantuan)
 *   side "admin"   → conversations.admin_cleared_at   (inbox admin)
 */
export async function clearConversationView(
  id: string,
  side: "patient" | "admin",
): Promise<string> {
  const column = side === "admin" ? "admin_cleared_at" : "cleared_at"
  const at = new Date().toISOString()
  const { data, error } = await supabase
    .from("conversations")
    .update({ [column]: at })
    .eq("id", id)
    .select(column)
    .single()
  if (error) throw error
  return (data as Record<string, string>)[column]
}
