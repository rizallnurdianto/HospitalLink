// Hapus akun demo lama dari proyek yang di-seed sebelum akun dihapus dari
// `pnpm db:seed`. Menghapus user auth otomatis menghapus profile, bookmarks,
// conversations, dan messages terkait (ON DELETE CASCADE).
//
//   Timpa daftarnya dengan DEMO_EMAILS="a@x.test,b@y.test". Usage: pnpm demo:purge
import { createClient } from "@supabase/supabase-js"
import "./env.mjs"

const { VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_EMAILS } =
  process.env

if (!VITE_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local",
  )
  process.exit(1)
}

const targets = (
  DEMO_EMAILS ?? "admin@hospitalink.test,pasien@hospitalink.test"
)
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

const admin = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

try {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (listErr) throw listErr

  let removed = 0
  for (const email of targets) {
    const user = list.users.find((u) => u.email?.toLowerCase() === email)
    if (!user) {
      console.log(`• ${email} — not found, skipped`)
      continue
    }
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
    console.log(`• deleted ${email} (${user.id})`)
    removed++
  }

  console.log(`\nDone — ${removed} demo account(s) removed.`)
} catch (err) {
  console.error("\ndemo:purge failed:", err.message ?? err)
  process.exitCode = 1
}
