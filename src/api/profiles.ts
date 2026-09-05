import { supabase } from "../lib/supabase"
import type { Profile } from "../types/db"

export async function updateMyProfile(
  id: string,
  patch: Pick<Profile, "full_name" | "phone" | "location">,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data as Profile
}

export async function updateMyPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

/**
 * Menghapus permanen akun milik user yang sedang login (auth.users + semua data
 * terkait ikut terhapus lewat cascade). Menjalankan RPC `delete_own_account` lalu
 * membersihkan sesi lokal. Tidak berlaku untuk admin (RPC menolaknya).
 */
export async function deleteOwnAccount(): Promise<void> {
  const { error } = await supabase.rpc("delete_own_account")
  if (error) throw new Error(error.message)
  await supabase.auth.signOut()
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function setProfileActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id)
  if (error) throw error
}
