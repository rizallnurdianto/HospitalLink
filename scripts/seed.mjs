// Seed direktori rumah sakit + settings default lewat HTTPS memakai
// service_role key. TIDAK membuat akun apapun: registrasi terbuka untuk siapa
// saja (pnpm dev → /register), dan satu-satunya admin dibuat terpisah lewat
// `pnpm admin:create`. Aman dijalankan berulang. Usage: pnpm db:seed
import { createClient } from "@supabase/supabase-js"
import "./env.mjs"
import { HOSPITALS } from "./hospitals.seed.mjs"

const { VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local",
  )
  process.exit(1)
}

const admin = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

try {
  const { error: hospErr } = await admin
    .from("hospitals")
    .upsert(HOSPITALS, { onConflict: "slug" })
  if (hospErr) throw hospErr
  const { count } = await admin
    .from("hospitals")
    .select("*", { count: "exact", head: true })
  console.log(`• hospitals seeded: ${count} rows`)

  const { error: settingsErr } = await admin.from("settings").upsert(
    [
      { key: "support_service_hours", value: { start: 8, end: 21 } },
      { key: "support_email", value: "bantuan@hospitalink.test" },
      { key: "announcement", value: { enabled: false, text: "" } },
    ],
    { onConflict: "key" },
  )
  if (settingsErr) throw settingsErr
  console.log("• settings seeded")

  console.log(
    "\nSeed complete. Next: `pnpm admin:create` to provision the admin.",
  )
} catch (err) {
  console.error("\nSeed failed:", err.message ?? err)
  process.exitCode = 1
}
