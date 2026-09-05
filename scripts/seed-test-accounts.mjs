// Menyediakan akun tetap yang dipakai login oleh pengecekan otomatis
// (`pnpm db:e2e`, `pnpm test:ui`, `pnpm test:landing`). BUKAN bagian dari
// `pnpm db:seed` — jalankan hanya di proyek Supabase dev/test khusus.
//
// Karena migrasi 0015 hanya izinkan satu admin, skrip ini menaikkan admin
// test dan menurunkan baris admin lain yang ditemukan. Usage: pnpm db:seed:test
import { createClient } from "@supabase/supabase-js"
import "./env.mjs"

const {
  VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TEST_ADMIN_EMAIL = "admin@hospitalink.test",
  TEST_ADMIN_PASSWORD = "Admin12345!",
  TEST_PATIENT_EMAIL = "pasien@hospitalink.test",
  TEST_PATIENT_PASSWORD = "Pasien12345!",
} = process.env

if (!VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local",
  )
  process.exit(1)
}

const admin = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureUser(email, password, meta) {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (listErr) throw listErr
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )
  if (existing) {
    console.log(`• user ${email} already exists (${existing.id})`)
    return existing.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  })
  if (error) throw error
  console.log(`• created user ${email} (${data.user.id})`)
  return data.user.id
}

try {
  const adminId = await ensureUser(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, {
    full_name: "Admin HospitalLink",
  })
  const patientId = await ensureUser(
    TEST_PATIENT_EMAIL,
    TEST_PATIENT_PASSWORD,
    {
      full_name: "Budi Santoso",
      location: "Banten",
      phone: "+62 812-3456-7890",
    },
  )

  // Jaga agar index single-admin tetap terpenuhi: turunkan admin lain dulu.
  const { error: demoteErr } = await admin
    .from("profiles")
    .update({ role: "patient" })
    .eq("role", "admin")
    .neq("id", adminId)
  if (demoteErr) throw demoteErr

  const { error: adminProfileErr } = await admin
    .from("profiles")
    .upsert({ id: adminId, full_name: "Admin HospitalLink", role: "admin" })
  if (adminProfileErr) throw adminProfileErr

  const { error: patientProfileErr } = await admin.from("profiles").upsert({
    id: patientId,
    full_name: "Budi Santoso",
    role: "patient",
    location: "Banten",
    phone: "+62 812-3456-7890",
  })
  if (patientProfileErr) throw patientProfileErr

  console.log("\nTest accounts ready:")
  console.log(`  Admin  : ${TEST_ADMIN_EMAIL} / ${TEST_ADMIN_PASSWORD}`)
  console.log(`  Patient: ${TEST_PATIENT_EMAIL} / ${TEST_PATIENT_PASSWORD}`)
} catch (err) {
  console.error("\nseed-test-accounts failed:", err.message ?? err)
  process.exitCode = 1
}
