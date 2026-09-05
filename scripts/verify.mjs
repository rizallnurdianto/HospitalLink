// Snapshot cepat DB untuk pengujian end-to-end. Usage: pnpm db:verify
import pg from "pg"
import "./env.mjs"

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  const q = async (label, sql) => {
    const { rows } = await client.query(sql)
    console.log(`\n── ${label} ──`)
    console.table(rows)
  }
  await q(
    "hospitals",
    "select slug, name, is_active, updated_at from public.hospitals order by updated_at desc limit 12",
  )
  await q(
    "profiles",
    "select full_name, role, is_active from public.profiles order by created_at",
  )
  await q(
    "conversations",
    "select id, category, status, last_message_at from public.conversations order by last_message_at desc limit 10",
  )
  await q(
    "messages (latest)",
    "select conversation_id, sender_role, body, created_at from public.messages order by created_at desc limit 10",
  )
  await q(
    "activity_log (latest)",
    "select action, entity, summary, created_at from public.activity_log order by created_at desc limit 10",
  )
  await q("settings", "select key, value from public.settings order by key")
} catch (err) {
  console.error("verify failed:", err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
