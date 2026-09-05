// Smoke test browser: menjalankan UI asli (admin + pasien) di dev server.
// Usage: BASE=http://localhost:5174 node scripts/ui-smoke.mjs
import { chromium } from "playwright-core"
import { createClient } from "@supabase/supabase-js"
import "./env.mjs"

const BASE = process.env.BASE ?? "http://localhost:5173"
const OUT =
  process.env.OUT ??
  "C:/Users/rizall/AppData/Local/Temp/claude/c--Users-rizall-Documents-HospitalLink/ca8a6e96-89f0-4e73-bdc2-cb60341224f7/scratchpad"
const A = {
  email: process.env.TEST_ADMIN_EMAIL ?? "admin@hospitalink.test",
  password: process.env.TEST_ADMIN_PASSWORD ?? "Admin12345!",
}
const P = {
  email: process.env.TEST_PATIENT_EMAIL ?? "pasien@hospitalink.test",
  password: process.env.TEST_PATIENT_PASSWORD ?? "Pasien12345!",
}
const service = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)
const SLUG = "rs-browser-smoke"

let step = 0
const shot = async (pg, name) => {
  await pg.screenshot({
    path: `${OUT}/ui-${String(++step).padStart(2, "0")}-${name}.png`,
    fullPage: true,
  })
  console.log(`  📸 ui-${String(step).padStart(2, "0")}-${name}.png`)
}
const errs = []

