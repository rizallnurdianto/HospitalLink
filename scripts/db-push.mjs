// Terapkan setiap file SQL di supabase/migrations (terurut) ke SUPABASE_DB_URL.
// Usage: pnpm db:push
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import pg from "pg"
import { root } from "./env.mjs"

const migrationsDir = path.join(root, "supabase", "migrations")

const connectionString = process.env.SUPABASE_DB_URL
if (!connectionString) {
  console.error("Missing SUPABASE_DB_URL in .env.local")
  process.exit(1)
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort()
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8")
    process.stdout.write(`▶ ${file} ... `)
    await client.query(sql)
    console.log("ok")
  }
  console.log("\nMigrations applied.")
} catch (err) {
  console.error("\nMigration failed:", err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
