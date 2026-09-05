// Membuat SATU-SATUNYA akun admin (lihat migrasi 0015_single_admin.sql).
// Jalankan sekali per proyek. Idempoten untuk email yang sama.
//
//   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD wajib diisi di .env.local — tidak
//   ada default demo. Usage: pnpm admin:create
import { createClient } from "@supabase/supabase-js"
import "./env.mjs"

const {
  VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
} = process.env

if (!VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local",
  )
  process.exit(1)
}
if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  console.error(
    "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local first (real values, no demo).",
  )
  process.exit(1)
}

const email = SEED_ADMIN_EMAIL.toLowerCase()
const admin = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

try {
  // Tolak buat admin kedua — index DB juga akan menolaknya.
  const { data: admins, error: adminErr } = await admin
    .from("profiles")
    .select("id, email")
    .eq("role", "admin")
  if (adminErr) throw adminErr

  const other = admins?.find((a) => (a.email ?? "").toLowerCase() !== email)
  if (other) {
    console.error(
      `An admin already exists (${other.email || other.id}). Only one is allowed.\n` +
        "Demote it first if you want to switch:\n" +
        `  update public.profiles set role = 'patient' where id = '${other.id}';`,
    )
    process.exit(1)
  }

  // Cari atau buat user auth-nya.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (listErr) throw listErr
  let user = list.users.find((u) => u.email?.toLowerCase() === email)

  if (user) {
    console.log(`• user ${email} already exists (${user.id})`)
    await admin.auth.admin.updateUserById(user.id, {
      password: SEED_ADMIN_PASSWORD,
    })
    console.log("• password reset to SEED_ADMIN_PASSWORD")
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SEED_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Administrator" },
    })
    if (error) throw error
    user = data.user
    console.log(`• created user ${email} (${user.id})`)
  }

  // Naikkan role (baris profile sudah dibuat oleh trigger on_auth_user_created).
  const { error: roleErr } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id)
  if (roleErr) throw roleErr

  console.log(`\nAdmin ready: ${email}`)
} catch (err) {
  console.error("\nadmin:create failed:", err.message ?? err)
  process.exitCode = 1
}
