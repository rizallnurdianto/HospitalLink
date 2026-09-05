import { supabase } from "../lib/supabase"
import { slugify } from "../lib/format"
import type { Hospital, HospitalInput } from "../types/db"

const COLUMNS =
  "id, slug, name, short_name, location, province, address, phone, type, category, hospital_class, description, image_url, images, is_open_24h, closing_time, beds, established, services, facilities, specialists, operational_hours, is_active, created_at, updated_at"

/** Portal Pengguna; hanya rumah sakit aktif (RLS juga menegakkan ini). */
export async function listActiveHospitals(): Promise<Hospital[]> {
  const { data, error } = await supabase
    .from("hospitals")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("name")
  if (error) throw error
  return (data ?? []) as Hospital[]
}

/** Portal Admin; semua rumah sakit, aktif maupun tidak. */
export async function listAllHospitals(): Promise<Hospital[]> {
  const { data, error } = await supabase
    .from("hospitals")
    .select(COLUMNS)
    .order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Hospital[]
}

export async function getHospitalBySlug(
  slug: string,
): Promise<Hospital | null> {
  const { data, error } = await supabase
    .from("hospitals")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle()
  if (error) throw error
  return data as Hospital ?? null
}

export async function getHospitalById(id: string): Promise<Hospital | null> {
  const { data, error } = await supabase
    .from("hospitals")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as Hospital ?? null
}

export async function createHospital(input: HospitalInput): Promise<Hospital> {
  const slug = input.slug?.trim() || slugify(input.name)
  const { data, error } = await supabase
    .from("hospitals")
    .insert({ ...input, slug })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data as Hospital
}

export async function updateHospital(
  id: string,
  input: Partial<HospitalInput>,
): Promise<Hospital> {
  const { data, error } = await supabase
    .from("hospitals")
    .update(input)
    .eq("id", id)
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data as Hospital
}

export async function setHospitalActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("hospitals")
    .update({ is_active: isActive })
    .eq("id", id)
  if (error) throw error
}

export async function deleteHospital(id: string): Promise<void> {
  const { error } = await supabase.from("hospitals").delete().eq("id", id)
  if (error) throw error
}

const IMAGE_BUCKET = "hospital-images"

/** Upload satu gambar rumah sakit ke Storage; mengembalikan URL publiknya. */
export async function uploadHospitalImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false })
  if (error) throw error
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Upload beberapa gambar rumah sakit; mengembalikan URL publiknya sesuai urutan. */
export async function uploadHospitalImages(files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) urls.push(await uploadHospitalImage(file))
  return urls
}

export async function slugExists(
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  let query = supabase.from("hospitals").select("id").eq("slug", slug)
  if (exceptId) query = query.neq("id", exceptId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).length > 0
}