async function login(page, creds) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
  await page.fill('input[type="email"]', creds.email)
  await page.fill('input[type="password"]', creds.password)
  await page.click('button[type="submit"]')
}

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--no-sandbox"],
})
try {
  await service.from("hospitals").delete().eq("slug", SLUG)

  // ---- ADMIN ----
  const admin = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  const ap = await admin.newPage()
  ap.on(
    "console",
    (m) => m.type() === "error" && errs.push(`[admin] ${m.text()}`),
  )

  console.log("[admin] login + Data Rumah Sakit")
  await login(ap, A)
  await ap.waitForURL("**/admin", { timeout: 20000 })
  console.log("  ✓ admin diarahkan ke /admin setelah login")
  await ap.goto(`${BASE}/admin/hospitals`, { waitUntil: "networkidle" })
  await ap.waitForSelector("text=RS Premier Bintaro", { timeout: 15000 })
  const rowCount = await ap.locator("table tbody tr").count()
  console.log(`  seeded hospitals in table: ${rowCount}`)
  await shot(ap, "admin-hospitals")

  console.log("[admin] tambah rumah sakit")
  await ap.click('a:has-text("Tambah Rumah Sakit")')
  await ap.waitForSelector('label:has-text("Nama Rumah Sakit")')
  await ap.fill('label:has-text("Nama Rumah Sakit") input', "RS Browser Smoke")
  await ap.fill(
    'label:has-text("Deskripsi") textarea',
    "Rumah sakit uji coba dari browser smoke test.",
  )
  await ap.fill('label:has-text("Kota / Wilayah") input', "Jakarta")
  const svc = ap.locator('input[placeholder="mis. IGD 24 Jam"]')
  await svc.fill("IGD 24 Jam")
  await svc.press("Enter")
  await ap.click('button:has-text("Simpan Rumah Sakit")')
  await ap.waitForURL("**/admin/hospitals", { timeout: 15000 })
  await ap.waitForSelector("text=RS Browser Smoke", { timeout: 15000 })
  console.log("  ✓ RS baru muncul di tabel admin")
  await shot(ap, "admin-after-create")

  // ---- PASIEN ----
  const pt = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  const pp = await pt.newPage()
  pp.on(
    "console",
    (m) => m.type() === "error" && errs.push(`[patient] ${m.text()}`),
  )

  console.log("[patient] login + cari RS baru")
  await login(pp, P)
  await pp.waitForURL((u) => !u.pathname.startsWith("/login"), {
    timeout: 15000,
  })
  await pp.goto(`${BASE}/search`, { waitUntil: "networkidle" })
  await pp.waitForSelector("text=RS Browser Smoke", { timeout: 15000 })
  console.log("  ✓ pasien melihat RS baru di /search")
  await shot(pp, "patient-search")

  console.log("[patient] chat di menu Bantuan")
  await pp.goto(`${BASE}/help`, { waitUntil: "networkidle" })
  await pp.waitForSelector('input[placeholder*="Tulis pesanmu"]', {
    timeout: 15000,
  })
  await pp.waitForTimeout(1200)
  // quick action masih tampil untuk thread baru; kalau tidak, langsung ketik
  const qa = pp.locator('button:has-text("Minta rekomendasi")')
  if (await qa.count()) await qa.click()
  await pp.waitForTimeout(800)
  await pp.fill(
    'input[placeholder*="Tulis pesanmu"]',
    "Halo admin, ini pesan dari browser smoke test.",
  )
  await pp.press('input[placeholder*="Tulis pesanmu"]', "Enter")
  await pp.waitForSelector("text=browser smoke test", { timeout: 15000 })
  await shot(pp, "patient-chat")

  // ---- INBOX ADMIN ----
  console.log("[admin] balas di inbox + kirim kartu RS")
  await ap.goto(`${BASE}/admin/inbox`, { waitUntil: "networkidle" })
  await ap.waitForSelector("text=Budi Santoso", { timeout: 15000 })
  await ap.click('button:has-text("Budi Santoso")')
  await ap.waitForSelector('input[placeholder*="Tulis balasan"]', {
    timeout: 15000,
  })
  await ap.fill(
    'input[placeholder*="Tulis balasan"]',
    "Halo, pesan Anda kami terima. Sedang dicek.",
  )
  await ap.press('input[placeholder*="Tulis balasan"]', "Enter")
  await ap.waitForSelector("text=kami terima", { timeout: 15000 })
  // lampirkan kartu rumah sakit
  await ap.click('button[aria-label="Kirim kartu rumah sakit"]')
  await ap.waitForSelector('input[placeholder*="Cari rumah sakit untuk"]', {
    timeout: 8000,
  })
  await ap.fill(
    'input[placeholder*="Cari rumah sakit untuk"]',
    "Premier Bintaro",
  )
  await ap.waitForTimeout(400)
  await ap.locator('.absolute button:has-text("RS Premier Bintaro")').click()
  await ap.waitForTimeout(300)
  await ap.click('button[aria-label="Kirim balasan"]')
  await ap.waitForTimeout(1000)
  console.log("  ✓ admin membalas & mengirim kartu rumah sakit")
  await shot(ap, "admin-inbox")

  // pasien melihat balasan + kartu secara realtime; kartu tertaut ke detail RS
  console.log("[patient] cek balasan + kartu RS masuk realtime")
  await pp.waitForSelector("text=kami terima", { timeout: 20000 })
  await pp.waitForSelector('a[href="/hospital/rs-premier-bintaro"]', {
    timeout: 20000,
  })
  await shot(pp, "patient-help-reply")
  await pp.click('a[href="/hospital/rs-premier-bintaro"]')
  await pp.waitForURL("**/hospital/rs-premier-bintaro", { timeout: 10000 })
  console.log("  ✓ pasien menerima balasan + kartu RS (klik → detail RS)")

  console.log(`\nconsole errors: ${errs.length}`)
  errs.forEach((e) => console.log("  " + e))

  // bersih-bersih: hapus pesan uji saja, thread support pasien tetap dipertahankan
  await service.from("hospitals").delete().eq("slug", SLUG)
  await service
    .from("activity_log")
    .delete()
    .ilike("summary", "%Browser Smoke%")
  await service.from("messages").delete().ilike("body", "%browser smoke test%")
  await service
    .from("messages")
    .delete()
    .ilike("body", "%pesan Anda kami terima%")
  const { data: pb } = await service
    .from("hospitals")
    .select("id")
    .eq("slug", "rs-premier-bintaro")
    .maybeSingle()
  if (pb)
    await service
      .from("messages")
      .delete()
      .eq("body", "")
      .eq("hospital_id", pb.id)

  console.log(
    errs.length === 0
      ? "\n✅ UI SMOKE PASSED"
      : "\n⚠️ UI rendered but console errors present",
  )
  process.exit(errs.length === 0 ? 0 : 1)
} catch (e) {
  console.error("\nUI smoke failed:", e.message)
  await service.from("hospitals").delete().eq("slug", SLUG)
  await service
    .from("activity_log")
    .delete()
    .ilike("summary", "%Browser Smoke%")
  process.exit(1)
} finally {
  await browser.close()
}
