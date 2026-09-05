import type { Profile } from "../types/db"

/**
 * Profil Pengguna dianggap "lengkap" setelah field onboarding terisi
 * (nama, nomor HP, provinsi). Akun admin dibuat oleh sistem dan tidak pernah
 * melalui Daftar / Setup Profile, jadi selalu dianggap lengkap.
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false
  if (profile.role === "admin") return true
  return (
    profile.full_name.trim() !== "" &&
    profile.phone.trim() !== "" &&
    profile.location.trim() !== ""
  )
}

/**
 * Tujuan pengguna yang sudah login begitu status auth selesai diperiksa:
 * - admin              -> /admin
 * - Pengguna baru      -> /setup-profile
 * - Pengguna lama      -> /beranda
 */
export function postAuthPath(profile: Profile | null): string {
  if (profile?.role === "admin") return "/admin"
  if (!isProfileComplete(profile)) return "/setup-profile"
  return "/beranda"
}
