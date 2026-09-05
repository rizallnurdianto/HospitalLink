// Muat environment dari .env.local (diutamakan) lalu .env, meniru perilaku Vite.
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import dotenv from "dotenv"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
for (const file of [".env.local", ".env"]) {
  const full = path.join(root, file)
  if (existsSync(full)) dotenv.config({ path: full })
}

export { root }
