// Pengecekan end-to-end kedua alur terhadap database + RLS + trigger asli.
//   Admin -> DB -> Pasien   dan   Pasien -> Bantuan -> Admin
// Usage: pnpm db:e2e
import { createClient } from "@supabase/supabase-js"
import "./env.mjs"

const URL = process.env.VITE_SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL ?? "admin@hospitalink.test",
  password: process.env.TEST_ADMIN_PASSWORD ?? "Admin12345!",
}
const PATIENT = {
  email: process.env.TEST_PATIENT_EMAIL ?? "pasien@hospitalink.test",
  password: process.env.TEST_PATIENT_PASSWORD ?? "Pasien12345!",
}

let pass = 0
let fail = 0
const ok = (label) => {
  pass++
  console.log(`  ✓ ${label}`)
}
const bad = (label, detail) => {
  fail++
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`)
}
const assert = (cond, label, detail) => (cond ? ok(label) : bad(label, detail))

function client() {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
async function signIn(creds) {
  const c = client()
  const { data, error } = await c.auth.signInWithPassword(creds)
  if (error) throw new Error(`sign in ${creds.email}: ${error.message}`)
  return { c, uid: data.user.id }
}

const service = createClient(URL, SR, { auth: { persistSession: false } })
const TEST_SLUG = "rs-uji-coba-e2e"

async function cleanup() {
  await service.from("hospitals").delete().eq("slug", TEST_SLUG)
  await service.from("activity_log").delete().ilike("summary", "%Uji Coba E2E%")
  const { data: patient } = await service.auth.admin.listUsers({
    perPage: 1000,
  })
  const pid = patient.users.find((u) => u.email === PATIENT.email)?.id
  if (pid)
    await service
      .from("conversations")
      .delete()
      .eq("patient_id", pid)
      .eq("category", "e2e-test")
}

try {
  console.log("Cleaning up any previous run...")
  await cleanup()

  console.log("\n[A] Flow Admin -> Database -> Portal Pasien")
  const admin = await signIn(ADMIN)
  const patient = await signIn(PATIENT)

  // 1. admin membuat rumah sakit aktif
  const { data: created, error: createErr } = await admin.c
    .from("hospitals")
    .insert({
      slug: TEST_SLUG,
      name: "RS Uji Coba E2E",
      short_name: "Uji Coba",
      type: "Rumah Sakit Swasta",
      location: "Jakarta",
      address: "Jl. Uji Coba No. 1",
      phone: "(021) 000-0000",
      description: "Rumah sakit untuk pengujian otomatis.",
      services: ["IGD 24 Jam"],
      is_active: true,
    })
    .select("id, updated_at")
    .single()
  assert(
    !createErr && created?.id,
    "admin dapat menambah rumah sakit",
    createErr?.message,
  )

  // 2. activity_log ditulis oleh trigger
  const { data: log } = await admin.c
    .from("activity_log")
    .select("action, summary")
    .eq("entity_id", created.id)
  assert(
    log?.some((l) => l.action === "created"),
    "activity_log mencatat 'created' via trigger",
  )

  // 3. pasien melihat rumah sakit aktif yang baru
  let { data: pView } = await patient.c
    .from("hospitals")
    .select("slug")
    .eq("slug", TEST_SLUG)
  assert(pView?.length === 1, "pasien melihat RS baru di Portal Pasien")

  // 4. admin mengedit -> updated_at maju + pasien melihat data baru
  await new Promise((r) => setTimeout(r, 1100))
  const { data: edited } = await admin.c
    .from("hospitals")
    .update({ description: "Deskripsi diperbarui oleh admin." })
    .eq("id", created.id)
    .select("updated_at")
    .single()
  assert(
    new Date(edited.updated_at) > new Date(created.updated_at),
    "updated_at otomatis maju setelah edit",
  )
  const { data: pEdited } = await patient.c
    .from("hospitals")
    .select("description")
    .eq("slug", TEST_SLUG)
    .single()
  assert(
    pEdited.description === "Deskripsi diperbarui oleh admin.",
    "pasien melihat data hasil edit",
  )

  // 5. admin menonaktifkan -> tersembunyi dari pasien (RLS)
  await admin.c
    .from("hospitals")
    .update({ is_active: false })
    .eq("id", created.id)
  ;({
    data: pView,
  } = await patient.c.from("hospitals").select("slug").eq("slug", TEST_SLUG))
  assert(pView?.length === 0, "RS nonaktif hilang dari Portal Pasien (RLS)")
  const { data: anonView } = await client()
    .from("hospitals")
    .select("slug")
    .eq("slug", TEST_SLUG)
  assert(
    anonView?.length === 0,
    "pengunjung anonim juga tidak melihat RS nonaktif",
  )

  // 6. RLS: pasien tidak bisa menulis data rumah sakit
  const { error: rlsErr } = await patient.c
    .from("hospitals")
    .update({ name: "hacked" })
    .eq("id", created.id)
  const { data: stillNamed } = await service
    .from("hospitals")
    .select("name")
    .eq("id", created.id)
    .single()
  assert(
    stillNamed.name === "RS Uji Coba E2E",
    "pasien tidak bisa mengubah data RS (RLS)",
    rlsErr?.message,
  )

  console.log("\n[B] Flow Pasien -> Bantuan -> Admin")

  // 1. pasien membuka percakapan + pesan pertama
  const { data: convo, error: convoErr } = await patient.c
    .from("conversations")
    .insert({
      patient_id: patient.uid,
      category: "e2e-test",
      subject: "Uji Coba",
    })
    .select("id, status")
    .single()
  assert(
    !convoErr && convo?.status === "open",
    "pasien membuat percakapan (status open)",
    convoErr?.message,
  )

  await patient.c.from("messages").insert({
    conversation_id: convo.id,
    sender_id: patient.uid,
    sender_role: "patient",
    body: "Halo Admin, tombol simpan error.",
  })

  // 2. admin melihatnya
  const { data: adminInbox } = await admin.c
    .from("conversations")
    .select("id")
    .eq("id", convo.id)
  assert(adminInbox?.length === 1, "admin melihat percakapan pasien di inbox")

  // 3. admin membalas + set status pending
  const { error: replyErr } = await admin.c.from("messages").insert({
    conversation_id: convo.id,
    sender_id: admin.uid,
    sender_role: "admin",
    body: "Terima kasih, sedang kami cek.",
  })
  assert(!replyErr, "admin dapat membalas percakapan", replyErr?.message)
  await admin.c
    .from("conversations")
    .update({ status: "pending" })
    .eq("id", convo.id)

  // 4. pasien melihat balasan admin + status
  const { data: pMsgs } = await patient.c
    .from("messages")
    .select("sender_role, body")
    .eq("conversation_id", convo.id)
    .order("created_at")
  assert(
    pMsgs?.length === 2 && pMsgs[1].sender_role === "admin",
    "pasien melihat balasan admin secara langsung",
  )
  const { data: pConvo } = await patient.c
    .from("conversations")
    .select("status")
    .eq("id", convo.id)
    .single()
  assert(pConvo.status === "pending", "pasien melihat status 'pending'")

  // 5. pasien membalas -> trigger membuka kembali thread
  await admin.c
    .from("conversations")
    .update({ status: "resolved" })
    .eq("id", convo.id)
  await patient.c.from("messages").insert({
    conversation_id: convo.id,
    sender_id: patient.uid,
    sender_role: "patient",
    body: "Masih error nih.",
  })
  const { data: reopened } = await admin.c
    .from("conversations")
    .select("status")
    .eq("id", convo.id)
    .single()
  assert(
    reopened.status === "open",
    "balasan pasien membuka kembali percakapan (trigger)",
  )

  // 6. RLS: pasien lain / anon tidak bisa membaca pesan percakapan ini
  const { data: anonMsgs } = await client()
    .from("messages")
    .select("id")
    .eq("conversation_id", convo.id)
  assert(
    (anonMsgs?.length ?? 0) === 0,
    "pengunjung anonim tidak bisa membaca pesan percakapan (RLS)",
  )

  // 7. pasien tidak bisa memalsukan pesan sebagai admin
  const { error: forgeErr } = await patient.c.from("messages").insert({
    conversation_id: convo.id,
    sender_id: patient.uid,
    sender_role: "admin",
    body: "pura-pura admin",
  })
  assert(!!forgeErr, "pasien tidak bisa mengirim pesan sebagai admin (RLS)")

  console.log("\nCleaning up test rows...")
  await service.from("conversations").delete().eq("id", convo.id)
  await cleanup()

  console.log(
    `\n${
      fail === 0 ? "✅ ALL PASSED" : "❌ SOME FAILED"
    } — ${pass} passed, ${fail} failed`,
  )
  process.exit(fail === 0 ? 0 : 1)
} catch (err) {
  console.error("\nE2E crashed:", err.message ?? err)
  await cleanup().catch(() => {})
  process.exit(1)
}
