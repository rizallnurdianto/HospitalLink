import { supabase } from "../lib/supabase"

export async function listMyBookmarkIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("hospital_id")
    .eq("user_id", userId)
  if (error) throw error
  return (data ?? []).map((r) => r.hospital_id)
}

export async function addBookmark(
  userId: string,
  hospitalId: string,
): Promise<void> {
  const { error } = await supabase
    .from("bookmarks")
    .insert({ user_id: userId, hospital_id: hospitalId })
  if (error && error.code !== "23505") throw error // ignore duplicate
}

export async function removeBookmark(
  userId: string,
  hospitalId: string,
): Promise<void> {
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("hospital_id", hospitalId)
  if (error) throw error
}
