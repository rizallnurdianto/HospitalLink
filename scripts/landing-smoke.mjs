import { chromium } from "playwright-core"
import "./env.mjs"

const BASE = process.env.BASE ?? "http://localhost:5173"
const OUT =
  process.env.OUT ??
  "C:/Users/rizall/AppData/Local/Temp/claude/c--Users-rizall-Documents-HospitalLink/ca8a6e96-89f0-4e73-bdc2-cb60341224f7/scratchpad"
const P = {
  email: process.env.TEST_PATIENT_EMAIL ?? "pasien@hospitalink.test",
  password: process.env.TEST_PATIENT_PASSWORD ?? "Pasien12345!",
}

const errs = []
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--no-sandbox"],
})
try {
  // Landing di desktop
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  })
  const pg = await ctx.newPage()
  pg.on("console", (m) => m.type() === "error" && errs.push(m.text()))
  pg.on("response", (r) => r.status() === 404 && errs.push(`404 ${r.url()}`))

  await pg.goto(`${BASE}/`, { waitUntil: "networkidle" })
  await pg.waitForSelector("text=tanpa menebak-nebak", { timeout: 15000 })
  await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await pg.waitForTimeout(800)
  await pg.evaluate(() => window.scrollTo(0, 0))
  await pg.waitForTimeout(400)
  await pg.screenshot({ path: `${OUT}/landing-01-desktop.png`, fullPage: true })
  console.log("📸 landing-01-desktop.png")

  // navigasi anchor berfungsi
  await pg.click('header a[href="#fitur"]')
  await pg.waitForTimeout(700)
  const featVisible = await pg.locator("#fitur").isVisible()
  console.log(`  anchor #fitur reachable: ${featVisible}`)

  // tamu: "Mulai Sekarang" -> register (pengguna baru lanjut ke setup profil)
  await pg.click('header a:has-text("Mulai Sekarang")')
  await pg.waitForURL("**/register", { timeout: 10000 })
  console.log("  ✓ CTA 'Mulai Sekarang' (guest) -> /register")

  // "Masuk" -> login; akun lama dengan profil lengkap lewati setup
  await pg.goto(`${BASE}/`, { waitUntil: "networkidle" })
  await pg.click('header a:has-text("Masuk")')
  await pg.waitForURL("**/login", { timeout: 10000 })
  console.log("  ✓ CTA 'Masuk' (guest) -> /login")

  await pg.fill('input[type="email"]', P.email)
  await pg.fill('input[type="password"]', P.password)
  await pg.click('button[type="submit"]')
  await pg.waitForURL("**/beranda", { timeout: 15000 })
  console.log("  ✓ akun lama masuk langsung ke /beranda (tanpa setup profil)")

  // sudah login mengunjungi / -> dialihkan ke /beranda (landing disembunyikan)
  await pg.goto(`${BASE}/`, { waitUntil: "networkidle" })
  await pg.waitForURL("**/beranda", { timeout: 10000 })
  console.log("  ✓ signed-in user at / -> /beranda (landing hidden)")

  // Landing di mobile
  const m = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: "reduce",
  })
  const mp = await m.newPage()
  await mp.goto(`${BASE}/`, { waitUntil: "networkidle" })
  await mp.waitForSelector("text=tanpa menebak-nebak", { timeout: 15000 })
  await mp.screenshot({ path: `${OUT}/landing-02-mobile.png`, fullPage: true })
  console.log("📸 landing-02-mobile.png")
  // toggle menu mobile
  await mp.click('header button[aria-label="Menu"]')
  await mp.waitForTimeout(300)
  await mp.screenshot({ path: `${OUT}/landing-03-mobile-menu.png` })
  console.log("📸 landing-03-mobile-menu.png")

  console.log(`\nconsole errors / 404s: ${errs.length}`)
  errs.forEach((e) => console.log("  " + e))
  console.log(
    errs.length === 0 ? "\n✅ LANDING SMOKE PASSED" : "\n⚠️ issues above",
  )
  process.exit(errs.length === 0 ? 0 : 1)
} catch (e) {
  console.error("landing smoke failed:", e.message)
  process.exit(1)
} finally {
  await browser.close()
}
