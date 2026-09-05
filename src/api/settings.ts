import { supabase } from "../lib/supabase"
import type {
  Announcement,
  SettingsMap,
  SupportServiceHours,
} from "../types/db"

const DEFAULTS: SettingsMap = {
  support_service_hours: { start: 8, end: 21 },
  support_email: "bantuan@hospitalink.test",
  announcement: { enabled: false, text: "" },
}

export async function getSettings(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("settings").select("key, value")
  if (error) throw error
  const map = { ...DEFAULTS }
  for (const row of data ?? []) {
    if (row.key in map) {
      // @ts-expect-error assignment key dinamis ke map yang bertipe
      map[row.key] = row.value
    }
  }
  return map
}

export async function updateSetting<K extends keyof SettingsMap>(
  key: K,
  value: SettingsMap[K],
  updatedBy: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("settings")
    .update({
      value,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    })
    .eq("key", key)
  if (error) throw error
}

export function isWithinServiceHours(
  hours: SupportServiceHours,
  now = new Date(),
): boolean {
  const h = now.getHours()
  return h >= hours.start && h < hours.end
}

export type { Announcement }
