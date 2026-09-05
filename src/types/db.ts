// Tipe domain + baris database yang dipakai bersama oleh Portal Pengguna dan Portal Admin.

export type HospitalType = "Rumah Sakit Swasta" | "Rumah Sakit Pemerintah"

export type Specialist = {
  name: string
  specialty: string
  schedule: string
}

export type OperationalHour = {
  day: string
  hours: string
}

export type Hospital = {
  id: string
  slug: string
  name: string
  short_name: string
  location: string
  province: string
  address: string
  phone: string
  type: HospitalType
  /** Klasifikasi; jenis rumah sakit (lihat src/lib/hospitalCategories.ts). */
  category: string
  /** Kelas Permenkes A/B/C/D; "" = belum diisi (lihat src/lib/hospitalClasses.ts). */
  hospital_class: string
  description: string
  image_url: string
  images: string[]
  is_open_24h: boolean
  closing_time: string | null
  beds: number
  established: number | null
  services: string[]
  facilities: string[]
  specialists: Specialist[]
  operational_hours: OperationalHour[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// Field yang bisa ditulis form admin. id/slug/timestamp ditangani terpisah.
export type HospitalInput = Omit<Hospital, "id" | "created_at" | "updated_at">

export type UserRole = "patient" | "admin"

export type Profile = {
  id: string
  full_name: string
  email: string
  role: UserRole
  phone: string
  location: string
  is_active: boolean
  created_at: string
}

export type ConversationStatus = "open" | "pending" | "resolved" | "closed"

export type Conversation = {
  id: string
  patient_id: string
  category: string
  subject: string
  status: ConversationStatus
  last_message: string
  last_message_role: UserRole | null
  last_message_at: string
  cleared_at: string | null
  admin_cleared_at: string | null
  created_at: string
}

/** Referensi ringan ke rumah sakit yang dilampirkan pada pesan chat ("kartu rumah sakit"). */
export type MessageHospital = {
  id: string
  slug: string
  name: string
  location: string
  image_url: string
  type: HospitalType
  is_open_24h: boolean
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: UserRole
  body: string
  hospital_id: string | null
  hospital?: MessageHospital | null
  created_at: string
}

export type SupportServiceHours = {
  start: number
  end: number
}
export type Announcement = {
  enabled: boolean
  text: string
}

export type SettingsMap = {
  support_service_hours: SupportServiceHours
  support_email: string
  announcement: Announcement
}

export type ActivityLog = {
  id: string
  actor_id: string | null
  action: string
  entity: string
  entity_id: string | null
  summary: string
  created_at: string
}
