// Klasifikasi rumah sakit ("kategori"); JENIS rumah sakit. Berbeda dari
// `type` (kepemilikan: Swasta / Pemerintah). Dipakai di form admin, filter
// pencarian, dan halaman detail. Disimpan sebagai teks bebas di `hospitals.category`.

export const HOSPITAL_CATEGORIES = [
  "Rumah Sakit Umum (RSU)",
  "Rumah Sakit Ibu dan Anak (RSIA)",
  "Rumah Sakit Jantung",
  "Rumah Sakit Mata",
  "Rumah Sakit Kanker",
  "Rumah Sakit Gigi dan Mulut (RSGM)",
  "Rumah Sakit Jiwa (RSJ)",
  "Rumah Sakit Ortopedi",
  "Rumah Sakit THT-KL",
  "Rumah Sakit Syaraf",
  "Rumah Sakit Bedah",
  "Rumah Sakit Pernapasan/Paru",
] as const

export type HospitalCategory = typeof HOSPITAL_CATEGORIES[number]

export const DEFAULT_HOSPITAL_CATEGORY: HospitalCategory =
  "Rumah Sakit Umum (RSU)"

/** Label ringkas untuk card / badge. */
export const HOSPITAL_CATEGORY_SHORT: Record<string, string> = {
  "Rumah Sakit Umum (RSU)": "RSU",
  "Rumah Sakit Ibu dan Anak (RSIA)": "RSIA",
  "Rumah Sakit Jantung": "RS Jantung",
  "Rumah Sakit Mata": "RS Mata",
  "Rumah Sakit Kanker": "RS Kanker",
  "Rumah Sakit Gigi dan Mulut (RSGM)": "RSGM",
  "Rumah Sakit Jiwa (RSJ)": "RSJ",
  "Rumah Sakit Ortopedi": "RS Ortopedi",
  "Rumah Sakit THT-KL": "RS THT-KL",
  "Rumah Sakit Syaraf": "RS Syaraf",
  "Rumah Sakit Bedah": "RS Bedah",
  "Rumah Sakit Pernapasan/Paru": "RS Paru",
}

export function categoryShort(category: string): string {
  return HOSPITAL_CATEGORY_SHORT[category] || category
}
